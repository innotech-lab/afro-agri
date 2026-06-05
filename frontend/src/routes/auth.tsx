import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — AgriVision" }, { name: "description", content: "Sign in or create an account on AgriVision East Africa." }] }),
  component: Auth,
});

function Auth() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fn = mode === "in" ? supabase.auth.signInWithPassword({ email, password: pw }) : supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } });
    const { error } = await fn;
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(mode === "in" ? "Welcome back" : "Account created");
    nav({ to: "/scan" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-hero">
      <div className="w-full max-w-sm bg-card rounded-3xl p-8 shadow-soft">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl mb-6">
          <span className="size-9 rounded-xl bg-hero grid place-items-center text-primary-foreground"><Sprout className="size-4"/></span>
          Smart Crop Commander
        </Link>
        <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
          {(["in", "up"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === m ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
              {m === "in" ? t("auth.signIn") : t("auth.signUp")}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary outline-none" />
          <input required type="password" minLength={6} placeholder={t("auth.password")} value={pw} onChange={(e) => setPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary outline-none" />
          <button disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
            {loading ? "…" : t("auth.continue")}
          </button>
        </form>
      </div>
    </div>
  );
}
