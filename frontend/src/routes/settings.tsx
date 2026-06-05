import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getSettings, saveSettings } from "@/lib/settings";
import { toast } from "sonner";
import { Settings as SettingsIcon, Plus, X } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — AgriVision" },
    { name: "description", content: "Configure pest alert thresholds per province." },
  ]}),
  component: SettingsPage,
});

const PROVINCES = ["Kayanza", "Gitega", "Bujumbura", "Ngozi", "Muyinga", "Musanze", "Huye", "Kigali", "Rubavu", "Nyagatare"];

function SettingsPage() {
  const [s, setS] = useState(getSettings());
  const [prov, setProv] = useState(PROVINCES[0]);
  const [val, setVal] = useState(5);

  const persist = (next: typeof s) => { setS(next); saveSettings(next); };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><SettingsIcon className="size-6"/>Settings</h1>
        <p className="text-sm text-muted-foreground">Configure pest alert thresholds per province.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Default pest alert threshold</label>
        <div className="flex items-center gap-3">
          <input type="number" min={1} value={s.pestThreshold}
            onChange={(e) => persist({ ...s, pestThreshold: Math.max(1, +e.target.value || 1) })}
            className="w-24 px-3 py-2 rounded-xl bg-input border border-border"/>
          <span className="text-sm text-muted-foreground">scans of same pest in a province → alert</span>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <h2 className="font-display font-semibold">Per-province overrides</h2>
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Province</label>
            <select value={prov} onChange={(e) => setProv(e.target.value)} className="px-3 py-2 rounded-xl bg-input border border-border">
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Threshold</label>
            <input type="number" min={1} value={val} onChange={(e) => setVal(+e.target.value || 1)} className="w-20 px-3 py-2 rounded-xl bg-input border border-border"/>
          </div>
          <button onClick={() => {
            persist({ ...s, pestThresholdByProvince: { ...s.pestThresholdByProvince, [prov]: val } });
            toast.success(`Set ${prov} → ${val}`);
          }} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-1"><Plus className="size-4"/>Set</button>
        </div>

        <ul className="divide-y divide-border">
          {Object.entries(s.pestThresholdByProvince).map(([p, v]) => (
            <li key={p} className="py-2 flex items-center justify-between">
              <span><b>{p}</b> → {v}</span>
              <button onClick={() => {
                const { [p]: _, ...rest } = s.pestThresholdByProvince;
                persist({ ...s, pestThresholdByProvince: rest });
              }} className="p-1.5 rounded-lg hover:bg-secondary"><X className="size-4"/></button>
            </li>
          ))}
          {Object.keys(s.pestThresholdByProvince).length === 0 && (
            <li className="text-sm text-muted-foreground py-2">No overrides — using default ({s.pestThreshold}).</li>
          )}
        </ul>
      </div>
    </div>
  );
}
