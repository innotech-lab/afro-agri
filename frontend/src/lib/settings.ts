// Local app settings (per-device).
const KEY = "agv.settings.v1";
export type AppSettings = {
  pestThreshold: number;          // global default
  pestThresholdByProvince: Record<string, number>;
};
const DEFAULTS: AppSettings = { pestThreshold: 5, pestThresholdByProvince: {} };

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return DEFAULTS; }
}
export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function thresholdFor(province: string): number {
  const s = getSettings();
  return s.pestThresholdByProvince[province] ?? s.pestThreshold;
}
