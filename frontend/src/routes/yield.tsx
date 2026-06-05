import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Loader2 } from "lucide-react";

export const Route = createFileRoute("/yield")({
  head: () => ({ meta: [{ title: "Harvest Yield Forecast — AgriVision" }, { name: "description", content: "Estimated harvest yield by crop, derived from health and growth stages of farmer scans." }] }),
  component: Yield,
});

// Approx baseline yield t/ha for the region
const BASELINE: Record<string, number> = { maize: 2.5, rice: 4, peanuts: 1.2, beans: 1.5, cassava: 12, banana: 18, coffee: 0.8, tea: 1.5, tomato: 25, mango: 8 };

type S = { crop: string; predicted_label: string; corrected_label: string | null };

function Yield() {
  const [scans, setScans] = useState<S[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("scans").select("crop,predicted_label,corrected_label").limit(1000)
      .then(({ data }) => { setScans((data as any) ?? []); setLoading(false); });
  }, []);
  const rows = useMemo(() => {
    const byCrop: Record<string, { total: number; healthy: number }> = {};
    scans.forEach(s => {
      byCrop[s.crop] ??= { total: 0, healthy: 0 };
      byCrop[s.crop].total++;
      const label = (s.corrected_label || s.predicted_label || "").toLowerCase();
      if (/healthy/.test(label)) byCrop[s.crop].healthy++;
    });
    return Object.entries(byCrop).map(([crop, v]) => {
      const healthRatio = v.healthy / Math.max(1, v.total);
      const baseline = BASELINE[crop] ?? 2;
      const expected = +(baseline * (0.4 + healthRatio * 0.7)).toFixed(2);
      return { crop, total: v.total, healthRatio, baseline, expected };
    }).sort((a, b) => b.total - a.total);
  }, [scans]);

  if (loading) return <div className="grid place-items-center h-64"><Loader2 className="animate-spin"/></div>;

  const max = Math.max(1, ...rows.map(r => Math.max(r.baseline, r.expected)));
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="text-primary"/>Harvest Yield Forecast</h1>
        <p className="text-sm text-muted-foreground">Estimated yield (t/ha) per crop, weighted by farmer-scan health scores.</p>
      </header>
      {rows.length === 0 ? <div className="text-center text-muted-foreground py-10">No scans yet.</div> : (
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.crop} className="rounded-2xl bg-card border border-border p-4">
              <div className="flex justify-between items-baseline"><div className="font-semibold capitalize">{r.crop}</div><div className="text-xs text-muted-foreground">{r.total} scans · {Math.round(r.healthRatio * 100)}% healthy</div></div>
              <div className="mt-3 space-y-2">
                <Bar label="Baseline" value={r.baseline} max={max} color="bg-muted-foreground/40"/>
                <Bar label="Forecast" value={r.expected} max={max} color={r.expected >= r.baseline ? "bg-primary" : "bg-destructive"}/>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span>{label}</span><span className="font-mono">{value} t/ha</span></div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden mt-0.5"><div className={`h-full ${color}`} style={{ width: `${(value / max) * 100}%` }}/></div>
    </div>
  );
}
