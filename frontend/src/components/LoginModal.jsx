import { useState } from 'react'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
}

export default function LoginModal({ onClose }) {
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
      navigate(ROLE_ROUTES[role] ?? '/')
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-terra-dark rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-terra-dark px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-terra-gold font-extrabold text-lg">🌿 AfroAgri</div>
            <div className="text-terra-medium text-xs mt-0.5">Espace professionnel</div>
          </div>
          <button
            onClick={onClose}
            className="text-terra-medium hover:text-terra-light p-1 rounded-lg hover:bg-terra-forest transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-extrabold text-terra-dark dark:text-[#e8f5e4] mb-1">
            Connexion
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Agriculteurs, agents du Ministère et administrateurs
          </p>

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
                className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition"
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
                  className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-terra-medium"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
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
              className="flex items-center justify-center gap-2 bg-terra-dark text-terra-gold font-bold rounded-lg py-3 hover:bg-terra-forest transition-colors disabled:opacity-60 mt-1"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Connexion...' : 'Accéder à mon espace →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
