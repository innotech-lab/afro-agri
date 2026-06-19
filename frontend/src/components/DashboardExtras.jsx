import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Download, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BarChartWidget from './BarChartWidget'
import DonutChartWidget from './DonutChartWidget'
import MapWidget from './MapWidget'

const panel = 'bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm'

export function MapView({ title = 'Cartographie des diagnostics', description = 'Localisation des observations agricoles au Burundi' }) {
  const [journals, setJournals] = useState([])
  useEffect(() => { axios.get('/api/journal/').then(r => setJournals(r.data?.results ?? r.data ?? [])).catch(() => {}) }, [])

  const points = journals
    .filter(item => Number(item.latitude) && Number(item.longitude))
    .map(item => ({
      id: item.id_journal,
      lat: Number(item.latitude),
      lng: Number(item.longitude),
      label: item.maladie_suspecte || item.stade_croissance || 'Observation',
      detail: item.symptomes || '',
    }))

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-terra-dark dark:text-terra-light">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <MapWidget points={points} height={480} />
      <p className="text-xs text-gray-400 -mt-4">
        {points.length} point{points.length !== 1 ? 's' : ''} géolocalisé{points.length !== 1 ? 's' : ''} · OpenStreetMap
      </p>
    </div>
  )
}

export function ReportsView({ dashboardEndpoint }) {
  const [data, setData] = useState(null)
  useEffect(() => { axios.get(dashboardEndpoint).then(r => setData(r.data)).catch(() => {}) }, [dashboardEndpoint])
  const journal = data?.journal?.by_stade?.map(item => ({ name: item.stade_croissance || 'Non défini', count: item.count })) ?? []
  const plants = data?.plantes?.by_nom?.map(item => ({ name: item.nom_plante || 'Non défini', value: item.count })) ?? []
  const soils = data?.etude_sol?.by_fertilite?.map(item => ({ name: item.fertilite || 'Non défini', count: item.count })) ?? []
  const exportReport = () => {
    const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'rapport-afroagri.json'
    link.click()
  }
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end gap-3"><div><h1 className="text-xl font-bold text-terra-dark dark:text-terra-light">Rapports et statistiques</h1><p className="text-sm text-gray-500 mt-0.5">Analyse et export des données agricoles nationales</p></div><button onClick={exportReport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terra-dark text-terra-gold text-sm font-semibold"><Download size={15} /> Générer le rapport</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartWidget title="Diagnostics par stade" data={journal} dataKey="count" nameKey="name" />
        <DonutChartWidget title="Cultures enregistrées" data={plants} nameKey="name" valueKey="value" />
        <div className="lg:col-span-2"><BarChartWidget title="Fertilité des sols" data={soils} dataKey="count" nameKey="name" /></div>
      </div>
    </div>
  )
}

export function SettingsView() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem('afroagri_settings') || '{"notifications":true,"language":"fr","retention":"365"}'))
  const save = event => { event.preventDefault(); localStorage.setItem('afroagri_settings', JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2500) }
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div><h1 className="text-xl font-bold text-terra-dark dark:text-terra-light">Paramètres</h1><p className="text-sm text-gray-500 mt-0.5">Configuration générale de la plateforme</p></div>
      <form onSubmit={save} className={`${panel} space-y-5`}>
        <label className="flex items-center justify-between gap-4"><div><p className="font-semibold text-sm text-terra-dark dark:text-terra-light">Notifications système</p><p className="text-xs text-gray-500">Recevoir les alertes de diagnostic et d’activité</p></div><input type="checkbox" checked={settings.notifications} onChange={e => setSettings({ ...settings, notifications: e.target.checked })} className="w-5 h-5 accent-terra-medium" /></label>
        <label className="block"><span className="text-sm font-semibold text-terra-dark dark:text-terra-light">Langue par défaut</span><select value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })} className="mt-2 w-full border border-terra-border dark:border-terra-forest rounded-lg px-3 py-2 bg-white dark:bg-terra-forest/30"><option value="fr">Français</option><option value="rn">Kirundi</option><option value="en">English</option></select></label>
        <label className="block"><span className="text-sm font-semibold text-terra-dark dark:text-terra-light">Conservation des données (jours)</span><input type="number" value={settings.retention} onChange={e => setSettings({ ...settings, retention: e.target.value })} className="mt-2 w-full border border-terra-border dark:border-terra-forest rounded-lg px-3 py-2 bg-white dark:bg-terra-forest/30" /></label>
        <div className="flex items-center justify-between"><span className="text-xs text-green-600">{saved ? 'Paramètres enregistrés.' : ''}</span><button className="px-4 py-2 bg-terra-dark text-terra-gold rounded-lg text-sm font-semibold">Enregistrer</button></div>
      </form>
      <div className={`${panel} flex gap-3`}><ShieldCheck className="text-terra-medium" /><div><p className="font-semibold text-sm text-terra-dark dark:text-terra-light">Sécurité</p><p className="text-xs text-gray-500 mt-1">Les accès restent limités par rôle conformément à la documentation AfroAgri.</p></div></div>
    </div>
  )
}

export function ProfileView() {
  const { user } = useAuth()
  const profile = useMemo(() => ({ prenom: user?.prenom || '', nom: user?.nom || '', role: user?.id_type || '' }), [user])
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div><h1 className="text-xl font-bold text-terra-dark dark:text-terra-light">Mon profil</h1><p className="text-sm text-gray-500 mt-0.5">Informations du compte connecté</p></div>
      <div className={`${panel} flex items-center gap-4`}><div className="w-16 h-16 rounded-full bg-terra-forest text-terra-light flex items-center justify-center text-xl font-bold">{(profile.prenom[0] || profile.nom[0] || '?').toUpperCase()}</div><div><p className="text-lg font-bold text-terra-dark dark:text-terra-light">{profile.prenom} {profile.nom}</p><p className="text-sm text-gray-500 capitalize">{profile.role}</p></div></div>
    </div>
  )
}
