// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('afroagri_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = async (email, password) => {
    const { data } = await axios.post('/api/users/auth/login/', { email, password })
    // data = { user_id, id_type }
    setUser(data)
    localStorage.setItem('afroagri_user', JSON.stringify(data))
    return data
  }

  const logout = async () => {
    try { await axios.post('/api/users/auth/logout/') } catch {}
    setUser(null)
    localStorage.removeItem('afroagri_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
