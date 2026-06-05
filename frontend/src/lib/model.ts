// On-device plant analysis stack:
//   1. Base: @tensorflow-models/mobilenet (MobileNetV2, free, on-device)
//   2. Custom on-device learning: @tensorflow-models/knn-classifier
//      (transfer learning from MobileNet embeddings — "Correct AI" feature)
//   3. Optional offline fallback: PlantVillage-trained TF.js graph model
//      (38 classes incl. Rice / Maize / Tomato / Potato diseases).
//      URL is configurable via VITE_PLANTVILLAGE_MODEL_URL. If unreachable,
//      the app silently falls back to MobileNet + KNN — never blocks scanning.
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import { supabase } from "@/integrations/supabase/client";
import { dlog } from "@/lib/debug-log";

// PlantVillage 38-class label map (standard ordering from the public dataset).
export const PLANTVILLAGE_CLASSES = [
  "Apple___Apple_scab","Apple___Black_rot","Apple___Cedar_apple_rust","Apple___healthy",
  "Blueberry___healthy","Cherry___Powdery_mildew","Cherry___healthy",
  "Corn___Cercospora_leaf_spot Gray_leaf_spot","Corn___Common_rust","Corn___Northern_Leaf_Blight","Corn___healthy",
  "Grape___Black_rot","Grape___Esca_(Black_Measles)","Grape___Leaf_blight_(Isariopsis_Leaf_Spot)","Grape___healthy",
  "Orange___Haunglongbing_(Citrus_greening)",
  "Peach___Bacterial_spot","Peach___healthy",
  "Pepper,_bell___Bacterial_spot","Pepper,_bell___healthy",
  "Potato___Early_blight","Potato___Late_blight","Potato___healthy",
  "Raspberry___healthy","Soybean___healthy","Squash___Powdery_mildew",
  "Strawberry___Leaf_scorch","Strawberry___healthy",
  "Tomato___Bacterial_spot","Tomato___Early_blight","Tomato___Late_blight","Tomato___Leaf_Mold",
  "Tomato___Septoria_leaf_spot","Tomato___Spider_mites Two-spotted_spider_mite","Tomato___Target_Spot",
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus","Tomato___Tomato_mosaic_virus","Tomato___healthy",
];

// Public PlantVillage TF.js model (override via env). Browser caches model.json + shards;
// once loaded, predictions work fully offline.
const PLANTVILLAGE_MODEL_URL =
  (import.meta as any).env?.VITE_PLANTVILLAGE_MODEL_URL ||
  "https://raw.githubusercontent.com/imskr/Plant_Disease_Detection/master/tfjs_model/model.json";

let modelPromise: Promise<mobilenet.MobileNet> | null = null;
let plantVillagePromise: Promise<tf.GraphModel | null> | null = null;
let knn: knnClassifier.KNNClassifier | null = null;
let backendPromise: Promise<void> | null = null;
let modelReady = false;
let backendName: string | null = null;
let lastError: string | null = null;

export function getModelStatus() {
  return {
    backend: backendName,
    modelLoaded: modelReady,
    lastError,
    tfVersion: tf.version.tfjs,
  };
}

async function ensureBackend() {
  if (!backendPromise) {
    backendPromise = (async () => {
      try {
        await tf.setBackend("webgl");
        dlog.info("model", "Backend set: webgl");
      } catch (e: any) {
        dlog.warn("model", "webgl failed, falling back to cpu", { error: e?.message });
        await tf.setBackend("cpu");
      }
      await tf.ready();
      backendName = tf.getBackend();
      dlog.info("model", `TF ready, backend=${backendName}`);
    })();
  }
  return backendPromise;
}

export async function loadModel() {
  try {
    await ensureBackend();
    if (!modelPromise) {
      dlog.info("model", "Loading MobileNetV2…");
      modelPromise = mobilenet.load({ version: 2, alpha: 1.0 }).then(m => {
        modelReady = true;
        dlog.info("model", "MobileNetV2 loaded");
        return m;
      });
    }
    return await modelPromise;
  } catch (e: any) {
    lastError = e?.message || String(e);
    modelReady = false;
    modelPromise = null;
    dlog.error("model", "Model load failed", { error: lastError });
    throw e;
  }
}

/**
 * Optional offline PlantVillage classifier. Loaded lazily and cached.
 * Returns null (and never throws) if the public model URL is unreachable —
 * scanner then falls back to MobileNet + KNN.
 */
export async function loadPlantVillage(): Promise<tf.GraphModel | null> {
  if (!plantVillagePromise) {
    plantVillagePromise = (async () => {
      try {
        await ensureBackend();
        dlog.info("model", "Loading PlantVillage TF.js model…", { url: PLANTVILLAGE_MODEL_URL });
        const m = await tf.loadGraphModel(PLANTVILLAGE_MODEL_URL);
        dlog.info("model", "PlantVillage model loaded");
        return m;
      } catch (e: any) {
        dlog.warn("model", "PlantVillage load failed — falling back to MobileNet only", { error: e?.message });
        return null;
      }
    })();
  }
  return plantVillagePromise;
}

/** Returns the lazily-initialised KNN classifier (transfer-learning head). */
export function getKNN(): knnClassifier.KNNClassifier {
  if (!knn) knn = knnClassifier.create();
  return knn;
}

export async function healthCheck(): Promise<{ ok: boolean; backend: string | null; modelLoaded: boolean; error?: string }> {
  try {
    await loadModel();
    // Warm up PlantVillage in background; ignore failure.
    loadPlantVillage().catch(() => {});
    return { ok: true, backend: backendName, modelLoaded: true };
  } catch (e: any) {
    return { ok: false, backend: backendName, modelLoaded: false, error: e?.message || String(e) };
  }
}

