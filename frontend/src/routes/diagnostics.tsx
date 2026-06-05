import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getModelStatus, healthCheck, loadModel } from "@/lib/model";
import { getLogs, clearLogs, logsAsText, isDebugEnabled, setDebugEnabled, getLastScanError, dlog } from "@/lib/debug-log";
import { Activity, RefreshCw, Trash2, Download, Upload, Bug, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({ meta: [{ title: "Diagnostics — AgriVision" }, { name: "description", content: "TensorFlow backend, model status, debug logs, and last scan error." }] }),
  component: Diagnostics,
});

function Diagnostics() {
  const { user } = useAuth();
  const [status, setStatus] = useState(getModelStatus());
  const [logs, setLogs] = useState(getLogs());
  const [debug, setDebug] = useState(isDebugEnabled());
  const [lastErr, setLastErr] = useState(getLastScanError());
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = () => { setStatus(getModelStatus()); setLogs(getLogs()); setLastErr(getLastScanError()); };

  useEffect(() => { const id = setInterval(refresh, 1500); return () => clearInterval(id); }, []);

  const runCheck = async () => {
    setChecking(true);
    dlog.info("diagnostics", "Manual health check started");
    const r = await healthCheck();
    setChecking(false);
    refresh();
    if (r.ok) toast.success(`Healthy — backend: ${r.backend}`);
    else toast.error(`Not ready: ${r.error}`);
  };

  const tryRecover = async () => {
    try { await loadModel(); toast.success("Model reloaded"); }
    catch (e: any) { toast.error(e.message || "Reload failed"); }
    refresh();
  };

  const toggleDebug = (v: boolean) => { setDebugEnabled(v); setDebug(v); dlog.warn("diagnostics", `Debug mode ${v ? "ON" : "OFF"}`); };

  const download = () => {
    const blob = new Blob([logsAsText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `agrivision-debug-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const uploadReport = async () => {
    if (!user) return toast.error("Sign in to upload a report");
    setUploading(true);
    try {
      const body = JSON.stringify({
        ua: navigator.userAgent,
        online: navigator.onLine,
        url: location.href,
        status: getModelStatus(),
        lastScanError: getLastScanError(),
        logs: getLogs(),
      }, null, 2);
      const path = `${user.id}/debug-${Date.now()}.json`;
      const { error } = await supabase.storage.from("scans").upload(path, new Blob([body], { type: "application/json" }));
      if (error) throw error;
      toast.success("Debug report uploaded");
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally { setUploading(false); }
  };

  const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
      {ok ? <CheckCircle2 className="size-4"/> : <AlertTriangle className="size-4"/>}{label}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Activity className="size-6"/>Diagnostics</h1>
        <p className="text-sm text-muted-foreground mt-1">Backend, model status, and debug logs.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">TensorFlow</div>
        <div className="grid grid-cols-2 gap-2">
          <StatusPill ok={!!status.backend} label={`Backend: ${status.backend ?? "not initialized"}`}/>
          <StatusPill ok={status.modelLoaded} label={status.modelLoaded ? "Model loaded" : "Model not loaded"}/>
        </div>
        <div className="text-xs text-muted-foreground">tfjs v{status.tfVersion}</div>
        {status.lastError && <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{status.lastError}</div>}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={runCheck} disabled={checking} className="py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"><RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`}/>Health check</button>
          <button onClick={tryRecover} className="py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium">Reload model</button>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Last scan error</div>
        {lastErr ? (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm">
            <div className="font-medium text-destructive">{lastErr.msg}</div>
            <div className="text-xs text-muted-foreground mt-1">{new Date(lastErr.at).toLocaleString()}</div>
          </div>
        ) : <div className="text-sm text-muted-foreground">No errors recorded.</div>}
        <Link to="/scan" className="block text-center py-2.5 rounded-xl bg-accent text-accent-foreground font-medium">Go to scanner</Link>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-2"><Bug className="size-3.5"/>Debug log mode</div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={debug} onChange={(e) => toggleDebug(e.target.checked)} className="size-4"/>
            <span>{debug ? "Recording" : "Off"}</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">When ON, scanning steps (permissions, image capture, GPS, model inference, uploads) are recorded locally. Upload with the button below when reporting a problem.</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={refresh} className="py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-1"><RefreshCw className="size-3.5"/>Refresh</button>
          <button onClick={download} className="py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-1"><Download className="size-3.5"/>Download</button>
          <button onClick={() => { clearLogs(); setLogs([]); }} className="py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-1"><Trash2 className="size-3.5"/>Clear</button>
        </div>
        <button onClick={uploadReport} disabled={uploading} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"><Upload className="size-4"/>{uploading ? "Uploading…" : "Upload debug report"}</button>

        <div className="rounded-xl bg-muted/40 border border-border p-2 max-h-72 overflow-auto font-mono text-[11px] leading-relaxed">
          {logs.length === 0 ? <div className="p-2 text-muted-foreground">No logs yet.</div> : logs.slice().reverse().map((e, i) => (
            <div key={i} className={`px-2 py-1 border-b border-border/30 ${e.level === "error" ? "text-destructive" : e.level === "warn" ? "text-accent-foreground" : ""}`}>
              <span className="opacity-60">{new Date(e.t).toLocaleTimeString()}</span> <span className="uppercase font-semibold">{e.level}</span> <span className="opacity-80">[{e.tag}]</span> {e.msg}
              {e.meta && <div className="opacity-70 pl-4">{JSON.stringify(e.meta)}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
