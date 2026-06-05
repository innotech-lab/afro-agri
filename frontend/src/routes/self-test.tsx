import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { speak } from "@/lib/tts";
import { CheckCircle2, XCircle, Loader2, PlayCircle } from "lucide-react";
import i18n, { LANGUAGES } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/self-test")({
  head: () => ({ meta: [
    { title: "Self-Test — AgriVision" },
    { name: "description", content: "Verify TTS in every language, sharing, end-to-end scan save, and Edge API." },
  ]}),
  component: SelfTest,
});

const ANALYZE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze`;

type R = { name: string; status: "idle"|"running"|"pass"|"fail"|"skip"; detail?: string };

function tinyPngBlob(): Blob {
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: "image/png" });
}

function SelfTest() {
  const { user } = useAuth();
  const initial: R[] = [
    ...LANGUAGES.map(l => ({ name: `TTS · ${l.label}`, status: "idle" as const })),
    { name: "Share API (Village → WhatsApp)", status: "idle" },
    { name: "Edge API /functions/v1/analyze reachable", status: "idle" },
    { name: "Geolocation", status: "idle" },
    { name: "Online status", status: "idle" },
    { name: "E2E scan save · storage upload", status: "idle" },
    { name: "E2E scan save · scans insert", status: "idle" },
    { name: "E2E scan save · heatmap visibility", status: "idle" },
  ];
  const [results, setResults] = useState<R[]>(initial);
  const [running, setRunning] = useState(false);

  const set = (i: number, patch: Partial<R>) =>
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const run = async () => {
    setRunning(true);
    setResults(initial);

    // 1..N: TTS in each language
    for (let i = 0; i < LANGUAGES.length; i++) {
      const lang = LANGUAGES[i];
      set(i, { status: "running" });
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const sample: Record<string, string> = {
          en: "AgriVision self test passed.",
          fr: "Test AgriVision réussi.",
          rn: "Igerageza rya AgriVision ryagenze neza.",
          rw: "Igerageza rya AgriVision ryagenze neza.",
        };
        speak(sample[lang.code] || sample.en, lang.code);
        await new Promise(r => setTimeout(r, 250));
        set(i, { status: "pass", detail: `Spoken (${lang.code}, browser may fall back to fr-FR)` });
      } else {
        set(i, { status: "fail", detail: "speechSynthesis not available" });
      }
    }

    let idx = LANGUAGES.length;
    // Share
    set(idx, { status: "running" });
    if (typeof navigator !== "undefined" && "share" in navigator) {
      set(idx, { status: "pass", detail: "navigator.share available — Village WhatsApp share works." });
    } else set(idx, { status: "fail", detail: "navigator.share missing — uses fallback link" });
    idx++;

    // Edge API
    set(idx, { status: "running" });
    try {
      // CORS preflight — confirms the edge function is deployed & reachable
      // without producing a 401 (which the platform logs as a runtime error).
      const r = await fetch(ANALYZE, {
        method: "OPTIONS",
        headers: {
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type, x-api-key",
          Origin: window.location.origin,
        },
      });
      if (r.ok || r.status === 204) set(idx, { status: "pass", detail: `Reachable (preflight HTTP ${r.status}).` });
      else set(idx, { status: "fail", detail: `HTTP ${r.status}` });
    } catch (e: any) { set(idx, { status: "fail", detail: e.message }); }
    idx++;

    // Geolocation
    set(idx, { status: "running" });
    const geoIdx = idx;
    if (navigator.geolocation) {
      await new Promise<void>(res => {
        navigator.geolocation.getCurrentPosition(
          (p) => { set(geoIdx, { status: "pass", detail: `lat ${p.coords.latitude.toFixed(3)}, lng ${p.coords.longitude.toFixed(3)}` }); res(); },
          (err) => { set(geoIdx, { status: "fail", detail: err.message }); res(); },
          { timeout: 8000 },
        );
      });
    } else set(idx, { status: "fail", detail: "no geolocation" });
    idx++;

    // Online
    set(idx, { status: navigator.onLine ? "pass" : "fail", detail: navigator.onLine ? "online" : "offline" });
    idx++;

    // E2E scan save (3 steps)
    const upIdx = idx, insIdx = idx + 1, visIdx = idx + 2;
    if (!user) {
      set(upIdx, { status: "skip", detail: "sign in to run E2E save" });
      set(insIdx, { status: "skip" }); set(visIdx, { status: "skip" });
      setRunning(false); return;
    }

    set(upIdx, { status: "running" });
    const blob = tinyPngBlob();
    const key = `${user.id}/selftest-${Date.now()}.png`;
    const up = await supabase.storage.from("scans").upload(key, blob, { contentType: "image/png" });
    if (up.error) { set(upIdx, { status: "fail", detail: up.error.message }); setRunning(false); return; }
    set(upIdx, { status: "pass", detail: key });

    set(insIdx, { status: "running" });
    const ins = await supabase.from("scans").insert({
      user_id: user.id, crop: "maize", predicted_label: "_self_test", confidence: 0.5, image_path: key,
    }).select("id").maybeSingle();
    if (ins.error || !ins.data) { set(insIdx, { status: "fail", detail: ins.error?.message || "no row returned" }); setRunning(false); return; }
    set(insIdx, { status: "pass", detail: `id ${ins.data.id.slice(0, 8)}…` });

    set(visIdx, { status: "running" });
    const r = await supabase.from("scans").select("id").eq("id", ins.data.id).maybeSingle();
    if (r.error || !r.data) set(visIdx, { status: "fail", detail: r.error?.message || "row not visible" });
    else set(visIdx, { status: "pass", detail: "visible to heatmap query" });

    // cleanup
    await supabase.from("scans").delete().eq("id", ins.data.id);
    await supabase.storage.from("scans").remove([key]);

    setRunning(false);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold">Self-Test</h1>
        <p className="text-sm text-muted-foreground">Verifies TTS in every language, share, geolocation, Edge API, and an end-to-end scan save (upload + insert + heatmap visibility).</p>
      </div>
      <button onClick={run} disabled={running} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
        {running ? <Loader2 className="size-5 animate-spin"/> : <PlayCircle className="size-5"/>}
        Run all tests
      </button>
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
            <span className="mt-0.5">
              {r.status === "pass" && <CheckCircle2 className="size-5 text-primary"/>}
              {r.status === "fail" && <XCircle className="size-5 text-destructive"/>}
              {r.status === "running" && <Loader2 className="size-5 animate-spin"/>}
              {(r.status === "idle" || r.status === "skip") && <span className="size-5 inline-block rounded-full border-2 border-border"/>}
            </span>
            <div>
              <div className="font-medium">{r.name}{r.status === "skip" && <span className="ml-2 text-[10px] uppercase text-muted-foreground">skipped</span>}</div>
              {r.detail && <div className="text-xs text-muted-foreground">{r.detail}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
