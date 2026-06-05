// Lightweight in-memory + localStorage debug log used by scan flow and diagnostics.
const KEY = "scc.debug-log.v1";
const ENABLED_KEY = "scc.debug-enabled.v1";
const MAX = 500;

export type LogLevel = "info" | "warn" | "error";
export type LogEntry = { t: number; level: LogLevel; tag: string; msg: string; meta?: any };

function read(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(entries: LogEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX))); } catch {}
}

export function isDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}
export function setDebugEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENABLED_KEY, v ? "1" : "0");
}

export function log(level: LogLevel, tag: string, msg: string, meta?: any) {
  if (!isDebugEnabled() && level === "info") return;
  const entry: LogEntry = { t: Date.now(), level, tag, msg, meta };
  const all = read();
  all.push(entry);
  write(all);
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${tag}] ${msg}`, meta ?? "");
}
export const dlog = {
  info: (tag: string, msg: string, meta?: any) => log("info", tag, msg, meta),
  warn: (tag: string, msg: string, meta?: any) => log("warn", tag, msg, meta),
  error: (tag: string, msg: string, meta?: any) => log("error", tag, msg, meta),
};

export function getLogs(): LogEntry[] { return read(); }
export function clearLogs() { write([]); }

export function logsAsText(): string {
  return read().map(e => {
    const ts = new Date(e.t).toISOString();
    const meta = e.meta ? " " + safeStringify(e.meta) : "";
    return `${ts} [${e.level.toUpperCase()}] ${e.tag}: ${e.msg}${meta}`;
  }).join("\n");
}

function safeStringify(v: any): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

const LAST_ERR_KEY = "scc.last-scan-error.v1";
export function setLastScanError(msg: string | null) {
  if (typeof window === "undefined") return;
  if (msg) localStorage.setItem(LAST_ERR_KEY, JSON.stringify({ msg, at: Date.now() }));
  else localStorage.removeItem(LAST_ERR_KEY);
}
export function getLastScanError(): { msg: string; at: number } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(LAST_ERR_KEY) || "null"); } catch { return null; }
}
