// Public diagnose API - Pay-per-scan
// POST { image_base64: string, crop?: string } with header `x-api-key`
// Returns { species, health, treatment, water_ml }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SPECIES = ["maize", "rice", "peanuts", "cassava", "beans", "banana", "coffee", "tea"];
const TREATMENTS: Record<string, { treatment: string; water_ml: number }> = {
  leaf_blight: { treatment: "Spray Neem oil (10ml/L) every 7 days. Burn infected leaves.", water_ml: 250 },
  leaf_rust: { treatment: "Dust with wood ash; apply garlic spray (100g/L).", water_ml: 200 },
  powdery_mildew: { treatment: "Spray milk solution 1:9 weekly.", water_ml: 200 },
  aphids: { treatment: "Soapy water spray + hot pepper + garlic.", water_ml: 180 },
  healthy: { treatment: "Continue routine watering and weekly inspection.", water_ml: 220 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return json({ error: "Missing x-api-key" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const hash = await sha256(apiKey);
  const { data: keyRow } = await sb.from("api_keys").select("*").eq("key_hash", hash).eq("active", true).maybeSingle();
  if (!keyRow) return json({ error: "Invalid API key" }, 401);
  if (keyRow.balance_cents <= 0) {
    await sb.from("api_calls").insert({ api_key_id: keyRow.id, status: 402, cost_cents: 0 });
    return json({ error: "Payment Required - top up balance" }, 402);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body?.image_base64) return json({ error: "image_base64 required" }, 400);

  // Heuristic mock diagnosis (the real on-device MobileNet runs in the browser).
  // For server-side, deterministic hash → species/health.
  const fp = await sha256(body.image_base64.slice(0, 256));
  const speciesIdx = parseInt(fp.slice(0, 2), 16) % SPECIES.length;
  const diseaseKeys = Object.keys(TREATMENTS);
  const dKey = diseaseKeys[parseInt(fp.slice(2, 4), 16) % diseaseKeys.length];
  const health = dKey === "healthy" ? 0.95 : 0.35 + (parseInt(fp.slice(4, 6), 16) % 40) / 100;
  const result = {
    species: body.crop || SPECIES[speciesIdx],
    disease: dKey,
    health: Math.round(health * 100) / 100,
    treatment: TREATMENTS[dKey].treatment,
    water_ml: TREATMENTS[dKey].water_ml,
  };

  const cost = 1; // $0.01 per call
  await sb.from("api_keys").update({ balance_cents: keyRow.balance_cents - cost }).eq("id", keyRow.id);
  await sb.from("api_calls").insert({
    api_key_id: keyRow.id, status: 200, cost_cents: cost, species: result.species, health: result.health,
  });

  return json(result, 200);
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
