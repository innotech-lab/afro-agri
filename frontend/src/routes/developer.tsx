import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Key, Plus, Copy, BookOpen, Loader2, DollarSign, RotateCw, Ban, PlayCircle, Beaker } from "lucide-react";

export const Route = createFileRoute("/developer")({
  head: () => ({ meta: [{ title: "Developer Portal — AgriVision" }, { name: "description", content: "Manage API keys, rotate, and try the /v1/analyze endpoint live." }] }),
  component: Developer,
});

type ApiKey = { id: string; label: string; key_prefix: string; balance_cents: number; active: boolean; created_at: string };
type Call = { id: string; status: number; cost_cents: number; species: string | null; created_at: string };

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANALYZE_URL = `${FN_BASE}/analyze`;
const KEYS_URL = `${FN_BASE}/keys`;

// 1×1 PNG to use as the sample image_base64
const SAMPLE_IMAGE_B64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function callKeysApi(action: "create" | "rotate" | "revoke", payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");
  const res = await fetch(KEYS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body as { key?: string; row?: ApiKey; revoked_id?: string };
}

function Developer() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("default");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Try-It state
  const [tryKey, setTryKey] = useState("");
  const [tryCrop, setTryCrop] = useState("maize");
  const [tryStatus, setTryStatus] = useState<number | null>(null);
  const [tryResp, setTryResp] = useState<any>(null);
  const [trying, setTrying] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: k } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setKeys((k as any) ?? []);
    if (k && k.length) {
      const { data: c } = await supabase.from("api_calls").select("*").in("api_key_id", k.map((x: any) => x.id)).order("created_at", { ascending: false }).limit(50);
      setCalls((c as any) ?? []);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    try {
      const r = await callKeysApi("create", { label });
      if (r.key) { setRevealed(r.key); toast.success("Key created — copy it now, it won't be shown again"); }
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const rotate = async (id: string) => {
    setBusyId(id);
    try {
      const r = await callKeysApi("rotate", { id });
      if (r.key) { setRevealed(r.key); toast.success("Key rotated — copy the new key now"); }
      load();
    } catch (e: any) { toast.error(`Rotate failed: ${e.message}`); }
    finally { setBusyId(null); }
  };

  const revoke = async (id: string, label: string) => {
    if (!confirm(`Revoke ${label}? Future calls with this key will return 401.`)) return;
    setBusyId(id);
    try {
      await callKeysApi("revoke", { id });
      toast.success("Key revoked");
      load();
    } catch (e: any) { toast.error(`Revoke failed: ${e.message}`); }
    finally { setBusyId(null); }
  };

  const tryIt = async () => {
    if (!tryKey.trim()) return toast.error("Paste an API key first");
    setTrying(true); setTryStatus(null); setTryResp(null);
    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": tryKey.trim(),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({ image_base64: SAMPLE_IMAGE_B64, crop: tryCrop }),
      });
      setTryStatus(res.status);
      const body = await res.json().catch(() => ({}));
      setTryResp(body);
      if (res.status === 200) toast.success("OK · $0.01 billed");
      else if (res.status === 402) toast.error("402 Payment Required — top up balance");
      else if (res.status === 401) toast.error("401 — invalid or revoked key");
      else toast.error(`HTTP ${res.status}`);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setTrying(false); }
  };

  if (!user) return <div className="text-center py-12">Please <Link to="/auth" className="text-primary underline">sign in</Link> to access the Developer Portal.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Developer Portal</h1>
        <p className="text-sm text-muted-foreground">Pay-per-scan plant diagnosis API · $0.01 / call · POST <code className="bg-muted px-1 rounded">/v1/analyze</code> with header <code className="bg-muted px-1 rounded">x-api-key</code></p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-40">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">New key label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl bg-input border border-border" />
        </div>
        <button onClick={create} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2"><Plus className="size-4"/>Create key</button>
        <Link to="/docs" className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground flex items-center gap-2"><BookOpen className="size-4"/>Docs</Link>
      </div>

      {revealed && (
        <div className="rounded-2xl bg-accent/15 border border-accent/40 p-4">
          <div className="text-xs uppercase tracking-wider mb-1">Your new key (shown once)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-sm bg-background/60 p-2 rounded-lg">{revealed}</code>
            <button onClick={() => { navigator.clipboard.writeText(revealed); toast.success("Copied"); }} className="p-2 rounded-lg bg-card border border-border"><Copy className="size-4"/></button>
            <button onClick={() => setTryKey(revealed)} className="p-2 rounded-lg bg-primary text-primary-foreground" title="Use in Try-It"><Beaker className="size-4"/></button>
          </div>
        </div>
      )}

      {/* Try-It panel */}
      <section className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Beaker className="size-5 text-primary"/>
          <h2 className="font-display text-lg font-semibold">Try It</h2>
          <span className="text-xs text-muted-foreground">live POST to /v1/analyze</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={tryKey} onChange={e => setTryKey(e.target.value)} placeholder="x-api-key (av_…)" className="sm:col-span-2 px-3 py-2 rounded-xl bg-input border border-border font-mono text-xs"/>
          <select value={tryCrop} onChange={e => setTryCrop(e.target.value)} className="px-3 py-2 rounded-xl bg-input border border-border">
            {["maize","rice","peanuts","beans","tomato","cassava","banana","coffee","tea"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={tryIt} disabled={trying} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
          {trying ? <Loader2 className="size-4 animate-spin"/> : <PlayCircle className="size-4"/>} Send sample request
        </button>
        {tryStatus !== null && (
          <div className="space-y-2">
            <div className={`text-sm font-semibold ${tryStatus === 200 ? "text-primary" : "text-destructive"}`}>
              HTTP {tryStatus}
              {tryStatus === 200 && <span className="ml-2 text-xs text-muted-foreground">+$0.01 deducted from key balance</span>}
              {tryStatus === 402 && <span className="ml-2 text-xs">Payment required — top up</span>}
              {tryStatus === 401 && <span className="ml-2 text-xs">Auth failed — key invalid or revoked</span>}
            </div>
            <pre className="bg-background/60 border border-border rounded-xl p-3 text-xs overflow-x-auto">{JSON.stringify(tryResp, null, 2)}</pre>
          </div>
        )}
      </section>

      {loading ? <Loader2 className="animate-spin size-5"/> : (
        <>
          <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Key className="size-5"/>Your keys</h2>
          <div className="space-y-2">
            {keys.length === 0 && <div className="text-muted-foreground text-sm">No keys yet.</div>}
            {keys.map(k => (
              <div key={k.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium flex items-center gap-2">{k.label} {!k.active && <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">revoked</span>}</div>
                  <code className="text-xs text-muted-foreground">{k.key_prefix}…</code>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 font-semibold ${k.balance_cents <= 0 ? "text-destructive" : "text-primary"}`}>
                    <DollarSign className="size-4"/>{(k.balance_cents / 100).toFixed(2)}
                  </div>
                  {k.active && (
                    <>
                      <button disabled={busyId === k.id} title="Rotate (revoke this and create a new one with the same balance)" onClick={() => rotate(k.id)} className="p-2 rounded-lg bg-secondary border border-border disabled:opacity-50" aria-label="Rotate key">
                        {busyId === k.id ? <Loader2 className="size-4 animate-spin"/> : <RotateCw className="size-4"/>}
                      </button>
                      <button disabled={busyId === k.id} title="Revoke" onClick={() => revoke(k.id, k.label)} className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive disabled:opacity-50" aria-label="Revoke key">
                        <Ban className="size-4"/>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-xl font-semibold mt-6">Recent calls</h2>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground"><tr><th className="text-left px-3 py-2">When</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Species</th><th className="text-right px-3 py-2">Cost</th></tr></thead>
              <tbody>
                {calls.map(c => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2">{new Date(c.created_at).toLocaleString()}</td>
                    <td className={`px-3 py-2 ${c.status === 200 ? "text-primary" : "text-destructive"}`}>{c.status}</td>
                    <td className="px-3 py-2">{c.species ?? "—"}</td>
                    <td className="px-3 py-2 text-right">${(c.cost_cents / 100).toFixed(2)}</td>
                  </tr>
                ))}
                {calls.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground py-4">No calls yet</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
