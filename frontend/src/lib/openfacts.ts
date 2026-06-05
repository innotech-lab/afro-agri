// Open-source facts aggregator:
//   1. User correction (admin/local override) — highest priority
//   2. Cached AI expert summary (AI gateway, gemini-2.5-flash)
//   3. Cached Wikipedia summary (multi-title strategy, multi-language)
//   4. Generic fallback explanation
// All results cached in localStorage so they survive offline.

export type OpenFact = {
  source: "user" | "ai" | "wikipedia" | "fallback";
  title: string;
  extract: string;
  url?: string;
  lang: string;
  thumbnail?: string;
};

const LANG_CHAIN: Record<string, string[]> = {
  en: ["en"],
  fr: ["fr", "en"],
  rn: ["rn", "fr", "en"],
  rw: ["rw", "fr", "en"],
};

const CACHE_PREFIX = "agv.facts.v1.";
const OVERRIDE_PREFIX = "agv.facts.override.v1.";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function safeKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
const slug = (disease: string, crop: string, lang: string) =>
  `${safeKey(disease)}__${safeKey(crop)}__${lang}`;

function readCache(key: string): OpenFact | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.fact as OpenFact;
  } catch { return null; }
}
function writeCache(key: string, fact: OpenFact) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), fact })); } catch {}
}

export function getUserOverride(disease: string, crop: string, lang: string): OpenFact | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(OVERRIDE_PREFIX + slug(disease, crop, lang));
    return raw ? (JSON.parse(raw) as OpenFact) : null;
  } catch { return null; }
}
export function saveUserOverride(disease: string, crop: string, lang: string, text: string): OpenFact {
  const fact: OpenFact = { source: "user", title: disease, extract: text.trim(), lang };
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem(OVERRIDE_PREFIX + slug(disease, crop, lang), JSON.stringify(fact)); } catch {}
  }
  return fact;
}
export function clearUserOverride(disease: string, crop: string, lang: string) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.removeItem(OVERRIDE_PREFIX + slug(disease, crop, lang)); } catch {}
}

async function wikiOne(lang: string, title: string): Promise<OpenFact | null> {
  try {
    const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { accept: "application/json" },
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    if (!j?.extract || j?.type === "disambiguation") return null;
    return {
      source: "wikipedia",
      title: j.title || title,
      extract: j.extract,
      url: j.content_urls?.desktop?.page,
      thumbnail: j.thumbnail?.source,
      lang,
    };
  } catch { return null; }
}

// Smart multi-title strategy: tries combinations until something hits.
async function smartWikipedia(disease: string, crop: string, lang: string): Promise<OpenFact | null> {
  const titles = Array.from(new Set([
    `${disease} (${crop})`,
    `${disease} of ${crop}`,
    `${crop} ${disease}`,
    disease,
    `${disease} disease`,
    `${crop} disease`,
  ].map((s) => s.trim()).filter(Boolean)));
  for (const l of LANG_CHAIN[lang] ?? ["en"]) {
    for (const t of titles) {
      const hit = await wikiOne(l, t);
      if (hit) return hit;
    }
  }
  return null;
}

function fallback(disease: string, crop: string, lang: string): OpenFact {
  const msg = {
    en: `No open-source article was found for "${disease}" on ${crop}. Try a similar disease name, ask a local agronomist, or write your own notes below — they will be saved for future scans.`,
    fr: `Aucun article open-source trouvé pour « ${disease} » sur ${crop}. Essayez un nom voisin, consultez un agronome, ou rédigez vos notes ci-dessous — elles seront enregistrées pour les prochains scans.`,
    rn: `Nta nkuru y'ubuntu yabonetse kuri "${disease}" kuri ${crop}. Gerageza izina risa, baza uwuhinga, canke wandike ivyiyumviro vyawe — bizobikwa kuri suzuma riza.`,
    rw: `Nta nyandiko y'ubuntu yabonetse kuri "${disease}" kuri ${crop}. Gerageza izina risa, baza uwuhinga, cyangwa wandike ibyo uzi — bizabikwa ku isuzuma rizaza.`,
  }[lang] ?? `No reference found for ${disease} on ${crop}.`;
  return { source: "fallback", title: disease, extract: msg, lang };
}

/**
 * Main entry. Resolution order:
 *   user override → cached AI → cached wiki → fresh AI → fresh wiki → fallback.
 * AI lookup is delegated to caller via `aiLookup` (server fn) so this module
 * stays client-safe.
 */
export async function resolveFacts(
  disease: string,
  crop: string,
  lang: string,
  aiLookup?: (args: { disease: string; crop: string; lang: "en" | "fr" | "rn" | "rw" }) => Promise<{ ok: boolean; text?: string; error?: string }>,
): Promise<OpenFact> {
  // 1. user override
  const override = getUserOverride(disease, crop, lang);
  if (override) return override;

  // 2. cached anything
  const key = slug(disease, crop, lang);
  const cached = readCache(key);
  if (cached) return cached;

  // Offline → return fallback (caller still shows editable note)
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return fallback(disease, crop, lang);
  }

  // 3. try AI gateway
  if (aiLookup) {
    try {
      const ai = await aiLookup({ disease, crop, lang: (["en", "fr", "rn", "rw"].includes(lang) ? lang : "en") as any });
      if (ai?.ok && ai.text) {
        const fact: OpenFact = { source: "ai", title: disease, extract: ai.text, lang };
        writeCache(key, fact);
        return fact;
      }
    } catch { /* fall through */ }
  }

  // 4. wikipedia
  const wiki = await smartWikipedia(disease, crop, lang);
  if (wiki) { writeCache(key, wiki); return wiki; }

  // 5. fallback
  return fallback(disease, crop, lang);
}

/** Validation + normalization for custom plant names. */
export function normalizeCropName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 60);
}

const KNOWN_KEY = "agv.knownCrops.v1";
export function rememberCropName(name: string) {
  if (typeof localStorage === "undefined") return;
  const n = normalizeCropName(name);
  if (!n) return;
  try {
    const list: string[] = JSON.parse(localStorage.getItem(KNOWN_KEY) || "[]");
    if (!list.includes(n)) { list.push(n); localStorage.setItem(KNOWN_KEY, JSON.stringify(list.slice(-50))); }
  } catch {}
}
export function knownCropNames(): string[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KNOWN_KEY) || "[]"); } catch { return []; }
}
