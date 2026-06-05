import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/outbreaks")({
  head: () => ({ meta: [{ title: "Outbreak Detection — AgriVision" }, { name: "description", content: "Automatically clusters disease scans within a 5km radius and 48h window to flag local outbreaks." }] }),
  component: Outbreaks,
});

type Scan = { id: string; latitude: number; longitude: number; predicted_label: string; corrected_label: string | null; crop: string; created_at: string; province: string | null };

const RADIUS_KM = 5;
const WINDOW_H = 48;
const THRESHOLD = 10;

function distKm(a: Scan, b: Scan) {
  const R = 6371, toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude), dLng = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.latitude))*Math.cos(toRad(b.latitude))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function Outbreaks() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const since = new Date(Date.now() - WINDOW_H * 3600_000).toISOString();
    supabase.from("scans").select("id,latitude,longitude,predicted_label,corrected_label,crop,created_at,province")
      .gte("created_at", since).not("latitude", "is", null).limit(1000)
      .then(({ data }) => { setScans((data as any) ?? []); setLoading(false); });
  }, []);

  const clusters = useMemo(() => {
    const sick = scans.filter(s => !/healthy/i.test(s.corrected_label || s.predicted_label));
    const visited = new Set<string>();
    const out: { center: Scan; members: Scan[]; province: string | null }[] = [];
    for (const s of sick) {
      if (visited.has(s.id)) continue;
      const members = sick.filter(o => distKm(s, o) <= RADIUS_KM);
      if (members.length >= THRESHOLD) {
        members.forEach(m => visited.add(m.id));
        out.push({ center: s, members, province: s.province });
      }
    }
    return out;
  }, [scans]);

  if (loading) return <div className="grid place-items-center h-64"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="text-destructive"/>Outbreak Detection</h1>
        <p className="text-sm text-muted-foreground">Clusters of {THRESHOLD}+ disease scans within {RADIUS_KM} km in the last {WINDOW_H}h.</p>
      </header>
      {clusters.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No outbreaks detected. ✅</div>
      ) : (
        <ul className="space-y-3">
          {clusters.map((c, i) => {
            const labels = c.members.map(m => (m.corrected_label || m.predicted_label).split(",")[0]);
            const tally: Record<string, number> = {};
            labels.forEach(l => tally[l] = (tally[l] || 0) + 1);
            const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3);
            return (
              <li key={i} className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 animate-pulse-slow">
                <div className="flex justify-between"><div className="font-bold text-destructive">{c.province ?? "Unknown area"}</div><div className="text-2xl font-display font-bold">{c.members.length}</div></div>
                <div className="text-xs text-muted-foreground">@ {c.center.latitude.toFixed(3)}, {c.center.longitude.toFixed(3)}</div>
                <ul className="mt-2 text-sm space-y-0.5">{top.map(([l, n]) => <li key={l}>• {l} × {n}</li>)}</ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
