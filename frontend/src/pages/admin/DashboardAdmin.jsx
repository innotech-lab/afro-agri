// frontend/src/pages/admin/DashboardAdmin.jsx
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, MapPin, Flower2, Microscope, Settings, FlaskConical, FileBarChart, Map, AlertTriangle, TrendingUp } from 'lucide-react'
import axios from 'axios'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import BarChartWidget from '../../components/BarChartWidget'
import DonutChartWidget from '../../components/DonutChartWidget'
import { AdminSection } from '../../components/DashboardSections'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Vue globale',    to: '/dashboard/admin' },
  { icon: Users,           label: 'Utilisateurs',  to: '/dashboard/admin/users' },
  { icon: MapPin,          label: 'Champs',        to: '/dashboard/admin/champs' },
  { icon: Flower2,         label: 'Plantes',       to: '/dashboard/admin/plantes' },
  { icon: Microscope,      label: 'Diagnostics',   to: '/dashboard/admin/diagnostics' },
  { icon: FlaskConical,    label: 'Études de sol', to: '/dashboard/admin/etudes' },
  { icon: Map,             label: 'Cartographie',  to: '/dashboard/admin/carte' },
  { icon: AlertTriangle,   label: 'Alertes Épidémies', to: '/dashboard/admin/outbreaks' },
  { icon: TrendingUp,      label: 'Rendements',    to: '/dashboard/admin/rendement' },
  { icon: FileBarChart,    label: 'Rapports',      to: '/dashboard/admin/rapports' },
  { icon: Settings,        label: 'Paramètres',    to: '/dashboard/admin/settings' },
]

const TYPE_COLORS = {
  agriculteur: 'bg-terra-forest text-terra-light',
  minister:    'bg-blue-900 text-blue-300',
  admin:       'bg-red-900 text-red-300',
  particulier: 'bg-yellow-800 text-yellow-200',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DashboardAdmin() {
  const location = useLocation()
  const [data, setData] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const isOverview = location.pathname.replace(/\/+$/, '') === '/dashboard/admin'

  useEffect(() => {
    Promise.all([
      axios.get('/api/DashboardAdmin/'),
      axios.get('/api/users/users/'),
    ]).then(([d, u]) => {
      setData(d.data)
      const raw = u.data?.results ?? u.data ?? []
      const sorted = Array.isArray(raw)
        ? [...raw].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12)
        : []
      setUsers(sorted)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (!isOverview) {
    return <AppShell sidebarItems={NAV_ITEMS}><AdminSection /></AppShell>
  }

  if (loading) {
    return (
      <AppShell sidebarItems={NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-terra-medium">Chargement...</div>
      </AppShell>
    )
  }

  const counts = data?.counts ?? {}

  const activityData = (data?.journal?.by_stade ?? [])
    .map(d => ({ name: d.stade_croissance ?? 'N/A', count: d.count }))

  const userTypeData = (data?.users?.by_type ?? [])
    .map(d => ({ name: d.id_type__type ?? 'N/A', value: d.count }))

  return (
    <AppShell sidebarItems={NAV_ITEMS}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">Vue globale</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administration système — accès complet</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard value={counts.users} label="Utilisateurs" trendDirection="up" trend="ce mois" />
          <KpiCard value={counts.clients} label="Clients" />
          <KpiCard value={counts.champs?.toLocaleString()} label="Champs" />
          <KpiCard value={counts.plantes} label="Plantes" />
          <KpiCard value={counts.diagnostics} label="Diagnostics" />
          <KpiCard value={counts.maladies} label="Maladies détectées" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BarChartWidget
              title="Activité — stades de croissance"
              data={activityData}
              dataKey="count"
              nameKey="name"
            />
          </div>
          <DonutChartWidget
            title="Utilisateurs par rôle"
            data={userTypeData}
            nameKey="name"
            valueKey="value"
          />
        </div>

        {/* Users panel */}
        <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
            Derniers utilisateurs inscrits
          </p>
          {users.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun utilisateur</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map(u => {
                const role = u.id_type?.type?.toLowerCase() ?? ''
                const colorClass = TYPE_COLORS[role] ?? 'bg-gray-700 text-gray-300'
                const initials = `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || '?'
                return (
                  <div
                    key={u.id_user}
                    className="flex items-start gap-3 p-3 bg-terra-bg dark:bg-terra-forest/40 rounded-lg border border-terra-border dark:border-terra-forest"
                  >
                    <div className="w-10 h-10 rounded-full bg-terra-forest dark:bg-terra-dark flex items-center justify-center text-terra-light text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-terra-dark dark:text-[#e8f5e4] truncate">
                          {u.prenom} {u.nom}
                        </span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${colorClass}`}>
                          {u.id_type?.type ?? '—'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {u.email}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Inscrit le {formatDate(u.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
