// Disease catalog with management plans using LOCAL materials.
export type DiseaseInfo = {
  id: string;
  name: string;
  crop: string[];
  severity: "low" | "medium" | "high";
  symptoms: string;
  plan: string[];
};

export const DISEASES: DiseaseInfo[] = [
  { id: "healthy", name: "Healthy plant", crop: ["any"], severity: "low",
    symptoms: "No visible disease signs.",
    plan: ["Continue regular watering & weeding.", "Inspect weekly for early symptoms."] },
  { id: "leaf_blight", name: "Leaf Blight", crop: ["maize", "rice"], severity: "high",
    symptoms: "Long greyish-brown lesions on leaves.",
    plan: ["Remove and burn infected leaves.", "Spray Neem oil (10ml/1L) every 7 days.", "Rotate with legumes next season."] },
  { id: "leaf_rust", name: "Leaf Rust", crop: ["coffee", "beans", "maize"], severity: "high",
    symptoms: "Orange-yellow powdery spots under leaves.",
    plan: ["Dust leaves with wood ash at dawn.", "Garlic spray: 100g garlic / 1L water.", "Prune & space plants for airflow."] },
  { id: "powdery_mildew", name: "Powdery Mildew", crop: ["beans", "banana"], severity: "medium",
    symptoms: "White powder on leaves & stems.",
    plan: ["Milk spray 1:9 weekly.", "Wood ash + soap water on undersides.", "Avoid overhead watering."] },
  { id: "anthracnose", name: "Anthracnose", crop: ["banana", "beans", "cassava"], severity: "high",
    symptoms: "Dark sunken spots on leaves and fruit.",
    plan: ["Cut and burn infected parts.", "Neem leaf decoction (1kg/5L water).", "Mulch with dry banana leaves."] },
  { id: "aphids", name: "Aphid Infestation", crop: ["beans", "peanuts"], severity: "medium",
    symptoms: "Curled leaves; small insects on shoots.",
    plan: ["Soapy water spray (1 tbsp/1L).", "Encourage ladybugs.", "Hot pepper + garlic spray weekly."] },
  { id: "cassava_mosaic", name: "Cassava Mosaic Virus", crop: ["cassava"], severity: "high",
    symptoms: "Yellow mottled patches; deformed leaves.",
    plan: ["Uproot and burn infected plants.", "Use certified clean cuttings.", "Control whiteflies with Neem."] },
  { id: "rice_blast", name: "Rice Blast", crop: ["rice"], severity: "high",
    symptoms: "Diamond-shaped grey lesions on rice leaves; collar rot.",
    plan: ["Reduce nitrogen fertilizer.", "Improve field drainage; avoid stagnant water.", "Use resistant varieties next season.", "Burn crop residue after harvest."] },
  { id: "tomato_leaf_miner", name: "Tomato Leaf Miner", crop: ["tomato"], severity: "high",
    symptoms: "Winding white tunnels in tomato leaves; blotches.",
    plan: ["Remove and destroy infected leaves.", "Hang yellow sticky traps every 5m.", "Spray Neem oil (10ml/1L) at dusk weekly.", "Rotate with non-solanaceous crops."] },
  { id: "mango_mealybug", name: "Mango Mealybug", crop: ["mango"], severity: "medium",
    symptoms: "White cottony clusters on mango branches & leaves.",
    plan: ["Prune infected branches and burn.", "Spray soap-water (2 tbsp/1L) on clusters.", "Band tree trunks with sticky grease.", "Encourage ladybugs and lacewings."] },
];

export function mapPredictionToDisease(label: string, crop: string): DiseaseInfo {
  const l = label.toLowerCase();
  if (crop === "rice" && (l.includes("blast") || l.includes("lesion"))) return DISEASES.find(d=>d.id==="rice_blast")!;
  if (crop === "tomato" && (l.includes("miner") || l.includes("tunnel") || l.includes("leaf"))) return DISEASES.find(d=>d.id==="tomato_leaf_miner")!;
  if (crop === "mango" && (l.includes("mealy") || l.includes("white"))) return DISEASES.find(d=>d.id==="mango_mealybug")!;
  if (l.includes("rust") || l.includes("orange")) return DISEASES.find(d=>d.id==="leaf_rust")!;
  if (l.includes("mildew")) return DISEASES.find(d=>d.id==="powdery_mildew")!;
  if (l.includes("blight") || l.includes("brown")) return DISEASES.find(d=>d.id==="leaf_blight")!;
  if (l.includes("aphid") || l.includes("insect")) return DISEASES.find(d=>d.id==="aphids")!;
  if (l.includes("cassava") || l.includes("mosaic")) return DISEASES.find(d=>d.id==="cassava_mosaic")!;
  if (l.includes("anthrac") || l.includes("dark") || l.includes("spot")) return DISEASES.find(d=>d.id==="anthracnose")!;
  const candidates = DISEASES.filter(d => d.crop.includes(crop));
  return candidates[0] ?? DISEASES[0];
}

export const WATERING = {
  rice: [
    { stage: "Nursery (0-25 days)", water: "Keep soil saturated, 2-3 cm standing water" },
    { stage: "Transplanting", water: "5 cm standing water for 1 week" },
    { stage: "Tillering (25-45 d)", water: "3-5 cm continuous flooding" },
    { stage: "Panicle initiation", water: "5 cm flooding — critical, never dry" },
    { stage: "Flowering (60-80 d)", water: "5-7 cm flooding — most sensitive stage" },
    { stage: "Grain filling", water: "Maintain 3-5 cm; alternate wet/dry OK" },
    { stage: "2 weeks before harvest", water: "Drain field completely" },
  ],
  peanuts: [
    { stage: "Sowing (0-15 d)", water: "20-25 mm/week" },
    { stage: "Vegetative (15-40 d)", water: "25-30 mm/week" },
    { stage: "Flowering (40-65 d)", water: "35-40 mm/week — critical" },
    { stage: "Pegging & pod set (65-90 d)", water: "40-45 mm/week — most critical" },
    { stage: "Pod filling (90-110 d)", water: "30-35 mm/week" },
    { stage: "Maturity (110-130 d)", water: "Reduce to 15 mm/week" },
  ],
};
