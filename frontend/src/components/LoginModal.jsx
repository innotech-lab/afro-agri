import { useState } from 'react'
import { Eye, EyeOff, Loader2, X, UserPlus, LogIn, FlaskConical } from 'lucide-react'

const TEST_ACCOUNTS = [
  { role: 'Admin',        email: 'admin@kit-hub.com',      password: 'password',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { role: 'Agriculteur',  email: 'agri@afroagri.com',      password: 'password',  color: 'bg-terra-forest/10 text-terra-forest dark:bg-terra-forest/20 dark:text-terra-light' },
  { role: 'Ministère',    email: 'minister@afroagri.com',  password: 'minister',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { role: 'Particulier',  email: 'maverick@local.com',     password: 'password',  color: 'bg-terra-gold/10 text-terra-dark dark:bg-terra-gold/20 dark:text-terra-gold' },
]
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
  particulier: '/dashboard/particulier',
}

export default function LoginModal({ onClose, defaultTab = 'login' }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(defaultTab)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginShowPwd, setLoginShowPwd] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Register state
  const [regPrenom, setRegPrenom] = useState('')
  const [regNom, setRegNom] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPwd, setRegShowPwd] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const data = await login(loginEmail, loginPassword)
      navigate(ROLE_ROUTES[data.id_type?.toLowerCase()] ?? '/')
      onClose()
    } catch (err) {
      setLoginError(err.response?.data?.error ?? 'Identifiants invalides')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegLoading(true)
    try {
      const { data } = await axios.post('/api/users/auth/register/', {
        prenom: regPrenom,
        nom: regNom,
        email: regEmail,
        password: regPassword,
      })
      // Auto-login after register
      const loginData = await login(regEmail, regPassword)
      navigate(ROLE_ROUTES[loginData.id_type?.toLowerCase()] ?? '/dashboard/particulier')
      onClose()
    } catch (err) {
      setRegError(err.response?.data?.error ?? 'Erreur lors de la création du compte')
    } finally {
      setRegLoading(false)
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
            <div className="text-terra-medium text-xs mt-0.5">Votre espace personnel</div>
          </div>
          <button
            onClick={onClose}
            className="text-terra-medium hover:text-terra-light p-1 rounded-lg hover:bg-terra-forest transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-terra-border dark:border-terra-forest">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors
              ${tab === 'login'
                ? 'text-terra-dark dark:text-terra-light border-b-2 border-terra-forest'
                : 'text-gray-400 hover:text-terra-medium'
              }`}
          >
            <LogIn size={15} />
            Connexion
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors
              ${tab === 'register'
                ? 'text-terra-dark dark:text-terra-light border-b-2 border-terra-forest'
                : 'text-gray-400 hover:text-terra-medium'
              }`}
          >
            <UserPlus size={15} />
            Créer un compte
          </button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <div className="px-6 py-6">
            <p className="text-xs text-gray-500 mb-5">
              Agriculteurs, Ministère, Admin et particuliers
            </p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email" required
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
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
                    type={loginShowPwd ? 'text' : 'password'} required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition pr-10"
                  />
                  <button type="button" onClick={() => setLoginShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-terra-medium">
                    {loginShowPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                  {loginError}
                </div>
              )}
              <button type="submit" disabled={loginLoading}
                className="flex items-center justify-center gap-2 bg-terra-dark text-terra-gold font-bold rounded-lg py-3 hover:bg-terra-forest transition-colors disabled:opacity-60 mt-1">
                {loginLoading && <Loader2 size={15} className="animate-spin" />}
                {loginLoading ? 'Connexion...' : 'Accéder à mon espace →'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              Pas encore de compte ?{' '}
              <button onClick={() => setTab('register')} className="text-terra-medium hover:text-terra-forest font-semibold">
                Créer un compte
              </button>
            </p>

            {/* Test accounts */}
            <div className="mt-5 border-t border-terra-border dark:border-terra-forest pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <FlaskConical size={12} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Comptes de test</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {TEST_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => { setLoginEmail(acc.email); setLoginPassword(acc.password) }}
                    className="flex items-center justify-between gap-2 w-full rounded-lg px-3 py-2 hover:opacity-80 transition-opacity text-left"
                    style={{ background: 'transparent' }}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.color}`}>{acc.role}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">{acc.email}</span>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">···{acc.password.slice(-3)}</span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-2 text-center">Cliquez pour remplir · Développement uniquement</p>
            </div>
          </div>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <div className="px-6 py-6">
            <p className="text-xs text-gray-500 mb-5">
              Créez votre espace pour sauvegarder vos analyses de terrain
            </p>
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Prénom *
                  </label>
                  <input
                    type="text" required
                    value={regPrenom} onChange={e => setRegPrenom(e.target.value)}
                    placeholder="Amadou"
                    className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={regNom} onChange={e => setRegNom(e.target.value)}
                    placeholder="Keita"
                    className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Adresse email *
                </label>
                <input
                  type="email" required
                  value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="vous@exemple.ml"
                  className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={regShowPwd ? 'text' : 'password'} required minLength={6}
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    className="w-full bg-terra-bg dark:bg-terra-forest border border-terra-border dark:border-terra-medium rounded-lg px-3 py-2.5 text-sm text-terra-dark dark:text-[#e8f5e4] focus:outline-none focus:ring-2 focus:ring-terra-medium transition pr-10"
                  />
                  <button type="button" onClick={() => setRegShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-terra-medium">
                    {regShowPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {regError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                  {regError}
                </div>
              )}
              <button type="submit" disabled={regLoading}
                className="flex items-center justify-center gap-2 bg-terra-forest text-white font-bold rounded-lg py-3 hover:bg-terra-dark transition-colors disabled:opacity-60 mt-1">
                {regLoading && <Loader2 size={15} className="animate-spin" />}
                {regLoading ? 'Création...' : 'Créer mon compte →'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              Déjà un compte ?{' '}
              <button onClick={() => setTab('login')} className="text-terra-medium hover:text-terra-forest font-semibold">
                Se connecter
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
