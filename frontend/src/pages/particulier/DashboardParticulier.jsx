import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import {
  LogOut, Home, History, CheckCircle, XCircle, AlertTriangle,
  ImagePlus, Loader2, ChevronRight, Calendar, Leaf
} from 'lucide-react'
import { BarChart3, Camera, MapPinned, Sprout, UserRound } from 'lucide-react'
import ResourceManager from '../../components/ResourceManager'
import { ProfileView } from '../../components/DashboardExtras'
import MapWidget from '../../components/MapWidget'
import { champConfig, plantConfig } from '../../components/DashboardSections'

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return (
    <button onClick={toggle} className="w-9 h-9 flex items-center justify-center rounded-xl border border-terra-border dark:border-terra-forest bg-white dark:bg-terra-forest text-terra-dark dark:text-terra-light hover:bg-terra-bg dark:hover:bg-terra-medium transition-colors text-base">
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

function VerdictBadge({ estSaine }) {
  if (estSaine === true)
    return <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200"><CheckCircle size={11} /> Sain</span>
  if (estSaine === false)
    return <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"><XCircle size={11} /> Problème</span>
  return <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200"><AlertTriangle size={11} /> Incertain</span>
}

function HistoryCard({ entry }) {
  const [open, setOpen] = useState(false)
  const date = entry.date_observation
    ? new Date(entry.date_observation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : entry.created_at
      ? new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'

  return (
    <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-terra-bg dark:bg-terra-forest flex-shrink-0 border border-terra-border dark:border-terra-forest">
          {entry.image ? (
            <img src={entry.image} alt="Terrain" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImagePlus size={20} className="text-terra-medium" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-terra-dark dark:text-[#e8f5e4] text-sm truncate">
              {entry.maladie_detectee || 'Analyse terrain'}
            </span>
            <VerdictBadge estSaine={entry.confiance > 70 ? true : entry.confiance > 40 ? null : false} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Calendar size={11} />{date}</span>
            {entry.stade_croissance && (
              <span className="flex items-center gap-1"><Leaf size={11} />{entry.stade_croissance}</span>
            )}
            {entry.nom_plante && (
              <span className="flex items-center gap-1"><Sprout size={11} />{entry.nom_plante}</span>
            )}
            {entry.id_champ && (
              <span className="flex items-center gap-1"><MapPinned size={11} />Champ #{entry.id_champ}</span>
            )}
            {entry.confiance !== null && entry.confiance !== undefined && (
              <span className="font-medium text-terra-medium">{entry.confiance}% confiance</span>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </div>

      {open && (
        <div className="border-t border-terra-border dark:border-terra-forest px-5 py-4 bg-terra-bg dark:bg-terra-forest/20">
          {entry.traitement_suggere && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Recommandation</p>
              <p className="text-sm text-terra-dark dark:text-[#e8f5e4] leading-relaxed">{entry.traitement_suggere}</p>
            </div>
          )}
          {entry.source_github && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Source</p>
              <p className="text-xs text-terra-medium">{entry.source_github}</p>
            </div>
          )}
          {!entry.traitement_suggere && !entry.source_github && (
            <p className="text-xs text-gray-400">Aucun détail supplémentaire disponible.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardParticulier() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyDate, setHistoryDate] = useState('')

  useEffect(() => {
    axios.get('/api/users/dashboard/particulier/')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const section = location.pathname.split('/').filter(Boolean).at(-1)
  const isOverview = section === 'particulier'
  const sectionContent = section === 'profil'
    ? <ProfileView />
    : section === 'plantes'
      ? <ResourceManager {...plantConfig} readOnly />
      : section === 'champs'
        ? <ResourceManager {...champConfig} canDelete={false} />
      : null

  const filteredHistory = (data?.history ?? []).filter(entry => {
    const matchesQuery = !historyQuery || [
      entry.maladie_detectee,
      entry.nom_plante,
      entry.stade_croissance,
      entry.traitement_suggere,
    ].some(value => String(value ?? '').toLowerCase().includes(historyQuery.toLowerCase()))
    const rawDate = entry.date_observation || entry.created_at || ''
    return matchesQuery && (!historyDate || String(rawDate).startsWith(historyDate))
  })

  const bottomNavigation = (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-terra-dark border-t border-terra-border dark:border-terra-forest px-3 py-2">
      <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
        {[
          { label: 'Statistiques', icon: BarChart3, to: '/dashboard/particulier' },
          { label: 'Profil', icon: UserRound, to: '/dashboard/particulier/profil' },
          { label: 'Plantes', icon: Sprout, to: '/dashboard/particulier/plantes' },
          { label: 'Scan', icon: Camera, to: '/analyser' },
        ].map(item => {
          const Icon = item.icon
          const active = location.pathname === item.to
          return (
            <button key={item.to} onClick={() => navigate(item.to)} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold ${active ? 'text-terra-dark dark:text-terra-light bg-terra-bg dark:bg-terra-forest' : 'text-gray-400'}`}>
              <Icon size={18} />{item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )

  if (!isOverview && sectionContent) {
    return (
      <div className="min-h-screen bg-terra-bg dark:bg-[#0f1f0f] font-sans pb-24">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-5 py-3.5 bg-white dark:bg-terra-dark border-b border-terra-border dark:border-terra-forest shadow-sm">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard/particulier')}>
            <div className="w-8 h-8 bg-terra-dark rounded-xl flex items-center justify-center text-terra-gold font-extrabold">A</div>
            <span className="font-extrabold text-terra-dark dark:text-[#e8f5e4]">AfroAgri</span>
            <span className="hidden sm:inline text-xs font-medium text-gray-400 bg-terra-bg dark:bg-terra-forest px-2 py-0.5 rounded-full">Mon espace</span>
          </div>
          <div className="flex items-center gap-2"><ThemeToggle /><button onClick={handleLogout} className="p-2 text-red-500"><LogOut size={16} /></button></div>
        </header>
        <main className="px-5 py-8">{sectionContent}</main>
        {bottomNavigation}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terra-bg dark:bg-[#0f1f0f] font-sans pb-24">

      {/* Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-5 py-3.5 bg-white dark:bg-terra-dark border-b border-terra-border dark:border-terra-forest shadow-sm">
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => navigate('/')}
          title="Retour à l'accueil"
        >
          <div className="w-8 h-8 bg-terra-dark rounded-xl flex items-center justify-center text-terra-gold font-extrabold text-base">A</div>
          <span className="font-extrabold text-terra-dark dark:text-[#e8f5e4] text-base tracking-tight">AfroAgri</span>
          <span className="hidden sm:inline text-xs font-medium text-gray-400 bg-terra-bg dark:bg-terra-forest px-2 py-0.5 rounded-full border border-terra-border dark:border-terra-medium">
            Mon espace
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-terra-medium hover:text-terra-dark dark:hover:text-terra-light px-3 py-2 rounded-lg hover:bg-terra-bg dark:hover:bg-terra-forest transition-colors"
          >
            <Home size={14} />
            Accueil
          </button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-5 py-8">

        {/* Welcome banner */}
        <div className="bg-terra-dark rounded-2xl px-6 py-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-terra-forest flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🌿</span>
          </div>
          <div>
            <p className="text-terra-gold font-extrabold text-lg leading-tight">
              Bonjour {user?.prenom || 'Visiteur'} 👋
            </p>
            <p className="text-terra-medium text-sm mt-0.5">
              Retrouvez ici l'historique de toutes vos analyses de terrain
            </p>
          </div>
        </div>

        {/* Stats row */}
        {data && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-2xl px-4 py-4 text-center">
              <p className="text-3xl font-extrabold text-terra-dark dark:text-terra-light">{data.total_analyses}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Analyses</p>
            </div>
            <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-2xl px-4 py-4 text-center">
              <p className="text-3xl font-extrabold text-green-600">
                {data.history?.filter(h => h.confiance > 70).length ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Terrains sains</p>
            </div>
            <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-2xl px-4 py-4 text-center">
              <p className="text-3xl font-extrabold text-red-500">
                {data.history?.filter(h => h.confiance <= 40).length ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Problèmes détectés</p>
            </div>
          </div>
        )}

        {/* History section */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <History size={17} className="text-terra-medium" />
            <h2 className="font-bold text-terra-dark dark:text-[#e8f5e4] text-base">Historique des analyses</h2>
          </div>
          <button onClick={() => navigate('/dashboard/particulier/champs')} className="flex items-center gap-1.5 text-xs font-semibold text-terra-medium hover:text-terra-dark">
            <MapPinned size={14} /> Mes champs
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Rechercher par culture ou maladie..." className="w-full rounded-xl border border-terra-border dark:border-terra-forest bg-white dark:bg-terra-dark px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-terra-light" />
          <input type="date" value={historyDate} onChange={event => setHistoryDate(event.target.value)} className="w-full rounded-xl border border-terra-border dark:border-terra-forest bg-white dark:bg-terra-dark px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-terra-light" />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-terra-medium">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          filteredHistory.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredHistory.map((entry, i) => (
                <HistoryCard key={entry.id_diagnostic ?? i} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-terra-dark border-2 border-dashed border-terra-border dark:border-terra-forest rounded-2xl px-6 py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-terra-bg dark:bg-terra-forest rounded-2xl flex items-center justify-center">
                <ImagePlus size={28} className="text-terra-medium" />
              </div>
              <div>
                <p className="font-semibold text-terra-dark dark:text-[#e8f5e4] text-sm mb-1">
                  Aucune analyse pour l'instant
                </p>
                <p className="text-gray-500 text-xs">
                  Utilisez l'outil de diagnostic sur la page d'accueil pour analyser votre premier terrain
                </p>
              </div>
              <button
                onClick={() => navigate('/#analyse')}
                className="flex items-center gap-2 bg-terra-dark text-terra-gold font-bold rounded-xl px-5 py-2.5 text-sm hover:bg-terra-forest transition-colors mt-1"
              >
                Analyser un terrain →
              </button>
            </div>
          )
        )}

        {!loading && !error && data?.history?.length > 0 && (
          <div className="mt-7">
            <div className="flex items-center gap-2 mb-4">
              <MapPinned size={17} className="text-terra-medium" />
              <h2 className="font-bold text-terra-dark dark:text-[#e8f5e4] text-base">Cartographie de mes diagnostics</h2>
            </div>
            <MapWidget
              height={280}
              points={data.history
                .filter(e => Number(e.latitude) && Number(e.longitude))
                .map(e => ({
                  id: e.id_diagnostic,
                  lat: Number(e.latitude),
                  lng: Number(e.longitude),
                  label: e.maladie_detectee || 'Diagnostic',
                  detail: e.traitement_suggere || '',
                }))
              }
            />
          </div>
        )}
      </main>
      {bottomNavigation}
    </div>
  )
}
