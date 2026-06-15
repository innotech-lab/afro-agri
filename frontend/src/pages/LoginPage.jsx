// frontend/src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      const role = data.id_type?.toLowerCase()
      navigate(ROLE_ROUTES[role] ?? '/login')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left — dark branding panel */}
      <div className="hidden md:flex w-1/2 bg-terra-dark flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-forest rounded-xl flex items-center justify-center text-2xl">
            🌿
          </div>
          <div>
            <div className="text-terra-gold font-extrabold text-xl tracking-tight">AfroAgri</div>
            <div className="text-terra-medium text-xs font-semibold tracking-widest uppercase">
              Plateforme agricole
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-white text-4xl font-extrabold leading-tight">
            Agriculture<br />
            <span className="text-terra-gold">intelligente</span><br />
            pour l'Afrique
          </h1>
          <p className="text-terra-medium text-sm leading-relaxed max-w-xs">
            Gérez vos champs, suivez la santé de vos plantes et accédez
            aux diagnostics IA — tout en un seul endroit.
          </p>

          {/* Decorative stat pills */}
          <div className="flex gap-3 flex-wrap">
            {[
              { v: '1 800+', l: 'Champs suivis' },
              { v: '4 200+', l: 'Plantes enregistrées' },
              { v: '286', l: 'Agriculteurs actifs' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-terra-forest rounded-lg px-3 py-2">
                <div className="text-terra-gold font-extrabold text-sm">{v}</div>
                <div className="text-terra-medium text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative pattern */}
        <div className="text-terra-forest text-xs opacity-40 select-none">
          {'◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆'}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 items-center justify-center bg-terra-bg px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <span className="text-2xl">🌿</span>
            <span className="text-terra-dark font-extrabold text-xl">AfroAgri</span>
          </div>

          <h2 className="text-2xl font-extrabold text-terra-dark mb-1">Bon retour</h2>
          <p className="text-sm text-gray-500 mb-8">Connectez-vous à votre espace</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.ml"
                className="w-full bg-white border border-terra-border rounded-lg px-3 py-2.5 text-sm text-terra-dark focus:outline-none focus:ring-2 focus:ring-terra-medium transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-terra-border rounded-lg px-3 py-2.5 text-sm text-terra-dark focus:outline-none focus:ring-2 focus:ring-terra-medium transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-terra-medium"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-terra-dark text-terra-gold font-bold rounded-lg py-3 mt-1 hover:bg-terra-forest transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Connexion...' : 'Connexion →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Accès sécurisé · AfroAgri 2026
          </p>
        </div>
      </div>
    </div>
  )
}
