// Offline scan queue: stores pending scans (image as base64 + metadata + GPS)
// in localStorage and auto-uploads when navigator.onLine becomes true.
import { supabase } from "@/integrations/supabase/client";

const KEY = "scc.offline-queue.v1";

export type QueuedScan = {
  id: string;
  user_id: string;
  crop: string;
  predicted_label: string;
  confidence: number;
  corrected_label: string | null;
  latitude: number | null;
  longitude: number | null;
  province: string | null;
  country: string | null;
  image_base64: string | null;
  filename: string;
  queued_at: number;
};

function read(): QueuedScan[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(q: QueuedScan[]) { localStorage.setItem(KEY, JSON.stringify(q)); }

export function queueSize() { return read().length; }

export function enqueue(item: Omit<QueuedScan, "id" | "queued_at">) {
  const q = read();
  q.push({ ...item, id: crypto.randomUUID(), queued_at: Date.now() });
  write(q);
  return q.length;
}

async function uploadOne(item: QueuedScan): Promise<boolean> {
  try {
    let path: string | null = null;
    if (item.image_base64) {
      const blob = await (await fetch(item.image_base64)).blob();
      const filename = `${item.user_id}/${item.queued_at}-${item.filename}`;
      const { error } = await supabase.storage.from("scans").upload(filename, blob);
      if (!error) path = filename;
    }
    const { error } = await supabase.from("scans").insert({
      user_id: item.user_id,
      crop: item.crop,
      predicted_label: item.predicted_label,
      confidence: item.confidence,
      corrected_label: item.corrected_label,
      latitude: item.latitude ?? undefined,
      longitude: item.longitude ?? undefined,
      province: item.province ?? undefined,
      country: item.country ?? undefined,
      image_path: path,
    });
    return !error;
  } catch { return false; }
}

let flushing = false;
export async function flushQueue(): Promise<{ uploaded: number; remaining: number }> {
  if (flushing) return { uploaded: 0, remaining: read().length };
  flushing = true;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return { uploaded: 0, remaining: read().length };
    }
    let uploaded = 0;
    let q = read();
    const remaining: QueuedScan[] = [];
    for (const item of q) {
      const ok = await uploadOne(item);
      if (ok) uploaded++; else remaining.push(item);
    }
    write(remaining);
    return { uploaded, remaining: remaining.length };
  } finally { flushing = false; }
}

export function startAutoFlush(onFlush?: (r: { uploaded: number; remaining: number }) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = async () => { const r = await flushQueue(); onFlush?.(r); };
  window.addEventListener("online", handler);
  // also try immediately
  handler();
  const interval = window.setInterval(handler, 60_000);
  return () => { window.removeEventListener("online", handler); clearInterval(interval); };
}

export async function fileToBase64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}
