// Register the production service worker — never inside a preview iframe
// or on preview hosts (it would lock the iframe to a stale shell).
import { flushQueue } from "./offline-queue";

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host === "localhost";
  if (inIframe || isPreview) {
    // Make sure no stale SW lingers from a prior build
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach(r => r.unregister()));
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "AGRIVISION_FLUSH") flushQueue();
  });
}

/** Ask the SW to wake us up next time the device gets connectivity. */
export async function requestBackgroundSync() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg: any = await navigator.serviceWorker.ready;
    if (reg?.sync?.register) { await reg.sync.register("agv-scan-sync"); return true; }
  } catch {}
  return false;
}
