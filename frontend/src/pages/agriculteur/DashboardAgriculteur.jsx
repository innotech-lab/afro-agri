// frontend/src/pages/agriculteur/DashboardAgriculteur.jsx
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutDashboard, MapPin, Flower2, BookOpen, Microscope, Map, UserRound } from 'lucide-react'
import axios from 'axios'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import BarChartWidget from '../../components/BarChartWidget'
import DonutChartWidget from '../../components/DonutChartWidget'
import { FarmerSection } from '../../components/DashboardSections'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tableau de bord', to: '/dashboard/agriculteur' },
  { icon: MapPin,          label: 'Mes Champs',      to: '/dashboard/agriculteur/champs' },
  { icon: Flower2,         label: 'Mes Plantes',     to: '/dashboard/agriculteur/plantes' },
  { icon: BookOpen,        label: 'Journal',          to: '/dashboard/agriculteur/journal' },
  { icon: Microscope,      label: 'Diagnostic IA',   to: '/dashboard/agriculteur/diagnostic' },
  { icon: Map,             label: 'Cartographie',    to: '/dashboard/agriculteur/carte' },
  { icon: UserRound,       label: 'Mon profil',      to: '/dashboard/agriculteur/profil' },
]

const STATUS_STYLES = {
  sain:   'bg-green-100 text-green-800',
  veille: 'bg-yellow-100 text-yellow-800',
  alerte: 'bg-red-100 text-red-800',
}

function getStatus(symptomes) {
  if (!symptomes) return 'sain'
  const s = symptomes.toLowerCase()
  if (s.includes('alerte') || s.includes('maladie') || s.includes('danger')) return 'alerte'
  if (s.includes('veille') || s.includes('attention')) return 'veille'
  return 'sain'
}

export default function DashboardAgriculteur() {
  const location = useLocation()
  const [champs, setChamps] = useState([])
  const [plantes, setPlantes] = useState([])
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)
  const isOverview = location.pathname.replace(/\/+$/, '') === '/dashboard/agriculteur'

  useEffect(() => {
    Promise.all([
      axios.get('/api/champs/'),
      axios.get('/api/plantes/'),
      axios.get('/api/journal/'),
    ]).then(([c, p, j]) => {
      setChamps(c.data?.results ?? c.data ?? [])
      setPlantes(p.data?.results ?? p.data ?? [])
      setJournal(j.data?.results ?? j.data ?? [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  // Prepare chart data
  const stadeData = journal.reduce((acc, entry) => {
    const key = entry.stade_croissance || 'Inconnu'
    const existing = acc.find(d => d.name === key)
    if (existing) existing.count++
    else acc.push({ name: key, count: 1 })
    return acc
  }, [])

  const diagnosticData = [
    { name: 'Sain',    value: journal.filter(j => getStatus(j.symptomes) === 'sain').length },
    { name: 'Veille',  value: journal.filter(j => getStatus(j.symptomes) === 'veille').length },
    { name: 'Alerte',  value: journal.filter(j => getStatus(j.symptomes) === 'alerte').length },
  ].filter(d => d.value > 0)

  const recentJournal = [...journal]
    .sort((a, b) => new Date(b.date_observation) - new Date(a.date_observation))
    .slice(0, 5)

  const alertCount = journal.filter(j => getStatus(j.symptomes) === 'alerte').length
  const healthPct = journal.length
    ? Math.round((journal.filter(j => getStatus(j.symptomes) === 'sain').length / journal.length) * 100)
    : 0

  if (!isOverview) {
    return <AppShell sidebarItems={NAV_ITEMS}><FarmerSection /></AppShell>
  }

  if (loading) {
    return (
      <AppShell sidebarItems={NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-terra-medium">
          Chargement...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell sidebarItems={NAV_ITEMS}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de votre exploitation</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value={champs.length} label="Mes Champs" trendDirection="up" trend="actifs" />
          <KpiCard value={plantes.length} label="Plantes" />
          <KpiCard value={alertCount} label="Alertes" trendDirection={alertCount > 0 ? 'down' : 'up'} trend={alertCount > 0 ? 'à surveiller' : 'aucune'} />
          <KpiCard value={`${healthPct}%`} label="Santé moyenne" trendDirection="up" trend="bon état" />
        </div>

        {/* Charts + table row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <BarChartWidget
              title="Stades de croissance"
              data={stadeData}
              dataKey="count"
              nameKey="name"
            />
          </div>

          {/* Journal table */}
          <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
              Journal récent
            </p>
            {recentJournal.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune entrée</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentJournal.map(entry => {
                  const status = getStatus(entry.symptomes)
                  return (
                    <div key={entry.id_journal} className="flex items-center justify-between text-sm">
                      <span className="text-terra-dark dark:text-[#e8f5e4] truncate max-w-[60%]">
                        {entry.stade_croissance ?? `Entrée #${entry.id_journal}`}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <DonutChartWidget
              title="Santé des cultures"
              data={diagnosticData}
              nameKey="name"
              valueKey="value"
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
