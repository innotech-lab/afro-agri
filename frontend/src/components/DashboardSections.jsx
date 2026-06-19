/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { AlertTriangle, Droplets, Trophy, TrendingUp, ChevronRight, Loader2, MapPin } from 'lucide-react'
import ResourceManager from './ResourceManager'
import MapWidget from './MapWidget'
import { MapView, ProfileView, ReportsView, SettingsView } from './DashboardExtras'
import { DISEASES, YIELD_BASELINES, WATERING, BADGES, haversineKm, normalizeDiseaseName } from '../lib/diseases'

const waterOptions = ['Forage', 'Pluie', 'Irrigation', 'Riviere'].map(value => ({ value, label: value }))

export const champConfig = {
  title: 'Champs',
  description: 'Informations, superficies, sources d’eau et coordonnées des exploitations',
  endpoint: '/api/champs/',
  idKey: 'id_champ',
  columns: [
    { key: 'id_champ', label: 'ID' },
    { key: 'superficie', label: 'Superficie (ha)' },
    { key: 'source_eau', label: 'Source d’eau' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
  ],
  fields: [
    { name: 'superficie', label: 'Superficie (ha)', type: 'number', step: '0.01' },
    { name: 'source_eau', label: 'Source d’eau', type: 'select', options: waterOptions },
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any' },
    { name: 'longitude', label: 'Longitude', type: 'number', step: 'any' },
  ],
}

export const plantConfig = {
  title: 'Plantes',
  description: 'Cultures et variétés enregistrées dans les champs',
  endpoint: '/api/plantes/',
  idKey: 'id_plante',
  columns: [
    { key: 'id_plante', label: 'ID' },
    { key: 'nom_plante', label: 'Culture' },
    { key: 'variete', label: 'Variété' },
    { key: 'date_plantation', label: 'Plantation' },
    { key: 'id_champ', label: 'Champ' },
  ],
  fields: [
    { name: 'nom_plante', label: 'Nom de la culture' },
    { name: 'variete', label: 'Variété' },
    { name: 'date_plantation', label: 'Date de plantation', type: 'date' },
    { name: 'id_champ', label: 'Champ', type: 'select', optionsEndpoint: '/api/champs/', optionValue: 'id_champ', optionLabel: 'id_champ' },
  ],
}

const journalConfig = {
  title: 'Journal agricole',
  description: 'Observations, stades de croissance, symptômes et maladies suspectées',
  endpoint: '/api/journal/',
  idKey: 'id_journal',
  columns: [
    { key: 'date_observation', label: 'Date' },
    { key: 'id_plante', label: 'Plante' },
    { key: 'stade_croissance', label: 'Stade' },
    { key: 'symptomes', label: 'Symptômes' },
    { key: 'maladie_suspecte', label: 'Maladie suspectée' },
  ],
  fields: [
    { name: 'id_plante', label: 'Plante', type: 'select', optionsEndpoint: '/api/plantes/', optionValue: 'id_plante', optionLabel: 'nom_plante' },
    { name: 'date_observation', label: 'Date', type: 'date' },
    { name: 'stade_croissance', label: 'Stade de croissance' },
    { name: 'symptomes', label: 'Symptômes' },
    { name: 'ravageur_suspecte', label: 'Ravageur suspecté' },
    { name: 'maladie_suspecte', label: 'Maladie suspectée' },
    { name: 'id_user', label: 'Utilisateur', type: 'select', optionsEndpoint: '/api/users/users/', optionValue: 'id_user', optionLabel: 'email' },
    { name: 'session_uuid', label: 'Identifiant session', defaultValue: 'dashboard' },
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', defaultValue: 0 },
    { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', defaultValue: 0 },
  ],
}

const diagnosticConfig = {
  title: 'Diagnostics',
  description: 'Résultats IA, maladies détectées, niveaux de confiance et recommandations',
  endpoint: '/api/diagnostic/',
  idKey: 'id_diagnostic',
  columns: [
    { key: 'id_diagnostic', label: 'ID' },
    { key: 'id_journal', label: 'Journal' },
    { key: 'maladie_detectee', label: 'Maladie' },
    { key: 'confiance', label: 'Confiance (%)' },
    { key: 'traitement_suggere', label: 'Recommandation' },
    { key: 'created_at', label: 'Date' },
  ],
  fields: [
    { name: 'maladie_detectee', label: 'Maladie détectée' },
    { name: 'confiance', label: 'Confiance (%)', type: 'number', step: '0.01' },
    { name: 'ravageur_detecte', label: 'Ravageur détecté', required: false },
    { name: 'traitement_suggere', label: 'Traitement suggéré', type: 'textarea', fullWidth: true, required: false },
    { name: 'source_github', label: 'Source', type: 'url', fullWidth: true, required: false },
  ],
  canCreate: true,
  createHref: '/analyser',
}

const soilConfig = {
  title: 'Études de sol',
  description: 'Résultats d’analyses chimiques et niveau de fertilité des sols',
  endpoint: '/api/etude-sol/',
  idKey: 'id_etude_sol',
  columns: [
    { key: 'date_analyse', label: 'Date' },
    { key: 'id_champ', label: 'Champ' },
    { key: 'type_sol', label: 'Type de sol' },
    { key: 'ph_sol', label: 'pH' },
    { key: 'fertilite', label: 'Fertilité' },
    { key: 'rapport_analyse', label: 'Rapport' },
  ],
  fields: [
    { name: 'id_champ', label: 'Champ', type: 'select', optionsEndpoint: '/api/champs/', optionValue: 'id_champ', optionLabel: 'id_champ' },
    { name: 'date_analyse', label: 'Date d’analyse', type: 'date' },
    { name: 'ph_sol', label: 'pH du sol' },
    { name: 'matiere_organique', label: 'Matière organique' },
    { name: 'azote', label: 'Azote' },
    { name: 'phosphore', label: 'Phosphore' },
    { name: 'potassium', label: 'Potassium' },
    { name: 'humidite', label: 'Humidité' },
    { name: 'type_sol', label: 'Type de sol' },
    { name: 'fertilite', label: 'Fertilité' },
    { name: 'rapport_analyse', label: 'Rapport d’analyse', type: 'textarea', fullWidth: true },
  ],
}

const userConfig = {
  title: 'Utilisateurs',
  description: 'Comptes, identités et rôles d’accès à la plateforme',
  endpoint: '/api/users/users/',
  idKey: 'id_user',
  columns: [
    { key: 'id_user', label: 'ID' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'nom', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'id_type', label: 'Rôle', render: row => row.id_type?.type ?? row.id_type ?? '—' },
    { key: 'created_at', label: 'Création' },
  ],
  fields: [
    { name: 'prenom', label: 'Prénom' },
    { name: 'nom', label: 'Nom', required: false },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Mot de passe', type: 'password', optionalOnEdit: true },
    { name: 'id_type', label: 'Rôle', type: 'select', optionsEndpoint: '/api/type-users/', optionValue: 'id_type', optionLabel: 'type' },
  ],
}

function readonly(config) {
  return <ResourceManager {...config} readOnly canCreate={false} canEdit={false} canDelete={false} />
}

// ─── Outbreak Detection ───────────────────────────────────────────────────────
function clusterOutbreaks(entries, radiusKm = 5) {
  const visited = new Set()
  const clusters = []
  const sick = entries.filter(e => e.maladie_suspecte?.trim())

  for (let i = 0; i < sick.length; i++) {
    if (visited.has(i)) continue
    const a = sick[i]
    const members = [a]
    visited.add(i)
    for (let j = i + 1; j < sick.length; j++) {
      if (visited.has(j)) continue
      const b = sick[j]
      if (!a.latitude || !b.latitude) continue
      const dist = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude)
      if (dist <= radiusKm) {
        members.push(b)
        visited.add(j)
      }
    }
    if (members.length >= 2) {
      const lat = members.reduce((s, m) => s + m.latitude, 0) / members.length
      const lng = members.reduce((s, m) => s + m.longitude, 0) / members.length
      const diseases = {}
      members.forEach(m => {
        const d = m.maladie_suspecte?.trim()
        if (d) diseases[d] = (diseases[d] || 0) + 1
      })
      const topDisease = Object.entries(diseases).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      clusters.push({ id: i, lat, lng, count: members.length, topDisease, diseases, members })
    }
  }
  return clusters
}

export function OutbreakSection() {
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/journal/').then(r => setJournal(r.data?.results ?? r.data ?? [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const clusters = clusterOutbreaks(journal)
  const mapPoints = clusters.map(c => ({
    id: c.id, lat: c.lat, lng: c.lng,
    label: `⚠️ ${c.topDisease}`,
    detail: `${c.count} observations groupées`,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-terra-dark dark:text-[#e8f5e4] flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          Alertes épidémiques
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Clusters de maladies détectés dans un rayon de 5 km</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-terra-medium"><Loader2 size={15} className="animate-spin" /> Analyse en cours…</div>
      ) : clusters.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-semibold text-green-700 dark:text-green-300">Aucun cluster détecté</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Toutes les observations sont géographiquement dispersées</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.map((c, i) => (
              <div key={i} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-300">
                    Cluster #{i + 1}
                  </span>
                  <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full font-semibold">
                    {c.count} cas
                  </span>
                </div>
                <p className="font-semibold text-terra-dark dark:text-[#e8f5e4] text-sm">{c.topDisease}</p>
                <div className="mt-2 flex flex-col gap-0.5">
                  {Object.entries(c.diseases).slice(0, 3).map(([d, n]) => (
                    <div key={d} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{d}</span>
                      <span className="font-semibold ml-2">{n}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <MapPin size={10} />{c.lat.toFixed(3)}, {c.lng.toFixed(3)}
                </p>
              </div>
            ))}
          </div>
          <MapWidget
            points={mapPoints}
            height={400}
            defaultCenter={[mapPoints[0]?.lat ?? -3.38, mapPoints[0]?.lng ?? 29.36]}
            defaultZoom={8}
          />
        </>
      )}

      {/* Disease catalog */}
      <div>
        <h3 className="text-sm font-bold text-terra-dark dark:text-[#e8f5e4] mb-3">Catalogue des maladies surveillées</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISEASES.map(d => (
            <div key={d.id} className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-sm text-terra-dark dark:text-[#e8f5e4]">{d.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${d.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                  {d.severity === 'high' ? 'Critique' : 'Modéré'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{d.crops.join(', ')}</p>
              <p className="text-xs text-gray-400">{d.management}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Yield Forecast ────────────────────────────────────────────────────────────
export function YieldSection() {
  const [plantes, setPlantes] = useState([])
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([axios.get('/api/plantes/'), axios.get('/api/journal/')])
      .then(([p, j]) => {
        setPlantes(p.data?.results ?? p.data ?? [])
        setJournal(j.data?.results ?? j.data ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const forecasts = Object.entries(
    plantes.reduce((acc, p) => {
      const crop = (p.nom_plante ?? '').toLowerCase()
      if (!acc[crop]) acc[crop] = { name: p.nom_plante, ids: [] }
      acc[crop].ids.push(p.id_plante)
      return acc
    }, {})
  ).map(([crop, { name, ids }]) => {
    const entries = journal.filter(j => ids.includes(j.id_plante))
    const healthy = entries.filter(j => !j.symptomes?.trim() || j.symptomes.toLowerCase() === 'aucun').length
    const healthRatio = entries.length ? healthy / entries.length : 0.8
    const info = YIELD_BASELINES[crop] ?? YIELD_BASELINES[name?.toLowerCase()]
    if (!info) return null
    const forecast = +(info.baseline * (0.4 + healthRatio * 0.7)).toFixed(1)
    return { crop: name, icon: info.icon, baseline: info.baseline, max: info.max, forecast, healthRatio, entries: entries.length, unit: info.unit }
  }).filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-terra-dark dark:text-[#e8f5e4] flex items-center gap-2">
          <TrendingUp size={18} className="text-terra-forest" />
          Prévision de rendement
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Estimation basée sur le ratio de santé de vos cultures</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-terra-medium"><Loader2 size={15} className="animate-spin" /> Calcul en cours…</div>
      ) : forecasts.length === 0 ? (
        <div className="bg-terra-bg dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-8 text-center text-gray-400">
          <p>Aucune culture reconnue dans la base de données.</p>
          <p className="text-xs mt-1">Vos cultures doivent correspondre à : Riz, Maïs, Manioc, Tomate, Arachide, Haricot…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecasts.map((f, i) => {
            const pct = Math.min(100, Math.round((f.forecast / f.max) * 100))
            const healthPct = Math.round(f.healthRatio * 100)
            return (
              <div key={i} className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{f.icon}</span>
                  <div>
                    <p className="font-bold text-terra-dark dark:text-[#e8f5e4]">{f.crop}</p>
                    <p className="text-xs text-gray-400">{f.entries} observation{f.entries !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-extrabold text-terra-forest">{f.forecast}</span>
                  <span className="text-sm text-gray-400">{f.unit}</span>
                  <span className="text-xs text-gray-400 ml-2">/ base {f.baseline}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-terra-forest rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-terra-forest to-terra-gold transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Santé terrain : <strong className={healthPct >= 70 ? 'text-green-600' : healthPct >= 40 ? 'text-yellow-600' : 'text-red-600'}>{healthPct}%</strong></span>
                  <span>Max potentiel : {f.max} {f.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-terra-bg dark:bg-[#0f1a0f] border border-terra-border dark:border-terra-forest rounded-xl p-4">
        <p className="text-xs text-gray-500">
          <strong className="text-terra-dark dark:text-terra-light">Formule :</strong>{' '}
          Rendement prévu = Rendement de base × (0.4 + ratio_santé × 0.7). Un terrain 100% sain atteint 110% du rendement de base.
        </p>
      </div>
    </div>
  )
}

// ─── Learn — fiches culture ────────────────────────────────────────────────────
export function LearnSection() {
  const crops = Object.keys(WATERING)
  const [active, setActive] = useState(crops[0])
  const schedule = WATERING[active] ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-terra-dark dark:text-[#e8f5e4] flex items-center gap-2">
          <Droplets size={18} className="text-blue-500" />
          Fiches culture
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Calendriers d'arrosage et conseils par stade de croissance</p>
      </div>

      {/* Crop tabs */}
      <div className="flex flex-wrap gap-2">
        {crops.map(c => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all capitalize
              ${active === c
                ? 'bg-terra-forest text-white shadow-sm'
                : 'bg-terra-bg dark:bg-terra-dark border border-terra-border dark:border-terra-forest text-terra-dark dark:text-terra-light hover:bg-terra-light/30'
              }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Schedule table */}
      <div className="flex flex-col gap-3">
        {schedule.map((s, i) => (
          <div key={i} className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 flex gap-4 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center">
              <Droplets size={16} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 mt-0.5">
                {s.liters > 0 ? `${s.liters}L` : '—'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-terra-dark dark:text-[#e8f5e4]">{s.stage}</p>
              {s.days > 0 ? (
                <p className="text-xs text-terra-forest font-medium mt-0.5">
                  {s.liters}L tous les {s.days} jour{s.days > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Pas d'arrosage</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disease reference for this crop */}
      <div>
        <h3 className="text-sm font-bold text-terra-dark dark:text-[#e8f5e4] mb-3">
          Maladies courantes sur {active}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISEASES.filter(d => d.crops.map(c => c.toLowerCase()).includes(active)).map(d => (
            <div key={d.id} className="bg-terra-bg dark:bg-[#0f1a0f] border border-terra-border dark:border-terra-forest rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm text-terra-dark dark:text-[#e8f5e4]">{d.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                  {d.severity === 'high' ? 'Critique' : 'Modéré'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{d.symptoms}</p>
              <div className="flex items-start gap-1 text-xs text-terra-forest">
                <ChevronRight size={12} className="mt-0.5 flex-shrink-0" />
                <span>{d.management}</span>
              </div>
            </div>
          ))}
          {DISEASES.filter(d => d.crops.map(c => c.toLowerCase()).includes(active)).length === 0 && (
            <p className="text-sm text-gray-400 col-span-2">Aucune maladie répertoriée pour cette culture.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Scout — Gamification ─────────────────────────────────────────────────────
export function ScoutSection() {
  const [diagCount, setDiagCount] = useState(0)
  const [journalCount, setJournalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    Promise.all([axios.get('/api/diagnostic/'), axios.get('/api/journal/')])
      .then(([d, j]) => {
        const diags = d.data?.results ?? d.data ?? []
        const jnl = j.data?.results ?? j.data ?? []
        setDiagCount(Array.isArray(diags) ? diags.length : d.data?.count ?? 0)
        setJournalCount(Array.isArray(jnl) ? jnl.length : j.data?.count ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const points = diagCount * 10 + journalCount * 2
  const earnedBadge = [...BADGES].reverse().find(b => diagCount >= b.min) ?? null
  const nextBadge = BADGES.find(b => b.min > diagCount) ?? null
  const progress = nextBadge ? Math.min(100, Math.round((diagCount / nextBadge.min) * 100)) : 100

  const handleShare = () => {
    const text = `🌾 J'ai soumis ${diagCount} diagnostics sur AfroAgri${earnedBadge ? ` — Badge "${earnedBadge.label}" obtenu !` : ''} #AgricultureNumerique`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => { setShared(true); setTimeout(() => setShared(false), 2000) })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-terra-dark dark:text-[#e8f5e4] flex items-center gap-2">
          <Trophy size={18} className="text-terra-gold" />
          Mon score AgriScout
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Progression et certification Digital Farmer</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-terra-medium"><Loader2 size={15} className="animate-spin" /> Chargement…</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Diagnostics', value: diagCount, icon: '🔬' },
              { label: 'Observations', value: journalCount, icon: '📓' },
              { label: 'Points AgriScout', value: points, icon: '⭐' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-extrabold text-terra-dark dark:text-terra-gold">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Current badge */}
          {earnedBadge && (
            <div className="bg-gradient-to-r from-terra-forest to-terra-dark rounded-2xl p-6 text-white flex items-center gap-5">
              <span className="text-5xl">{earnedBadge.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-terra-gold mb-0.5">Badge obtenu</p>
                <p className="text-xl font-extrabold">{earnedBadge.label}</p>
                <p className="text-sm text-terra-light/80 mt-0.5">{earnedBadge.desc}</p>
              </div>
              <button
                onClick={handleShare}
                className="flex-shrink-0 bg-terra-gold text-terra-dark font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition"
              >
                {shared ? '✓ Copié !' : 'Partager'}
              </button>
            </div>
          )}

          {/* Progress to next badge */}
          {nextBadge && (
            <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Prochain badge</p>
                  <p className="font-bold text-terra-dark dark:text-[#e8f5e4]">{nextBadge.icon} {nextBadge.label}</p>
                </div>
                <span className="text-sm font-bold text-terra-forest">{diagCount}/{nextBadge.min}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-terra-forest rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-terra-forest to-terra-gold transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{nextBadge.min - diagCount} diagnostics restants</p>
            </div>
          )}

          {/* All badges */}
          <div>
            <h3 className="text-sm font-bold text-terra-dark dark:text-[#e8f5e4] mb-3">Tous les badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BADGES.map(b => {
                const earned = diagCount >= b.min
                return (
                  <div key={b.id} className={`rounded-xl p-4 text-center border transition-all ${earned ? 'bg-terra-forest/10 dark:bg-terra-forest/20 border-terra-forest' : 'bg-gray-50 dark:bg-[#0f1a0f] border-terra-border dark:border-terra-forest/30 opacity-50'}`}>
                    <div className={`text-3xl mb-1 ${earned ? '' : 'grayscale'}`}>{b.icon}</div>
                    <p className="text-xs font-bold text-terra-dark dark:text-[#e8f5e4]">{b.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{b.min} diagnostics</p>
                    {earned && <span className="text-[10px] text-terra-forest font-bold">✓ Obtenu</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function AdminSection() {
  const slug = useLocation().pathname.split('/').filter(Boolean).at(-1)
  if (slug === 'users') return <ResourceManager {...userConfig} />
  if (slug === 'champs') return <ResourceManager {...champConfig} />
  if (slug === 'plantes') return <ResourceManager {...plantConfig} />
  if (slug === 'diagnostics') return <ResourceManager {...diagnosticConfig} />
  if (slug === 'etudes') return <ResourceManager {...soilConfig} />
  if (slug === 'carte') return <MapView />
  if (slug === 'rapports') return <ReportsView dashboardEndpoint="/api/DashboardAdmin/" />
  if (slug === 'settings') return <SettingsView />
  if (slug === 'outbreaks') return <OutbreakSection />
  if (slug === 'rendement') return <YieldSection />
  return <Navigate to="/dashboard/admin" replace />
}

export function MinisterSection() {
  const slug = useLocation().pathname.split('/').filter(Boolean).at(-1)
  if (slug === 'champs') return readonly(champConfig)
  if (slug === 'plantes') return readonly(plantConfig)
  if (slug === 'diagnostics') return readonly(diagnosticConfig)
  if (slug === 'etudes') return readonly(soilConfig)
  if (slug === 'carte') return <MapView />
  if (slug === 'rapports') return <ReportsView dashboardEndpoint="/api/DashboardMinister/" />
  if (slug === 'outbreaks') return <OutbreakSection />
  if (slug === 'rendement') return <YieldSection />
  return <Navigate to="/dashboard/ministere" replace />
}

export function FarmerSection() {
  const slug = useLocation().pathname.split('/').filter(Boolean).at(-1)
  if (slug === 'champs') return <ResourceManager {...champConfig} canDelete={false} />
  if (slug === 'plantes') return <ResourceManager {...plantConfig} canDelete={false} />
  if (slug === 'journal') return <ResourceManager {...journalConfig} canDelete={false} />
  if (slug === 'diagnostic') return readonly(diagnosticConfig)
  if (slug === 'carte') return <MapView title="Carte de mes observations" description="Localisation des observations enregistrées dans votre journal" />
  if (slug === 'profil') return <ProfileView />
  if (slug === 'outbreaks') return <OutbreakSection />
  if (slug === 'rendement') return <YieldSection />
  if (slug === 'apprendre') return <LearnSection />
  if (slug === 'scout') return <ScoutSection />
  return <Navigate to="/dashboard/agriculteur" replace />
}
