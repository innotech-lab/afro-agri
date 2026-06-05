import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { analyze, addCorrection, retrainHead, getBankSize, getApprovedCount, syncCorrectionStatuses, healthCheck, type Prediction } from "@/lib/model";
import { requestBackgroundSync } from "@/lib/sw-register";
import { mapPredictionToDisease, DISEASES } from "@/lib/diseases";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { provinceFor } from "@/lib/provinces";
import { enqueue, queueSize, startAutoFlush, fileToBase64 } from "@/lib/offline-queue";
import { dlog, setLastScanError } from "@/lib/debug-log";
import i18n from "@/lib/i18n";
import { resolveFacts, saveUserOverride, clearUserOverride, normalizeCropName, rememberCropName, type OpenFact } from "@/lib/openfacts";
import { enrichDisease } from "@/lib/plantai.functions";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Upload, MapPin, AlertTriangle, CheckCircle2, Brain, Loader2, RotateCw, Volume2, CloudUpload, Sparkles, WifiOff, Activity, BookOpen, Plus, Pencil, Save, X, Sparkle } from "lucide-react";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan a plant — AgriVision" }, { name: "description", content: "On-device MobileNetV2 plant disease scan with offline queue and local-material treatment plan." }] }),
  component: Scan,
});

const CROPS = ["maize", "rice", "peanuts", "tomato", "mango", "cassava", "beans", "banana", "coffee", "tea"];

