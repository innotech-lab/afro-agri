// Server function: calls AI gateway to get
// plant-pathology expert info.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const enrichDisease = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      disease: z.string().trim().min(1).max(120),
      crop: z.string().trim().min(1).max(80),
      lang: z.enum(["en", "fr", "rn", "rw"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const langName = { en: "English", fr: "French", rn: "Kirundi", rw: "Kinyarwanda" }[data.lang];
    const prompt = `You are a plant pathology expert for East African smallholder farmers.
Crop: ${data.crop}
Disease / condition: ${data.disease}

Respond in ${langName}. Be concise (max 120 words). Cover:
1) What it is and how it spreads
2) Visible symptoms
3) Two practical treatments using LOCAL low-cost materials (neem, ash, soap, garlic, milk, etc.)
4) One prevention tip

Plain text only, no markdown headings, no asterisks.`;

    // AI gateway removed — this function is disabled.
    return { ok: false, error: "AI gateway removed" } as const;
  });
