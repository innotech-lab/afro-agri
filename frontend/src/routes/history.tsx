import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; crop: string; predicted_label: string; corrected_label: string | null; confidence: number; created_at: string };

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — AgriVision" }, { name: "description", content: "Browse your past scans." }] }),
  component: History,
});

function History() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [user]);

  if (!user) return <div className="text-center py-20"><Link to="/auth" className="text-primary underline">{t("auth.signIn")}</Link></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("history.title")}</h1>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("history.empty")}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card p-4 border border-border flex justify-between items-center">
              <div>
                <div className="font-semibold">{r.corrected_label || r.predicted_label}</div>
                <div className="text-xs text-muted-foreground">{r.crop} · {Math.round(r.confidence*100)}% · {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              {r.corrected_label && <span className="text-[10px] uppercase font-bold tracking-wider text-primary">corrected</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
