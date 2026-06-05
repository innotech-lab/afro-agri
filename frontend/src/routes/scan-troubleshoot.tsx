import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, XCircle, Loader2, Wrench, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/scan-troubleshoot")({
  head: () => ({ meta: [
    { title: "Scan Save Troubleshooter — AgriVision" },
    { name: "description", content: "Diagnose why a scan failed to save: sign-in, RLS, storage, insert." },
  ]}),
  component: Troubleshoot,
});

type Step = { name: string; status: "idle" | "run" | "pass" | "fail" | "skip"; detail?: string };

function Troubleshoot() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[]>([
    { name: "1. Signed in", status: "idle" },
    { name: "2. Profile row exists (RLS)", status: "idle" },
    { name: "3. Storage bucket 'scans' upload", status: "idle" },
    { name: "4. Storage bucket 'retraining_required' upload", status: "idle" },
    { name: "5. Insert into scans table (RLS)", status: "idle" },
    { name: "6. Read inserted scan back", status: "idle" },
  ]);
  const [running, setRunning] = useState(false);
  const [firstFail, setFirstFail] = useState<string | null>(null);

  const set = (i: number, p: Partial<Step>) => setSteps((s) => s.map((x, idx) => idx === i ? { ...x, ...p } : x));

  async function tinyPng(): Promise<Blob> {
    // 1×1 transparent PNG
    const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: "image/png" });
  }

  const run = async () => {
    setRunning(true); setFirstFail(null);
    setSteps((s) => s.map(x => ({ ...x, status: "idle", detail: undefined })));

    // 1. signed in
    set(0, { status: "run" });
    if (!user) { set(0, { status: "fail", detail: "No user. Open /auth and sign in." }); setFirstFail("Sign in required"); setRunning(false); return; }
    set(0, { status: "pass", detail: user.email ?? user.id });

    // 2. profile via RLS
    set(1, { status: "run" });
    const { data: prof, error: pErr } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (pErr) { set(1, { status: "fail", detail: `RLS blocked profile read: ${pErr.message}` }); setFirstFail("Profile RLS"); setRunning(false); return; }
    if (!prof) { set(1, { status: "fail", detail: "No profile row — sign out + sign up again to trigger handle_new_user." }); setFirstFail("Missing profile"); setRunning(false); return; }
    set(1, { status: "pass", detail: "OK" });

    // 3. storage scans bucket
    set(2, { status: "run" });
    const blob = await tinyPng();
    const k1 = `${user.id}/troubleshoot-${Date.now()}.png`;
    const u1 = await supabase.storage.from("scans").upload(k1, blob, { contentType: "image/png" });
    if (u1.error) { set(2, { status: "fail", detail: u1.error.message }); setFirstFail("Bucket 'scans' upload"); setRunning(false); return; }
    set(2, { status: "pass", detail: k1 });

    // 4. retraining_required
    set(3, { status: "run" });
    const k2 = `${user.id}/troubleshoot-${Date.now()}.png`;
    const u2 = await supabase.storage.from("retraining_required").upload(k2, blob, { contentType: "image/png" });
    if (u2.error) { set(3, { status: "fail", detail: u2.error.message }); setFirstFail("Bucket 'retraining_required' upload"); setRunning(false); return; }
    set(3, { status: "pass", detail: k2 });

    // 5. insert scan
    set(4, { status: "run" });
    const ins = await supabase.from("scans").insert({
      user_id: user.id, crop: "maize", predicted_label: "_self_test", confidence: 0.5, image_path: k1,
    }).select("id").maybeSingle();
    if (ins.error) { set(4, { status: "fail", detail: `Insert blocked: ${ins.error.message}` }); setFirstFail("Scans insert RLS"); setRunning(false); return; }
    set(4, { status: "pass", detail: `id ${ins.data?.id?.slice(0,8)}…` });

    // 6. read back
    set(5, { status: "run" });
    const r = await supabase.from("scans").select("id").eq("id", ins.data!.id).maybeSingle();
    if (r.error || !r.data) { set(5, { status: "fail", detail: r.error?.message || "Row not visible" }); setFirstFail("Heatmap visibility"); setRunning(false); return; }
    set(5, { status: "pass", detail: "Visible to heatmap" });

    // cleanup
    await supabase.from("scans").delete().eq("id", ins.data!.id);
    await supabase.storage.from("scans").remove([k1]);
    await supabase.storage.from("retraining_required").remove([k2]);

    setRunning(false);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Wrench className="text-primary"/>Scan Save Troubleshooter</h1>
        <p className="text-sm text-muted-foreground">Runs the same checks the Save button does and tells you the exact failing step.</p>
      </div>
      {!user && <Link to="/auth" className="block px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm">Sign in first →</Link>}
      <button onClick={run} disabled={running} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
        {running ? <Loader2 className="size-5 animate-spin"/> : <PlayCircle className="size-5"/>}
        Run end-to-end check
      </button>
      {firstFail && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="font-semibold text-destructive">First failing step: {firstFail}</div>
          <div className="text-sm text-muted-foreground mt-1">Fix it and re-run. The other steps were skipped.</div>
        </div>
      )}
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
            <span className="mt-0.5">
              {s.status === "pass" && <CheckCircle2 className="size-5 text-primary"/>}
              {s.status === "fail" && <XCircle className="size-5 text-destructive"/>}
              {s.status === "run" && <Loader2 className="size-5 animate-spin"/>}
              {(s.status === "idle" || s.status === "skip") && <span className="size-5 inline-block rounded-full border-2 border-border"/>}
            </span>
            <div className="min-w-0">
              <div className="font-medium">{s.name}</div>
              {s.detail && <div className="text-xs text-muted-foreground break-all">{s.detail}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
