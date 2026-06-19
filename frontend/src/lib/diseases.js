// Disease catalog — adapted from afroagri-main/src/lib/diseases.ts
export const DISEASES = [
  {
    id: "late_blight",
    name: "Mildiou",
    crops: ["Tomate", "Pomme de terre"],
    severity: "high",
    symptoms: "Taches brun-noir sur feuilles et tiges, pourriture des fruits",
    management: "Bouillie bordelaise, éliminer les parties atteintes, rotation cultures",
  },
  {
    id: "bacterial_wilt",
    name: "Flétrissement bactérien",
    crops: ["Tomate", "Arachide", "Maïs"],
    severity: "high",
    symptoms: "Flétrissement rapide, tiges molles, sève laiteuse",
    management: "Arracher et brûler les plants, éviter excès eau, jachère 2 ans",
  },
  {
    id: "leaf_rust",
    name: "Rouille foliaire",
    crops: ["Maïs", "Riz", "Arachide"],
    severity: "medium",
    symptoms: "Pustules orangées sur la face inférieure des feuilles",
    management: "Cendres de bois, variétés résistantes, éviter humidité excessive",
  },
  {
    id: "mosaic_virus",
    name: "Virus de la mosaïque",
    crops: ["Manioc", "Tomate", "Maïs"],
    severity: "high",
    symptoms: "Feuilles déformées, jaunissement en mosaïque, nanisme",
    management: "Contrôle pucerons/aleurodes, plants certifiés, éliminer plants infectés",
  },
  {
    id: "root_rot",
    name: "Pourriture des racines",
    crops: ["Riz", "Manioc", "Arachide"],
    severity: "medium",
    symptoms: "Jaunissement à la base, racines brunes et molles",
    management: "Drainage amélioré, huile de neem, rotation avec légumineuses",
  },
  {
    id: "striga",
    name: "Striga (herbe sorcière)",
    crops: ["Maïs", "Sorgho", "Mil"],
    severity: "high",
    symptoms: "Plante parasite à fleurs roses/blanches, nanisme des cultures",
    management: "Sarclage précoce, plantes pièges (Desmodium), légumineuses en inter-rang",
  },
  {
    id: "cercospora",
    name: "Cercosporiose",
    crops: ["Arachide", "Banane", "Riz"],
    severity: "medium",
    symptoms: "Taches foliaires brunes entourées d'un halo jaune",
    management: "Spray ail-piment, espacer les plants, éviter irrigation foliaire",
  },
  {
    id: "armyworm",
    name: "Chenille légionnaire",
    crops: ["Maïs", "Riz", "Sorgho"],
    severity: "high",
    symptoms: "Feuilles dévorées la nuit, déjections visibles, plants décapités",
    management: "Cendres de bois sur les plants, prédateurs naturels, pièges lumineux",
  },
  {
    id: "anthracnose",
    name: "Anthracnose",
    crops: ["Haricot", "Manioc", "Tomate"],
    severity: "medium",
    symptoms: "Lésions sombres et concaves sur fruits et tiges",
    management: "Bouillie bordelaise, graines saines, rotation des cultures",
  },
  {
    id: "cassava_brown_streak",
    name: "Striure brune du manioc",
    crops: ["Manioc"],
    severity: "high",
    symptoms: "Striures jaunes/brunes sur tiges, nécrose des tubercules",
    management: "Variétés résistantes (NASE 14), boutures saines, éliminer plants infectés",
  },
]

// Yield baselines (t/ha) per crop
export const YIELD_BASELINES = {
  "riz":      { baseline: 4.0,  max: 7.5,  unit: "t/ha", icon: "🌾" },
  "maïs":     { baseline: 2.5,  max: 5.0,  unit: "t/ha", icon: "🌽" },
  "manioc":   { baseline: 12.0, max: 22.0, unit: "t/ha", icon: "🥔" },
  "tomate":   { baseline: 25.0, max: 45.0, unit: "t/ha", icon: "🍅" },
  "arachide": { baseline: 1.5,  max: 3.0,  unit: "t/ha", icon: "🥜" },
  "haricot":  { baseline: 1.0,  max: 2.5,  unit: "t/ha", icon: "🫘" },
  "sorgho":   { baseline: 1.8,  max: 4.0,  unit: "t/ha", icon: "🌾" },
  "mil":      { baseline: 1.2,  max: 2.5,  unit: "t/ha", icon: "🌾" },
  "banane":   { baseline: 20.0, max: 35.0, unit: "t/ha", icon: "🍌" },
}

