// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './router/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import DashboardAgriculteur from './pages/agriculteur/DashboardAgriculteur'
import DashboardMinistere from './pages/ministere/DashboardMinistere'
import DashboardAdmin from './pages/admin/DashboardAdmin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard/agriculteur/*"
        element={
          <ProtectedRoute allowedRole="agriculteur">
            <DashboardAgriculteur />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/ministere/*"
        element={
          <ProtectedRoute allowedRole="minister">
            <DashboardMinistere />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin/*"
        element={
          <ProtectedRoute allowedRole="admin">
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
