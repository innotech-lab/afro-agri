// frontend/src/components/Topbar.jsx
import { useEffect, useState } from 'react'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = {
  agriculteur: { label: 'Agriculteur', color: 'bg-terra-forest text-terra-light' },
  minister:    { label: 'Ministère',   color: 'bg-blue-900 text-blue-300' },
  admin:       { label: 'Admin Système', color: 'bg-red-900 text-red-300' },
}

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('afroagri_theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('afroagri_theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const role = user?.id_type?.toLowerCase()
  const roleInfo = ROLE_LABELS[role] ?? { label: role, color: 'bg-gray-700 text-gray-300' }

  return (
    <header className="h-12 bg-terra-dark flex items-center px-4 gap-3 flex-shrink-0">
      <span className="text-terra-gold font-extrabold text-base tracking-tight mr-2">
        🌿 AfroAgri
      </span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>
        {roleInfo.label}
      </span>

      <div className="flex-1" />

      <button
        onClick={() => setDark(d => !d)}
        className="p-1.5 rounded-lg text-terra-medium hover:text-terra-light hover:bg-terra-forest transition-colors"
        title={dark ? 'Mode clair' : 'Mode sombre'}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-7 h-7 rounded-full bg-terra-forest flex items-center justify-center text-terra-light text-xs font-bold">
        {user?.nom?.[0]?.toUpperCase() ?? user?.id_type?.[0]?.toUpperCase() ?? '?'}
      </div>

      <button
        onClick={handleLogout}
        className="p-1.5 rounded-lg text-terra-medium hover:text-red-400 hover:bg-terra-forest transition-colors"
        title="Se déconnecter"
      >
        <LogOut size={16} />
      </button>
    </header>
  )
}
