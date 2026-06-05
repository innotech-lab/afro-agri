import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Shield, Check, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/moderation")({
  head: () => ({ meta: [{ title: "Moderation — AgriVision" }, { name: "description", content: "Approve or reject user-submitted label corrections before they affect the learning model." }] }),
  component: Moderation,
});

type PendingScan = { id: string; predicted_label: string; corrected_label: string | null; crop: string; image_path: string | null; created_at: string; user_id: string | null };

function Moderation() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<PendingScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
      if (data) await load();
      setLoading(false);
    })();
  }, [user]);

  async function load() {
    const { data } = await supabase.from("scans")
      .select("id,predicted_label,corrected_label,crop,image_path,created_at,user_id")
      .not("corrected_label", "is", null)
      .eq("correction_status" as any, "pending")
      .order("created_at", { ascending: false }).limit(50);
    setItems((data as any) ?? []);
  }

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("scans").update({ correction_status: status } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Correction ${status}`);
    setItems(items.filter(i => i.id !== id));
  }

  function imgUrl(path: string | null) {
    if (!path) return null;
    return supabase.storage.from("scans").getPublicUrl(path).data.publicUrl;
  }

  if (loading) return <div className="grid place-items-center h-64"><Loader2 className="animate-spin"/></div>;
  if (!user) return <Empty title="Sign in required" body="Sign in with an admin account."/>;
  if (!isAdmin) return <Empty title="Admins only" body="Your account does not have moderator access."/>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-primary"/>Correction Moderation</h1>
        <p className="text-sm text-muted-foreground">Approved corrections feed into the global learning model.</p>
      </header>
      {items.length === 0 ? <Empty title="All clear" body="No pending corrections."/> : (
        <ul className="space-y-3">
          {items.map(it => {
            const url = imgUrl(it.image_path);
            return (
              <li key={it.id} className="rounded-2xl bg-card border border-border p-3 flex gap-3">
                {url && <img src={url} alt="" className="size-20 rounded-xl object-cover flex-none"/>}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{it.crop} · {new Date(it.created_at).toLocaleString()}</div>
                  <div className="text-sm"><span className="text-muted-foreground line-through">{it.predicted_label}</span></div>
                  <div className="font-semibold text-primary truncate">→ {it.corrected_label}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => decide(it.id, "approved")} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Check className="size-5"/></button>
                  <button onClick={() => decide(it.id, "rejected")} className="size-10 rounded-full bg-destructive text-destructive-foreground grid place-items-center"><X className="size-5"/></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center"><div className="font-semibold">{title}</div><div className="text-sm text-muted-foreground mt-1">{body}</div></div>;
}
