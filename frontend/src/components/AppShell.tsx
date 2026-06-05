import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Camera, Map, BarChart3, Users2, Sprout, Home } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { useEffect } from "react";
import i18n from "@/lib/i18n";

export function AppShell() {
  const { t } = useTranslation();
  const loc = useLocation();

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
  }, []);

  const tabs = [
    { to: "/", icon: Home, label: "Home", exact: true },
    { to: "/scan", icon: Camera, label: t("nav.scan") },
    { to: "/dashboard", icon: BarChart3, label: t("nav.dashboard") },
    { to: "/map", icon: Map, label: t("nav.map") },
    { to: "/village", icon: Users2, label: t("nav.village") },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="size-8 rounded-xl bg-hero grid place-items-center text-primary-foreground shadow-glow">
              <Sprout className="size-4" />
            </span>
            AgriVision
          </Link>
          <select
            aria-label={t("lang")}
            className="text-xs bg-secondary text-secondary-foreground px-2 py-1.5 rounded-lg border border-border"
            value={i18n.language}
            onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-5">
          {tabs.map(({ to, icon: Icon, label, exact }) => {
            const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className={`size-5 ${active ? "stroke-[2.5]" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
