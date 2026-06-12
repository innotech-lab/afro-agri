// frontend/src/pages/ministere/DashboardMinistere.jsx
import { useEffect, useState } from 'react'
import { LayoutDashboard, MapPin, Flower2, FlaskConical, FileBarChart } from 'lucide-react'
import axios from 'axios'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import BarChartWidget from '../../components/BarChartWidget'
import DonutChartWidget from '../../components/DonutChartWidget'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Vue nationale',   to: '/dashboard/ministere' },
  { icon: MapPin,          label: 'Champs',          to: '/dashboard/ministere/champs' },
  { icon: Flower2,         label: 'Plantes',         to: '/dashboard/ministere/plantes' },
  { icon: FlaskConical,    label: 'Études de sol',   to: '/dashboard/ministere/etudes' },
  { icon: FileBarChart,    label: 'Rapports',        to: '/dashboard/ministere/rapports' },
]

export default function DashboardMinistere() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/DashboardMinister/')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell sidebarItems={NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-terra-medium">Chargement...</div>
      </AppShell>
    )
  }

  const counts = data?.counts ?? {}

  const sourceEauData = (data?.champs?.by_source_eau ?? [])
    .map(d => ({ name: d.source_eau ?? 'N/A', count: d.count }))

  const typeSolData = (data?.etude_sol?.by_type_sol ?? [])
    .map(d => ({ name: d.type_sol ?? 'N/A', value: d.count }))

  const fertiliteData = (data?.etude_sol?.by_fertilite ?? [])
    .map(d => ({ name: d.fertilite ?? 'N/A', count: d.count }))

  const planteVarieteData = (data?.plantes?.by_variete ?? [])
    .slice(0, 5)
    .map(d => ({ name: d.variete ?? 'N/A', count: d.count }))

  const agriculteurs = (data?.users?.by_type ?? [])
    .find(u => u.id_type__type?.toLowerCase() === 'agriculteur')?.count ?? 0

  return (
    <AppShell sidebarItems={NAV_ITEMS}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">Vue nationale</h1>
          <p className="text-sm text-gray-500 mt-0.5">Statistiques agricoles — lecture seule</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value={counts.champs?.toLocaleString()} label="Champs nationaux" />
          <KpiCard value={counts.plantes?.toLocaleString()} label="Plantes enregistrées" />
          <KpiCard value={agriculteurs} label="Agriculteurs actifs" />
          <KpiCard value={counts.etude_sol} label="Études de sol" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartWidget title="Champs par source d'eau" data={sourceEauData} dataKey="count" nameKey="name" />
          <DonutChartWidget title="Types de sol" data={typeSolData} nameKey="name" valueKey="value" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartWidget title="Fertilité des sols" data={fertiliteData} dataKey="count" nameKey="name" />
          <BarChartWidget title="Top 5 variétés de plantes" data={planteVarieteData} dataKey="count" nameKey="name" />
        </div>
      </div>
    </AppShell>
  )
}
