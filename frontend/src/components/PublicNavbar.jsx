import { useState, useEffect } from 'react'
import { Sun, Moon, LogIn, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LoginModal from './LoginModal'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
  particulier: '/dashboard/particulier',
}

export default function PublicNavbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('afroagri_theme') === 'dark')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('afroagri_theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleDashboard = () => {
    const role = user?.id_type?.toLowerCase()
    navigate(ROLE_ROUTES[role] ?? '/')
  }

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-terra-dark/90 backdrop-blur-md shadow-sm border-b border-terra-border dark:border-terra-forest'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-auto cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-terra-dark rounded-lg flex items-center justify-center text-lg flex-shrink-0">
              🌿
            </div>
            <div>
              <span className="font-extrabold text-terra-dark dark:text-terra-gold text-base tracking-tight">
                AfroAgri
              </span>
              <span className="hidden sm:inline text-terra-medium text-xs ml-2 font-medium">
                Plateforme agricole
              </span>
            </div>
          </div>

          {/* Nav links */}
          <a href="#analyse" className="hidden md:block text-sm font-medium text-terra-dark dark:text-terra-light hover:text-terra-forest dark:hover:text-terra-gold transition-colors">
            Analyser un terrain
          </a>
          <a href="#comment" className="hidden md:block text-sm font-medium text-terra-dark dark:text-terra-light hover:text-terra-forest dark:hover:text-terra-gold transition-colors">
            Comment ça marche
          </a>

          {/* Actions */}
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg text-terra-medium hover:text-terra-dark dark:hover:text-terra-light hover:bg-terra-bg dark:hover:bg-terra-forest transition-colors"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user ? (
            <button
              onClick={handleDashboard}
              className="flex items-center gap-2 bg-terra-dark text-terra-gold text-sm font-bold px-4 py-2 rounded-lg hover:bg-terra-forest transition-colors"
            >
              <LayoutDashboard size={15} />
              Mon espace
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 bg-terra-dark text-terra-gold text-sm font-bold px-4 py-2 rounded-lg hover:bg-terra-forest transition-colors"
            >
              <LogIn size={15} />
              Connexion
            </button>
          )}
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