export type Prediction = { label: string; confidence: number };
export type BankStatus = "pending" | "approved" | "rejected";
export type BankEntry = { label: string; embedding: number[]; scanId?: string; status: BankStatus };

const STORAGE_KEY = "scc.local-bank.v2";

function loadBank(): BankEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // migrate v1 -> v2
    const old = localStorage.getItem("scc.local-bank.v1");
    if (old) {
      const arr = JSON.parse(old) as { label: string; embedding: number[] }[];
      const upgraded: BankEntry[] = arr.map(e => ({ ...e, status: "pending" }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
      return upgraded;
    }
  } catch {}
  return [];
}
function saveBank(b: BankEntry[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); }

export function getBankSize() { return loadBank().length; }
export function getApprovedCount() { return loadBank().filter(e => e.status === "approved").length; }
export function getBankBreakdown() {
  const b = loadBank();
  return {
    total: b.length,
    approved: b.filter(e => e.status === "approved").length,
    pending: b.filter(e => e.status === "pending").length,
    rejected: b.filter(e => e.status === "rejected").length,
  };
}

async function embed(img: HTMLImageElement | HTMLCanvasElement): Promise<number[]> {
  const m = await loadModel();
  const act = m.infer(img, true) as tf.Tensor;
  const arr = Array.from(await act.data());
  act.dispose();
  return arr;
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

/** Hydrate the in-memory KNN classifier from approved bank entries. */
function syncKnnFromBank() {
  const cls = getKNN();
  cls.clearAllClasses();
  const approved = loadBank().filter(e => e.status === "approved");
  for (const e of approved) {
    const t = tf.tensor(e.embedding);
    cls.addExample(t, e.label);
    t.dispose();
  }
}

/** Run PlantVillage CNN inference (offline, 38 classes). Returns null on any error. */
async function classifyPlantVillage(img: HTMLImageElement): Promise<Prediction[] | null> {
  const m = await loadPlantVillage();
  if (!m) return null;
  try {
    return tf.tidy(() => {
      const input = tf.browser.fromPixels(img)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255)
        .expandDims(0);
      const out = m.predict(input) as tf.Tensor;
      const data = out.dataSync();
      const ranked = Array.from(data)
        .map((p, i) => ({ label: PLANTVILLAGE_CLASSES[i] ?? `class_${i}`, confidence: p }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
      return ranked;
    });
  } catch (e: any) {
    dlog.warn("model", "PlantVillage inference failed", { error: e?.message });
    return null;
  }
}

export async function analyze(img: HTMLImageElement): Promise<{ predictions: Prediction[]; embedding: number[]; usedLocal: boolean }> {
  const m = await loadModel();
  const emb = await embed(img);

  // 1) Try on-device KNN trained from user corrections (transfer learning).
  syncKnnFromBank();
  const cls = getKNN();
  if (cls.getNumClasses() >= 1) {
    try {
      const t = tf.tensor(emb);
      const res = await cls.predictClass(t, 3);
      t.dispose();
      if (res && res.confidences[res.label] >= 0.55) {
        const ranked = Object.entries(res.confidences)
          .sort((a, b) => b[1] - a[1])
          .map(([label, confidence]) => ({ label, confidence }));
        return { predictions: ranked, embedding: emb, usedLocal: true };
      }
    } catch (e: any) {
      dlog.warn("model", "KNN predict failed, falling through", { error: e?.message });
    }
  }

  // 2) Try PlantVillage offline classifier for crop-specific diseases.
  const pv = await classifyPlantVillage(img);
  if (pv && pv[0] && pv[0].confidence >= 0.4) {
    return { predictions: pv, embedding: emb, usedLocal: false };
  }

  // 3) Fall back to generic MobileNet ImageNet classes.
  const general = await m.classify(img, 3);
  return {
    predictions: general.map((g) => ({ label: g.className, confidence: g.probability })),
    embedding: emb,
    usedLocal: false,
  };
}

export function addCorrection(label: string, embedding: number[], scanId?: string) {
  const bank = loadBank();
  // Until an admin approves, status is "pending" — does NOT affect predictions.
  bank.push({ label, embedding, scanId, status: "pending" });
  if (bank.length > 200) bank.shift();
  saveBank(bank);
  syncKnnFromBank();
  return bank.length;
}

/** Sync statuses from Supabase for any bank entries that have a scanId. */
export async function syncCorrectionStatuses(): Promise<{ approved: number; rejected: number; pending: number }> {
  const bank = loadBank();
  const ids = bank.map(e => e.scanId).filter((x): x is string => !!x);
  if (ids.length === 0) {
    const b = getBankBreakdown();
    return { approved: b.approved, rejected: b.rejected, pending: b.pending };
  }
  const { data } = await supabase.from("scans").select("id, correction_status").in("id", ids);
  const map = new Map<string, string>();
  (data ?? []).forEach((r: any) => map.set(r.id, r.correction_status ?? "pending"));
  const next = bank.map(e => {
    if (!e.scanId) return e;
    const s = map.get(e.scanId);
    if (s === "approved" || s === "rejected" || s === "pending") return { ...e, status: s as BankStatus };
    return e;
  });
  // Drop rejected entries entirely so they can never influence the model.
  const cleaned = next.filter(e => e.status !== "rejected");
  saveBank(cleaned);
  return {
    approved: cleaned.filter(e => e.status === "approved").length,
    rejected: 0,
    pending: cleaned.filter(e => e.status === "pending").length,
  };
}

export async function retrainHead(): Promise<{ approved: number; pending: number; total: number }> {
  // Pull latest moderation decisions then re-seed the KNN classifier.
  await syncCorrectionStatuses();
  syncKnnFromBank();
  await new Promise((r) => setTimeout(r, 600));
  return getBankBreakdown();
}
