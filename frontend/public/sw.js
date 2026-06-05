// AgriVision service worker.
// Goals:
//  - cache the app shell so it opens with no internet
//  - listen for "online" / Background Sync events and notify the page so it
//    can flush the queued scans (image + GPS) it stored in localStorage.
// Cache-first is intentionally limited to static assets; HTML uses
// network-first so new builds appear immediately.
const VERSION = "agv-v2";
const SHELL = ["/", "/manifest.webmanifest", "/favicon.ico"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Network-first for HTML / navigations
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(VERSION); c.put(req, fresh.clone()); return fresh;
      } catch {
        return (await caches.match(req)) || (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }
  // Cache-first for static assets
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh.ok && (url.pathname.startsWith("/assets/") || /\.(png|jpe?g|svg|webp|css|js|woff2?)$/.test(url.pathname))) {
        const c = await caches.open(VERSION); c.put(req, fresh.clone());
      }
      return fresh;
    } catch { return Response.error(); }
  })());
});

async function notifyFlush(reason) {
  const all = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const c of all) c.postMessage({ type: "AGRIVISION_FLUSH", reason });
}

self.addEventListener("sync", (event) => {
  if (event.tag === "agv-scan-sync") event.waitUntil(notifyFlush("background-sync"));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "AGRIVISION_PING") event.source?.postMessage?.({ type: "AGRIVISION_PONG" });
});
