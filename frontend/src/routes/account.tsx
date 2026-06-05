import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getBankSize } from "@/lib/model";
import { useEffect, useState } from "react";
import { Brain, LogOut } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — AgriVision" }, { name: "description", content: "Manage your AgriVision account." }] }),
  component: Account,
});

function Account() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const nav = useNavigate();
  const [bank, setBank] = useState(0);
  useEffect(() => { setBank(getBankSize()); }, []);

  if (!user) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-muted-foreground">{t("scan.needLogin")}</p>
      <Link to="/auth" className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">{t("auth.signIn")}</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">{t("nav.account")}</h1>
      <div className="rounded-2xl bg-card p-5 border border-border shadow-soft">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Email</div>
        <div className="font-medium">{user.email}</div>
      </div>
      <div className="rounded-2xl bg-card p-5 border border-border shadow-soft flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><Brain className="size-5"/></div>
        <div>
          <div className="font-semibold">On-device image bank</div>
          <div className="text-sm text-muted-foreground">{bank} corrected images learned</div>
        </div>
      </div>
      <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }} className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center justify-center gap-2">
        <LogOut className="size-4"/> {t("auth.signOut")}
      </button>
    </div>
  );
}
