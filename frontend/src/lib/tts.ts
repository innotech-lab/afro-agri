// Browser SpeechSynthesis wrapper with Kirundi/Kinyarwanda fallback to French.
export function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  // Browsers rarely have rn/rw voices; fallback to French (closest Bantu-friendly)
  const map: Record<string, string> = { rn: "fr-FR", rw: "fr-FR", fr: "fr-FR", en: "en-US" };
  u.lang = map[lang] || "en-US";
  u.rate = 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
