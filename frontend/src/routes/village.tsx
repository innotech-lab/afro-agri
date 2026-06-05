import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { analyze } from "@/lib/model";
import { mapPredictionToDisease } from "@/lib/diseases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, FileText, Share2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/village")({
  head: () => ({ meta: [{ title: "Village Mode — AgriVision" }, { name: "description", content: "Batch-scan up to 50 plants and share the village health report." }] }),
  component: Village,
});

type Row = { label: string; crop: string; healthy: boolean };

function Village() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [village, setVillage] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const onPick = async (f: File) => {
    if (rows.length >= 50) return toast.info("Report is full (50 scans)");
    setImageUrl(URL.createObjectURL(f));
    setRunning(true);
    await new Promise(r => setTimeout(r, 60));
    if (imgRef.current && !imgRef.current.complete) {
      await new Promise(r => imgRef.current!.addEventListener("load", r, { once: true }));
    }
    try {
      const res = await analyze(imgRef.current!);
      const top = res.predictions[0];
      const d = mapPredictionToDisease(top.label, "maize");
      setRows(r => [...r, { label: d.name, crop: "maize", healthy: /healthy/i.test(d.name) }]);
    } catch (e: any) { toast.error(e.message); }
    setRunning(false);
    setImageUrl(null);
  };

  const summary = {
    total: rows.length,
    healthy: rows.filter(r => r.healthy).length,
    sick: rows.filter(r => !r.healthy).length,
    diseases: rows.reduce<Record<string, number>>((acc, r) => { if (!r.healthy) acc[r.label] = (acc[r.label] || 0) + 1; return acc; }, {}),
  };

  const saveAndShare = async () => {
    if (!user) return toast.error("Sign in to save");
    if (rows.length === 0) return;
    await supabase.from("village_reports").insert({ user_id: user.id, village, scan_count: rows.length, summary });
    const text = encodeURIComponent(
      `🌱 AgriVision Village Report — ${village || "Our village"}\n` +
      `Scans: ${summary.total} · Healthy: ${summary.healthy} · Sick: ${summary.sick}\n` +
      Object.entries(summary.diseases).map(([k, v]) => `• ${k}: ${v}`).join("\n")
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Village Mode</h1>
        <p className="text-sm text-muted-foreground">Scan up to 50 plants and generate one report.</p>
      </div>

      <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village name" className="w-full px-3 py-2 rounded-xl bg-input border border-border"/>

      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Progress: {rows.length}/50</div>
          <div className="text-xs text-muted-foreground">{summary.healthy} healthy · {summary.sick} sick</div>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(rows.length/50)*100}%` }}/></div>
      </div>

      <label className="block rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center cursor-pointer hover:border-primary">
        {running ? <Loader2 className="size-8 animate-spin mx-auto text-primary"/> : <Camera className="size-8 mx-auto text-primary"/>}
        <div className="font-medium mt-2">{running ? "Analyzing…" : "Scan next plant"}</div>
        <input type="file" accept="image/*" capture="environment" className="hidden" disabled={running} onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}/>
      </label>
      {imageUrl && <img ref={imgRef} src={imageUrl} crossOrigin="anonymous" className="hidden" alt=""/>}

      {rows.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2"><FileText className="size-5"/>Report</h2>
          <ul className="text-sm space-y-1">
            <li>Total scans: <b>{summary.total}</b></li>
            <li>Healthy: <b className="text-primary">{summary.healthy}</b></li>
            <li>Sick: <b className="text-destructive">{summary.sick}</b></li>
            {Object.entries(summary.diseases).map(([k, v]) => <li key={k}>• {k}: {v}</li>)}
          </ul>
          <button onClick={saveAndShare} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
            <Share2 className="size-4"/>Save & Share via WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
