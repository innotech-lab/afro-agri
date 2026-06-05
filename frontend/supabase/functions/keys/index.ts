// API key management endpoint. Authenticated via the user's JWT (verify_jwt = true).
//   POST /functions/v1/keys  body: { action: "create" | "rotate" | "revoke", id?, label? }
// Returns a fresh raw key on create/rotate (shown to user once). All other ops
// return the updated row(s) so the developer portal can refresh.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function freshKey() { return "av_" + crypto.randomUUID().replaceAll("-", ""); }
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Missing Authorization" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const admin = createClient(url, service);

  const { data: ures, error: uerr } = await userClient.auth.getUser();
  if (uerr || !ures?.user) return json({ error: "Invalid session" }, 401);
  const userId = ures.user.id;

  let body: any; try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const action = body?.action;

  if (action === "create") {
    const label = String(body.label || "default").slice(0, 80);
    const raw = freshKey(); const hash = await sha256(raw);
    const { data, error } = await admin.from("api_keys").insert({
      user_id: userId, label, key_prefix: raw.slice(0, 10), key_hash: hash,
    }).select("*").single();
    if (error) return json({ error: error.message }, 400);
    return json({ key: raw, row: data });
  }

  if (action === "rotate") {
    const id = String(body.id || "");
    if (!id) return json({ error: "id required" }, 400);
    const { data: existing, error: e0 } = await admin.from("api_keys").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (e0) return json({ error: e0.message }, 400);
    if (!existing) return json({ error: "Key not found" }, 404);
    const raw = freshKey(); const hash = await sha256(raw);
    const { data: created, error: e1 } = await admin.from("api_keys").insert({
      user_id: userId,
      label: existing.label.endsWith("(rotated)") ? existing.label : `${existing.label} (rotated)`,
      key_prefix: raw.slice(0, 10),
      key_hash: hash,
      balance_cents: existing.balance_cents,
    }).select("*").single();
    if (e1) return json({ error: e1.message }, 400);
    const { error: e2 } = await admin.from("api_keys").update({ active: false }).eq("id", id);
    if (e2) return json({ error: e2.message }, 400);
    return json({ key: raw, row: created, revoked_id: id });
  }

  if (action === "revoke") {
    const id = String(body.id || "");
    if (!id) return json({ error: "id required" }, 400);
    const { data, error } = await admin.from("api_keys").update({ active: false })
      .eq("id", id).eq("user_id", userId).select("*").maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Key not found" }, 404);
    return json({ row: data });
  }

  return json({ error: "Unknown action" }, 400);
});