// Watering schedules by crop
export const WATERING = {
  riz: [
    { stage: "Germination (J0–J7)",        liters: 3, days: 1, note: "Sol saturé, maintenir lame d'eau 2cm" },
    { stage: "Tallage (J8–J30)",           liters: 5, days: 2, note: "Lame d'eau 5cm, fertilisation azote" },
    { stage: "Montaison (J31–J60)",        liters: 6, days: 2, note: "Maintenir niveau constant, critique pour rendement" },
    { stage: "Épiaison (J61–J85)",         liters: 7, days: 1, note: "Besoin max en eau, pas de stress hydrique" },
    { stage: "Maturation (J86–J110)",      liters: 4, days: 3, note: "Réduire progressivement, drainer 10j avant récolte" },
    { stage: "Récolte (J111–J120)",        liters: 0, days: 0, note: "Sol sec requis pour mécanisation" },
  ],
  maïs: [
    { stage: "Germination (J0–J10)",       liters: 3, days: 2, note: "Sol humide, pas de stagnation" },
    { stage: "Végétation (J11–J40)",       liters: 4, days: 3, note: "Arrosage matinal préférable" },
    { stage: "Floraison (J41–J65)",        liters: 6, days: 2, note: "Période critique — zéro stress hydrique" },
    { stage: "Remplissage grain (J66–J90)",liters: 5, days: 2, note: "Maintenir humidité régulière" },
    { stage: "Maturation (J91–J110)",      liters: 2, days: 4, note: "Réduire, favoriser séchage naturel" },
  ],
  arachide: [
    { stage: "Semis (J0–J10)",             liters: 3, days: 2, note: "Humidité constante pour levée" },
    { stage: "Croissance (J11–J40)",       liters: 4, days: 3, note: "Arrosage régulier, éviter excès" },
    { stage: "Floraison (J41–J70)",        liters: 5, days: 2, note: "Important — période de gynophore" },
    { stage: "Fructification (J71–J100)",  liters: 4, days: 3, note: "Sol meuble, eau modérée" },
    { stage: "Maturation (J101–J130)",     liters: 2, days: 5, note: "Réduire fort, facilite arrachage" },
  ],
  manioc: [
    { stage: "Bouturage (J0–J30)",         liters: 3, days: 3, note: "Humide mais bien drainé" },
    { stage: "Croissance (J31–J90)",       liters: 4, days: 4, note: "Culture tolérante à la sécheresse" },
    { stage: "Tubérisation (J91–J180)",    liters: 3, days: 5, note: "Arrosage léger, éviter pourriture" },
    { stage: "Maturation (J181–J270)",     liters: 2, days: 7, note: "Très tolérant, pluie suffit" },
  ],
  tomate: [
    { stage: "Transplantation (J0–J7)",    liters: 2, days: 1, note: "Arroser chaque jour après repiquage" },
    { stage: "Végétation (J8–J30)",        liters: 3, days: 2, note: "Garder sol humide mais pas détrempé" },
    { stage: "Floraison (J31–J55)",        liters: 4, days: 2, note: "Critique — éviter stress hydrique" },
    { stage: "Fructification (J56–J75)",   liters: 5, days: 2, note: "Besoins max, goutte à goutte idéal" },
    { stage: "Récolte (J76–J90)",          liters: 3, days: 3, note: "Réduire pour améliorer la saveur" },
  ],
}

// Scout badges
export const BADGES = [
  { id: "seedling", label: "Pousse verte",      min: 1,   icon: "🌱", desc: "Votre premier diagnostic" },
  { id: "sprout",   label: "Scout Terrain",      min: 10,  icon: "🌿", desc: "10 diagnostics soumis" },
  { id: "digital",  label: "Digital Farmer",     min: 50,  icon: "🌾", desc: "50 diagnostics — certification" },
  { id: "captain",  label: "Capitaine Champ",    min: 100, icon: "🏆", desc: "100 diagnostics, expert local" },
  { id: "hero",     label: "Héros des Récoltes", min: 250, icon: "🥇", desc: "250 diagnostics, référence nationale" },
  { id: "legend",   label: "Agro Légende",       min: 500, icon: "🌟", desc: "500 diagnostics, pionnier AfroAgri" },
]

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function normalizeDiseaseName(name = "") {
  return name.toLowerCase().replace(/[^a-zàâéèêëîïôûùüç]/g, " ").trim()
}
