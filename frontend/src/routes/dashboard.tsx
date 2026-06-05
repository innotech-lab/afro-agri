import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { provinceFor } from "@/lib/provinces";
import { thresholdFor } from "@/lib/settings";
import { AlertTriangle, Users, Sprout, Activity, Crown, Loader2, Settings } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "National Intelligence — AgriVision" }, { name: "description", content: "Live food security dashboard with heatmap, province health scores and pest alerts." }] }),
  component: Dashboard,
});

const MapView = lazy(() => import("@/components/MapView"));

type Scan = { id: string; latitude: number; longitude: number; predicted_label: string; corrected_label: string | null; crop: string; created_at: string; user_id: string | null };

function Dashboard() {
  const { t } = useTranslation();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [presidential, setPresidential] = useState(false);

  useEffect(() => {
    supabase.from("scans").select("id,latitude,longitude,predicted_label,corrected_label,crop,created_at,user_id")
      .order("created_at", { ascending: false }).limit(1000)
      .then(({ data }) => { setScans((data as any) ?? []); setLoading(false); });
  }, []);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todays = scans.filter((s) => new Date(s.created_at) >= today);
    const scouts = new Set(scans.filter(s => s.user_id).map(s => s.user_id)).size;
    const hectares = (todays.length * 0.05).toFixed(2);
    const provinces: Record<string, { total: number; sick: number; country: string }> = {};
    const pestCounts: Record<string, number> = {};
    scans.filter(s => s.latitude && s.longitude).forEach(s => {
      const p = provinceFor(s.latitude, s.longitude);
      const k = p.name;
      provinces[k] ??= { total: 0, sick: 0, country: p.country };
      provinces[k].total++;
      const label = (s.corrected_label || s.predicted_label || "").toLowerCase();
      if (!/healthy/.test(label)) provinces[k].sick++;
      if (/armyworm|fall army|spodoptera/i.test(label)) {
        pestCounts[k] = (pestCounts[k] || 0) + 1;
      }
    });
    const provinceList = Object.entries(provinces).map(([name, v]) => ({
      name, ...v, score: Math.round(((v.total - v.sick) / Math.max(1, v.total)) * 100),
    })).sort((a, b) => b.total - a.total);
    const alerts = Object.entries(pestCounts).filter(([n, c]) => c >= thresholdFor(n)).map(([n, c]) => ({ name: n, count: c, threshold: thresholdFor(n) }));
    const healthy = scans.filter(s => /healthy/i.test(s.corrected_label || s.predicted_label)).length;
    const nationalScore = Math.round((healthy / Math.max(1, scans.length)) * 100);
    return { todays: todays.length, scouts, hectares, provinceList, alerts, nationalScore };
  }, [scans]);

  if (loading) return <div className="grid place-items-center h-96"><Loader2 className="size-6 animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t("dash.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dash.sub")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/settings" className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-card border border-border"><Settings className="size-3.5"/>Thresholds</Link>
          <button onClick={() => setPresidential(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${presidential ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border"}`}>
            <Crown className="size-4"/> {t("dash.presidential")}
          </button>
        </div>
      </div>

      

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 font-bold text-destructive animate-pulse">
            <AlertTriangle className="size-5"/> {t("dash.pestAlert")}
          </div>
          <ul className="mt-2 text-sm space-y-1">
            {stats.alerts.map(a => <li key={a.name}>• <b>{a.name}</b> — Fall Armyworm × {a.count} <span className="text-xs opacity-70">(threshold {a.threshold})</span></li>)}
          </ul>
        </div>
      )}

      {presidential ? (
        <div className="rounded-3xl bg-hero text-primary-foreground p-8 shadow-glow">
          <div className="text-xs uppercase tracking-widest opacity-80">{t("dash.foodSecurity")}</div>
          <div className="text-7xl font-display font-bold mt-2">{stats.nationalScore}%</div>
          <div className="opacity-90">{t("dash.healthyShare")}</div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-3xl font-bold">{stats.scouts}</div><div className="opacity-80">{t("dash.scouts")}</div></div>
            <div><div className="text-3xl font-bold">{stats.todays}</div><div className="opacity-80">{t("dash.scansToday")}</div></div>
            <div><div className="text-3xl font-bold">{stats.hectares}</div><div className="opacity-80">ha</div></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={Activity} label={t("dash.scansToday")} value={stats.todays}/>
            <Stat icon={Users} label={t("dash.scouts")} value={stats.scouts}/>
            <Stat icon={Sprout} label="Hectares" value={stats.hectares}/>
            <Stat icon={Crown} label={t("dash.foodSecurity")} value={`${stats.nationalScore}%`}/>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-border bg-card h-[55vh]">
              <Suspense fallback={<div className="h-full grid place-items-center"><Loader2 className="animate-spin size-6"/></div>}>
                <MapView scans={scans.filter(s => s.latitude) as any}/>
              </Suspense>
            </div>
            <div className="rounded-3xl bg-card border border-border p-4 max-h-[55vh] overflow-y-auto">
              <h3 className="font-display font-semibold text-lg mb-3">{t("dash.byProvince")}</h3>
              <ul className="space-y-2">
                {stats.provinceList.map(p => (
                  <li key={p.name} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{p.name} <span className="text-[10px] text-muted-foreground">{p.country}</span></div>
                      <div className="text-xs text-muted-foreground">{p.total} scans · {p.sick} sick</div>
                    </div>
                    <div className={`text-lg font-bold ${p.score > 75 ? "text-primary" : p.score > 50 ? "text-accent" : "text-destructive"}`}>{p.score}%</div>
                  </li>
                ))}
                {stats.provinceList.length === 0 && <li className="text-sm text-muted-foreground">No GPS scans yet.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <Icon className="size-5 text-primary"/>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
