import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WATERING } from "@/lib/diseases";
import { Droplets } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [{ title: "Watering Schedules — AgriVision" }, { name: "description", content: "Crop watering schedules for rice and peanuts." }] }),
  component: Learn,
});

function Learn() {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<"rice" | "peanuts">("rice");
  const rows = WATERING[crop];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("learn.title")}</h1>
      </div>
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {(["rice", "peanuts"] as const).map((c) => (
          <button key={c} onClick={() => setCrop(c)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg ${crop === c ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
            {t(`learn.${c}`)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl bg-card p-4 border border-border shadow-soft flex gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Droplets className="size-5"/></div>
            <div>
              <div className="font-semibold">{r.stage}</div>
              <div className="text-sm text-muted-foreground">{r.water}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
