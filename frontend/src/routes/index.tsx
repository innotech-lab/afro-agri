import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Camera, BarChart3, Map as MapIcon, Users2, Code2, Trophy, TrendingUp, AlertTriangle, Shield, Droplets, History, Sprout, Settings, Activity, Wrench, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriVision East Africa — AI plant doctor" },
      { name: "description", content: "On-device AI plant disease scanner with offline mode, GPS hotspots, yield forecasting, and multilingual support for Burundi & Rwanda." },
    ],
  }),
  component: Landing,
});

const TILES = [
  { to: "/scan", icon: Camera, title: "Scan", body: "Diagnose a crop on-device", primary: true },
  { to: "/dashboard", icon: BarChart3, title: "National", body: "Live food security dashboard" },
  { to: "/map", icon: MapIcon, title: "Hotspots", body: "Disease map of the region" },
  { to: "/outbreaks", icon: AlertTriangle, title: "Outbreaks", body: "5km / 48h cluster alerts" },
  { to: "/yield", icon: TrendingUp, title: "Yield", body: "Estimated harvest forecast" },
  { to: "/village", icon: Users2, title: "Village", body: "50 scans → WhatsApp report" },
  { to: "/scout", icon: Trophy, title: "Scout", body: "Badges & Digital Farmer cert" },
  { to: "/learn", icon: Droplets, title: "Watering", body: "Rice & peanut schedules" },
  { to: "/history", icon: History, title: "History", body: "Your past scans" },
  { to: "/moderation", icon: Shield, title: "Moderate", body: "Approve corrections" },
  { to: "/developer", icon: Code2, title: "Developer", body: "API keys & billing" },
  { to: "/settings", icon: Settings, title: "Settings", body: "Pest alert thresholds" },
  { to: "/self-test", icon: Activity, title: "Self-Test", body: "TTS, share & API check" },
  { to: "/scan-troubleshoot", icon: Wrench, title: "Scan Doctor", body: "Diagnose Save failures" },
  { to: "/diagnostics", icon: Stethoscope, title: "Diagnostics", body: "AI backend, model & logs" },
];

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-hero text-primary-foreground p-6 shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}/>
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-medium"><Sprout className="size-3"/>AgriVision East Africa</div>
          <h1 className="mt-3 text-3xl font-display font-bold leading-tight">AI plant doctor<br/>for every farmer.</h1>
          <p className="mt-2 text-sm opacity-90">{t("hero.sub")}</p>
          <Link to="/scan" className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent text-accent-foreground font-bold shadow-soft active:scale-95 transition">
            <Camera className="size-5"/>{t("hero.cta")}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {TILES.map(({ to, icon: Icon, title, body, primary }) => (
          <Link key={to} to={to} className={`rounded-2xl p-4 border transition active:scale-[0.98] ${primary ? "bg-primary text-primary-foreground border-primary col-span-2" : "bg-card border-border hover:border-primary"}`}>
            <div className={`size-9 rounded-xl grid place-items-center mb-2 ${primary ? "bg-white/20" : "bg-primary/10 text-primary"}`}><Icon className="size-5"/></div>
            <div className="font-display font-semibold">{title}</div>
            <div className={`text-xs ${primary ? "opacity-90" : "text-muted-foreground"}`}>{body}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
