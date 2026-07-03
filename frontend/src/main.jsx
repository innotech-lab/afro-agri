// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import axios from 'axios'

// Envoie automatiquement l'identité stockée en localStorage sur chaque requête API
axios.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('afroagri_user')
    if (stored) {
      const u = JSON.parse(stored)
      if (u?.user_id)  config.headers['X-User-Id']   = u.user_id
      if (u?.id_type)  config.headers['X-User-Type'] = u.id_type
    }
  } catch {}
  return config
})

// Apply saved theme before first paint
const savedTheme = localStorage.getItem('afroagri_theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
