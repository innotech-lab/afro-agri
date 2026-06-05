import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter } from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Hotspots — AgriVision" }, { name: "description", content: "Live disease hotspot map for Burundi & Rwanda." }] }),
  component: MapPage,
});

type Scan = { id: string; latitude: number; longitude: number; predicted_label: string; corrected_label: string | null; crop: string; created_at: string };

const MapView = lazy(() => import("@/components/MapView"));

function isoDays(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10);
}

function MapPage() {
  const { t } = useTranslation();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(isoDays(30));
  const [to, setTo] = useState(isoDays(0));
  const [disease, setDisease] = useState<string>("all");

  useEffect(() => {
    supabase.from("scans").select("id,latitude,longitude,predicted_label,corrected_label,crop,created_at")
      .not("latitude", "is", null).order("created_at", { ascending: false }).limit(2000)
      .then(({ data }) => { setScans((data as Scan[]) ?? []); setLoading(false); });
  }, []);

  const diseaseOptions = useMemo(() => {
    const set = new Set<string>();
    scans.forEach(s => set.add((s.corrected_label || s.predicted_label || "unknown").toLowerCase()));
    return ["all", ...Array.from(set).sort()];
  }, [scans]);

  const filtered = useMemo(() => {
    const fromTs = new Date(from + "T00:00:00").getTime();
    const toTs = new Date(to + "T23:59:59").getTime();
    return scans.filter(s => {
      const ts = new Date(s.created_at).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (disease !== "all") {
        const label = (s.corrected_label || s.predicted_label || "").toLowerCase();
        if (label !== disease) return false;
      }
      return true;
    });
  }, [scans, from, to, disease]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t("map.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("map.sub")}</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-input border border-border text-sm"/>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-input border border-border text-sm"/>
        </div>
        <div className="col-span-2">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Filter className="size-3"/>Disease</label>
          <select value={disease} onChange={e => setDisease(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-input border border-border text-sm">
            {diseaseOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-border shadow-soft h-[60vh] bg-card">
        {loading ? (
          <div className="grid place-items-center h-full text-muted-foreground"><Loader2 className="size-6 animate-spin"/></div>
        ) : (
          <Suspense fallback={<div className="grid place-items-center h-full"><Loader2 className="size-6 animate-spin"/></div>}>
            <MapView scans={filtered} />
          </Suspense>
        )}
      </div>
      <div className="text-xs text-muted-foreground text-center">{filtered.length} / {scans.length} {t("map.legend")}</div>
    </div>
  );
}
