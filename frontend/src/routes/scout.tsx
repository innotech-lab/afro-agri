import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Award, Trophy, Sprout, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scout")({
  head: () => ({ meta: [{ title: "Scout Profile — AgriVision" }, { name: "description", content: "Earn badges and points for every plant scan. Show your Digital Farmer certification." }] }),
  component: Scout,
});

const BADGES = [
  { count: 10, name: "Seedling", emoji: "🌱" },
  { count: 50, name: "Sprout Scout", emoji: "🌿" },
  { count: 100, name: "Digital Farmer", emoji: "🌾" },
  { count: 250, name: "Field Captain", emoji: "🚜" },
  { count: 500, name: "Harvest Hero", emoji: "🏆" },
  { count: 1000, name: "Agro Legend", emoji: "👑" },
];

function Scout() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("scans").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => { setCount(count ?? 0); setLoading(false); });
  }, [user]);

  const points = count * 10;
  const earned = BADGES.filter(b => count >= b.count);
  const next = BADGES.find(b => count < b.count);
  const progress = next ? Math.round((count / next.count) * 100) : 100;

  const share = async () => {
    const text = `🏅 I'm a ${earned.at(-1)?.name ?? "New Scout"} on AgriVision East Africa! ${count} plants scanned, ${points} points.`;
    try { await navigator.share?.({ title: "Digital Farmer Certification", text }); }
    catch { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
  };

  if (!user) return <div className="rounded-2xl border border-dashed p-10 text-center"><Sprout className="size-8 mx-auto text-primary mb-2"/>Sign in to track your scout progress.</div>;
  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-hero text-primary-foreground p-6 shadow-glow">
        <div className="text-xs uppercase tracking-widest opacity-80">Digital Farmer Certification</div>
        <div className="flex items-end gap-3 mt-2">
          <Trophy className="size-12"/>
          <div>
            <div className="text-5xl font-display font-bold leading-none">{points}</div>
            <div className="opacity-90 text-sm">points · {count} plants scanned</div>
          </div>
        </div>
        {next && (
          <div className="mt-5">
            <div className="flex justify-between text-xs opacity-90 mb-1"><span>Next: {next.emoji} {next.name}</span><span>{count}/{next.count}</span></div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${progress}%` }}/></div>
          </div>
        )}
        <button onClick={share} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur text-sm font-semibold"><Share2 className="size-4"/>Share certification</button>
      </div>

      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Award className="text-accent size-5"/>Badges</h2>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(b => {
            const got = count >= b.count;
            return (
              <div key={b.name} className={`rounded-2xl p-4 text-center border ${got ? "bg-card border-primary" : "bg-muted/30 border-border opacity-60"}`}>
                <div className="text-3xl">{b.emoji}</div>
                <div className="text-xs font-semibold mt-1">{b.name}</div>
                <div className="text-[10px] text-muted-foreground">{b.count} scans</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
