import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import i18n from "@/lib/i18n";
import { LANGUAGES } from "@/lib/i18n";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/translation-qa")({
  head: () => ({ meta: [{ title: "Translation QA — AgriVision" }] }),
  component: TranslationQA,
});

// Walk a translation tree and flatten to dot.notation keys.
function flatten(obj: any, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(obj || {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, path));
    else out[path] = String(v);
  }
  return out;
}

function TranslationQA() {
  const [filter, setFilter] = useState("");
  const langs = LANGUAGES.map((l) => l.code);

  const rows = useMemo(() => {
    const tables = langs.map((l) => flatten((i18n.getResourceBundle(l, "translation") as any) || {}));
    const allKeys = Array.from(new Set(tables.flatMap((t) => Object.keys(t)))).sort();
    return allKeys.map((key) => {
      const values = langs.map((_, i) => tables[i][key] ?? "");
      const missing = values.some((v) => !v);
      const awkward = values.some((v, i) => i > 0 && v && v === values[0]); // non-en equals en → likely untranslated
      return { key, values, missing, awkward };
    });
  }, []);

  const filtered = rows.filter((r) => !filter || r.key.includes(filter) || r.values.some((v) => v.toLowerCase().includes(filter.toLowerCase())));
  const missingCount = rows.filter((r) => r.missing).length;
  const awkwardCount = rows.filter((r) => r.awkward && !r.missing).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Translation QA</h1>
        <p className="text-sm text-muted-foreground mt-1">Review every UI string across all languages. Spot missing or untranslated text.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="rounded-xl bg-card border border-border px-3 py-2 text-sm flex items-center gap-2">
          {missingCount === 0 ? <CheckCircle2 className="size-4 text-primary"/> : <AlertTriangle className="size-4 text-destructive"/>}
          <span><b>{missingCount}</b> missing</span>
        </div>
        <div className="rounded-xl bg-card border border-border px-3 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="size-4 text-accent"/>
          <span><b>{awkwardCount}</b> likely untranslated (same as English)</span>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by key or text…"
          className="flex-1 min-w-48 px-3 py-2 rounded-xl bg-input border border-border text-sm"
        />
      </div>

      <div className="rounded-2xl border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-2 font-semibold">Key</th>
              {langs.map((l) => <th key={l} className="text-left p-2 font-semibold">{l.toUpperCase()}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.key} className={`border-t border-border ${r.missing ? "bg-destructive/5" : r.awkward ? "bg-accent/5" : ""}`}>
                <td className="p-2 font-mono text-xs text-muted-foreground align-top whitespace-nowrap">{r.key}</td>
                {r.values.map((v, i) => (
                  <td key={i} className={`p-2 align-top ${!v ? "text-destructive italic" : i > 0 && v === r.values[0] ? "text-accent-foreground" : ""}`}>
                    {v || "— missing —"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
