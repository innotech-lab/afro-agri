// frontend/src/router/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
  particulier: '/dashboard/particulier',
}

export default function ProtectedRoute({ allowedRole, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/" replace />

  const userRole = user.id_type?.toLowerCase()

  if (allowedRole && userRole !== allowedRole) {
    const redirect = ROLE_ROUTES[userRole] ?? '/'
    return <Navigate to={redirect} replace />
  }

  return children
}
