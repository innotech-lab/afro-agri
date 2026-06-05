// Rough province assignment by lat/lng for Burundi & Rwanda.
const POINTS: { name: string; country: "BI" | "RW"; lat: number; lng: number }[] = [
  { name: "Bujumbura", country: "BI", lat: -3.38, lng: 29.36 },
  { name: "Gitega", country: "BI", lat: -3.43, lng: 29.93 },
  { name: "Kayanza", country: "BI", lat: -2.92, lng: 29.63 },
  { name: "Ngozi", country: "BI", lat: -2.9, lng: 29.83 },
  { name: "Muyinga", country: "BI", lat: -2.85, lng: 30.34 },
  { name: "Ruyigi", country: "BI", lat: -3.48, lng: 30.25 },
  { name: "Rumonge", country: "BI", lat: -3.97, lng: 29.44 },
  { name: "Kigali", country: "RW", lat: -1.95, lng: 30.06 },
  { name: "Musanze", country: "RW", lat: -1.5, lng: 29.63 },
  { name: "Huye", country: "RW", lat: -2.6, lng: 29.74 },
  { name: "Rubavu", country: "RW", lat: -1.68, lng: 29.26 },
  { name: "Nyagatare", country: "RW", lat: -1.3, lng: 30.32 },
  { name: "Muhanga", country: "RW", lat: -2.08, lng: 29.75 },
];

export function provinceFor(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null) return { name: "Unknown", country: "??" as const };
  let best = POINTS[0], bd = Infinity;
  for (const p of POINTS) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