function Scan() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [crop, setCrop] = useState("maize");
  const [customCrop, setCustomCrop] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const effectiveCrop = normalizeCropName(customCrop) || crop;
  const [facts, setFacts] = useState<OpenFact | null>(null);
  const [factsLoading, setFactsLoading] = useState(false);
  const [factsEditing, setFactsEditing] = useState(false);
  const [factsDraft, setFactsDraft] = useState("");
  const callAi = useServerFn(enrichDisease);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [usedLocal, setUsedLocal] = useState(false);
  const [correctMode, setCorrectMode] = useState(false);
  const [correctLabel, setCorrectLabel] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bankSize, setBankSize] = useState(0);
  const [approvedSize, setApprovedSize] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [health, setHealth] = useState<{ ok: boolean; backend: string | null; error?: string } | null>(null);

  useEffect(() => { setBankSize(getBankSize()); setApprovedSize(getApprovedCount()); setPendingCount(queueSize()); }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stop = startAutoFlush((r) => { setPendingCount(r.remaining); if (r.uploaded) toast.success(`Uploaded ${r.uploaded} offline scan(s)`); });
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { stop(); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    dlog.info("scan", "Pre-scan health check");
    healthCheck().then((r) => {
      setHealth({ ok: r.ok, backend: r.backend, error: r.error });
      if (!r.ok) dlog.error("scan", "Health check failed", r);
      else dlog.info("scan", "Health check OK", r);
    });
  }, []);
  useEffect(() => {
    if (!navigator.geolocation) { dlog.warn("scan", "Geolocation API unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); dlog.info("scan", "GPS captured", { lat: p.coords.latitude, lng: p.coords.longitude }); },
      (err) => { dlog.warn("scan", "GPS denied/failed", { code: err.code, message: err.message }); },
      { maximumAge: 60000 }
    );
  }, []);

  const onPick = (f: File) => {
    dlog.info("scan", "Image picked", { name: f.name, size: f.size, type: f.type });
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setPreds([]);
    setCorrectMode(false);
  };

  const retryHealth = async () => {
    const r = await healthCheck();
    setHealth({ ok: r.ok, backend: r.backend, error: r.error });
    if (r.ok) toast.success(`Recovered — backend: ${r.backend}`);
    else toast.error(r.error || "Still not ready");
  };

  const run = async () => {
    if (!imgRef.current) return;
    if (health && !health.ok) { toast.error("Model not ready — open Diagnostics"); return; }
    setLoading(true);
    dlog.info("scan", "Inference started", { crop });
    try {
      if (!imgRef.current.complete) await new Promise((r) => imgRef.current!.addEventListener("load", r, { once: true }));
      const res = await analyze(imgRef.current);
      setPreds(res.predictions);
      setEmbedding(res.embedding);
      setUsedLocal(res.usedLocal);
      dlog.info("scan", "Inference done", { top: res.predictions[0], usedLocal: res.usedLocal });
      setLastScanError(null);
    } catch (e: any) {
      const msg = e?.message || "Analysis failed";
      dlog.error("scan", "Inference failed", { error: msg });
      setLastScanError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const top = preds[0];
  const disease = top ? mapPredictionToDisease(top.label, effectiveCrop) : null;

  useEffect(() => {
    if (!disease) { setFacts(null); setFactsEditing(false); return; }
    setFactsLoading(true);
    setFactsEditing(false);
    resolveFacts(disease.name, effectiveCrop, i18n.language, (args) =>
      callAi({ data: args }).then((r: any) => r).catch(() => ({ ok: false }))
    ).then((f) => { setFacts(f); setFactsDraft(f.extract); setFactsLoading(false); });
  }, [disease?.id, effectiveCrop]);

  const [celebrate, setCelebrate] = useState(false);

  const save = async () => {
    if (!user) return toast.error(t("scan.needLogin"));
    if (!top || !file) return;
    if (customCrop && !normalizeCropName(customCrop)) return toast.error("Plant name is empty");
    if (customCrop) rememberCropName(customCrop);
    const province = coords ? provinceFor(coords.lat, coords.lng) : null;


    if (!online) {
      const b64 = await fileToBase64(file);
      const n = enqueue({
        user_id: user.id, crop: effectiveCrop,
        predicted_label: top.label, confidence: top.confidence,
        corrected_label: correctMode ? correctLabel : null,
        latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
        province: province?.name ?? null, country: province?.country ?? null,
        image_base64: b64, filename: file.name,
      });
      setPendingCount(n);
      await requestBackgroundSync();
      toast.success(`Saved offline. Will upload when back online (${n} pending).`);
      setCelebrate(true); setTimeout(() => setCelebrate(false), 2500);
      return;
    }

    let path: string | null = null;
    const folder = correctMode ? "retraining_required" : "scans";
    const filename = `${user.id}/${Date.now()}-${file.name}`;
    dlog.info("scan", "Storage upload start", { folder, filename });
    const { error: upErr } = await supabase.storage.from(folder).upload(filename, file);
    if (upErr) {
      dlog.error("scan", "Storage upload failed", { message: upErr.message });
      setLastScanError(`Upload: ${upErr.message}`);
      toast.error(`Upload failed: ${upErr.message}`);
    } else {
      path = filename;
      dlog.info("scan", "Storage upload OK", { path });
    }

    dlog.info("scan", "DB insert start");
    const { data: inserted, error } = await supabase.from("scans").insert({
      user_id: user.id, crop: effectiveCrop,
      predicted_label: top.label, confidence: top.confidence,
      corrected_label: correctMode ? correctLabel : null,
      image_path: path,
      latitude: coords?.lat, longitude: coords?.lng,
      province: province?.name, country: province?.country,
    }).select("id").maybeSingle();
    if (error) {
      dlog.error("scan", "DB insert failed", { message: error.message, code: (error as any).code });
      setLastScanError(`Save: ${error.message}`);
      return toast.error(`Save failed: ${error.message}`);
    }
    dlog.info("scan", "DB insert OK", { id: inserted?.id });
    setLastScanError(null);

    // Stash correction with the scanId so admin moderation governs whether it
    // ever influences predictions. Pending entries do NOT affect KNN.
    if (correctMode && correctLabel && embedding) {
      const n = addCorrection(correctLabel, embedding, inserted?.id);
      setBankSize(n);
    }

    toast.success(t("scan.saved"));
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2500);
  };

  const retrain = async () => {
    setRetraining(true);
    const b = await retrainHead();
    setRetraining(false);
    setBankSize(b.total);
    setApprovedSize(b.approved);
    toast.success(`${b.approved} approved · ${b.pending} pending moderation`);
  };

  const sync = async () => {
    if (!user) return toast.error(t("scan.needLogin"));
    const r = await syncCorrectionStatuses();
    setApprovedSize(r.approved);
    setBankSize(r.approved + r.pending);
    toast.success(`Synced — ${r.approved} approved by moderators applied`);
  };

  const speakPlan = () => {
    if (!disease) return;
    speak(`${disease.name}. ${disease.plan.join(". ")}`, i18n.language);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("scan.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span><MapPin className="size-3 inline mr-1"/>{coords ? t("scan.gpsCaptured") : t("scan.gpsDenied")}</span>
          {bankSize > 0 && <span><Brain className="size-3 inline mr-1"/>{approvedSize}/{bankSize} approved</span>}
          {!online && <span className="text-destructive"><WifiOff className="size-3 inline mr-1"/>Offline mode</span>}
          {pendingCount > 0 && <span className="text-accent">{pendingCount} pending upload</span>}
        </p>
      </div>

      {health && !health.ok && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="size-4"/>AI model not ready</div>
          <div className="text-sm text-destructive/90">{health.error || "TensorFlow could not initialize a backend."}</div>
          <p className="text-xs text-muted-foreground">Try reloading the page, switching networks, or using a different browser. If the problem persists, open Diagnostics and upload a debug report.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={retryHealth} className="py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Retry</button>
            <Link to="/diagnostics" className="py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium text-center"><Activity className="size-3.5 inline mr-1"/>Diagnostics</Link>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-card p-4 shadow-soft border border-border space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("scan.crop")}</label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CROPS.map((c) => (
            <button key={c} onClick={() => { setCrop(c); setCustomCrop(""); }} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${!customCrop && crop === c ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"}`}>
              {t(`crops.${c}`)}
            </button>
          ))}
          <button onClick={() => setShowCustom((s) => !s)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-1 ${customCrop ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"}`}>
            <Plus className="size-3.5"/>{t("scan.other")}
          </button>
        </div>
        {showCustom && (
          <input
            value={customCrop}
            onChange={(e) => setCustomCrop(e.target.value)}
            placeholder={t("scan.customCropPh")}
            maxLength={60}
            className="w-full px-3 py-2 rounded-xl bg-input border border-border text-sm"
          />
        )}
      </div>

      {!imageUrl ? (
        <label className="block rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center cursor-pointer hover:border-primary transition">
          <Camera className="size-10 mx-auto text-primary mb-3" />
          <div className="font-medium">{t("scan.upload")}</div>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
        </label>
      ) : (
        <div className="rounded-3xl overflow-hidden bg-card shadow-soft border border-border">
          <img ref={imgRef} src={imageUrl} crossOrigin="anonymous" className="w-full aspect-square object-cover" alt="Scan" />
          <div className="p-4 space-y-3">
            {preds.length === 0 ? (
              <button disabled={loading} onClick={run} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="size-4 animate-spin"/>{t("scan.analyzing")}</> : <><Brain className="size-4"/>{t("scan.title")}</>}
              </button>
            ) : (
              <>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("scan.result")} {usedLocal && <span className="text-primary">· on-device learned</span>}</div>
                  <div className="text-2xl font-display font-semibold mt-1">{disease?.name}</div>
                  <div className="text-sm text-muted-foreground">{top!.label} · {Math.round(top!.confidence * 100)}% {t("scan.confidence")}</div>
                </div>

                {disease && (
                  <div className={`rounded-xl p-4 border ${disease.severity === "high" ? "bg-destructive/10 border-destructive/30" : disease.severity === "medium" ? "bg-accent/10 border-accent/30" : "bg-primary/10 border-primary/30"}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      {disease.severity === "low" ? <CheckCircle2 className="size-4"/> : <AlertTriangle className="size-4"/>}
                      {t("scan.plan")}
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      {disease.plan.map((p, i) => <li key={i} className="flex gap-2"><span className="text-primary font-bold">→</span>{p}</li>)}
                    </ul>
                  </div>
                )}

                {disease && (
                  <button onClick={speakPlan} className="w-full py-2 rounded-xl bg-accent/20 border border-accent/40 text-sm font-medium flex items-center justify-center gap-2">
                    <Volume2 className="size-4"/>Listen / Écouter
                  </button>
                )}

                {disease && (factsLoading || facts) && (
                  <div className="rounded-xl p-4 border border-border bg-secondary/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <BookOpen className="size-4"/>{t("scan.openFacts")}
                        {facts && (
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            facts.source === "ai" ? "bg-primary/20 text-primary" :
                            facts.source === "user" ? "bg-accent/30 text-accent-foreground" :
                            facts.source === "wikipedia" ? "bg-secondary text-secondary-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {facts.source === "ai" ? <><Sparkle className="size-2.5 inline -mt-0.5"/> AI</> :
                             facts.source === "user" ? "Your note" :
                             facts.source === "wikipedia" ? "Wikipedia" : "Fallback"}
                          </span>
                        )}
                      </div>
                      {facts && !factsEditing && (
                        <div className="flex gap-1">
                          <button onClick={() => { setFactsDraft(facts.extract); setFactsEditing(true); }} className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 flex items-center gap-1">
                            <Pencil className="size-3"/>Edit
                          </button>
                          {facts.source === "user" && (
                            <button onClick={() => { clearUserOverride(disease.name, effectiveCrop, i18n.language); setFactsLoading(true); resolveFacts(disease.name, effectiveCrop, i18n.language, (a) => callAi({ data: a }).then((r: any) => r).catch(() => ({ ok: false }))).then((f) => { setFacts(f); setFactsDraft(f.extract); setFactsLoading(false); }); }} className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80">
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {factsLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
                    {facts && !factsEditing && (
                      <>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{facts.extract}</div>
                        {facts.url && (
                          <a href={facts.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                            {facts.title} · {facts.lang}
                          </a>
                        )}
                      </>
                    )}
                    {facts && factsEditing && (
                      <div className="space-y-2">
                        <textarea value={factsDraft} onChange={(e) => setFactsDraft(e.target.value)} rows={6} maxLength={2000} className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm" />
                        <div className="flex gap-2">
                          <button onClick={() => { const saved = saveUserOverride(disease.name, effectiveCrop, i18n.language, factsDraft); setFacts(saved); setFactsEditing(false); toast.success("Saved — will be reused for future scans"); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1">
                            <Save className="size-3.5"/>Save correction
                          </button>
                          <button onClick={() => setFactsEditing(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm flex items-center gap-1">
                            <X className="size-3.5"/>Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}




                {!correctMode ? (
                  <button onClick={() => setCorrectMode(true)} className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
                    Is this correct? — {t("scan.wrong")}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("scan.correctLabel")}</label>
                    <select value={correctLabel} onChange={(e) => setCorrectLabel(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-input border border-border">
                      <option value="">—</option>
                      {DISEASES.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={save} className="py-3 rounded-xl bg-primary text-primary-foreground font-semibold">{t("scan.save")}</button>
                  <button onClick={retrain} disabled={retraining || bankSize < 3} className="py-3 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {retraining ? <Loader2 className="size-4 animate-spin"/> : <RotateCw className="size-4"/>}
                    {retraining ? t("scan.retraining") : t("scan.retrain")}
                  </button>
                </div>
                <button onClick={sync} disabled={bankSize === 0} className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  <CloudUpload className="size-4"/>{t("sync")}
                </button>
                <button onClick={() => { setImageUrl(null); setFile(null); setPreds([]); setCorrectMode(false); }} className="w-full text-xs text-muted-foreground py-2"><Upload className="size-3 inline mr-1"/>New photo</button>
              </>
            )}
          </div>
        </div>
      )}

      {!user && <Link to="/auth" className="block text-center text-sm text-primary underline">{t("scan.needLogin")}</Link>}

      {celebrate && (
        <div className="fixed inset-0 z-50 pointer-events-none grid place-items-center">
          <div className="relative">
            <Sparkles className="size-32 text-primary animate-ping"/>
            <div className="absolute inset-0 grid place-items-center text-5xl animate-bounce">🌱</div>
          </div>
        </div>
      )}
    </div>
  );
}
