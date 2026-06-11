# AfroAgri Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete React frontend with login, role-based routing, and 3 dashboards (Agriculteur, Ministère, Admin) connected to the existing Django REST backend.

**Architecture:** Vite + React SPA in `/frontend`, communicating with Django on `localhost:8000` via Axios. Auth state lives in `AuthContext` (localStorage-persisted). A `ProtectedRoute` reads `id_type` from context and guards/redirects each dashboard route. All dashboards share the same `AppShell` (Sidebar + Topbar) but render role-specific content.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3 (darkMode: class), React Router v6, Recharts, Axios, Lucide React (icons)

---

## File Map

| File | Responsibility |
|------|---------------|
| `frontend/vite.config.js` | Vite config with `/api` proxy to Django :8000 |
| `frontend/tailwind.config.js` | Terra Verde palette + dark mode class |
| `frontend/src/main.jsx` | React root mount |
| `frontend/src/App.jsx` | Router tree + AuthContext provider |
| `frontend/src/context/AuthContext.jsx` | user_id, id_type, login(), logout(), localStorage persist |
| `frontend/src/router/ProtectedRoute.jsx` | Guards a route by allowed roles, redirects if unauthorized |
| `frontend/src/components/AppShell.jsx` | Sidebar + Topbar wrapper used by all 3 dashboards |
| `frontend/src/components/Sidebar.jsx` | Icon-only sidebar (56px), expands to 200px on hover, role-aware nav items |
| `frontend/src/components/Topbar.jsx` | Logo, role badge, dark/light toggle, avatar + logout |
| `frontend/src/components/KpiCard.jsx` | Stat card: value, label, optional trend indicator |
| `frontend/src/components/BarChartWidget.jsx` | Recharts BarChart wrapper with Terra Verde colors |
| `frontend/src/components/DonutChartWidget.jsx` | Recharts PieChart (donut) wrapper with Terra Verde colors |
| `frontend/src/pages/LoginPage.jsx` | Split-screen login: dark left branding, light right form |
| `frontend/src/pages/agriculteur/DashboardAgriculteur.jsx` | KPIs + bar chart + journal table + donut IA |
| `frontend/src/pages/ministere/DashboardMinistere.jsx` | National KPIs + 4 charts (read-only) |
| `frontend/src/pages/admin/DashboardAdmin.jsx` | Full KPIs + charts + users side panel |

---

## Task 1: Scaffold Vite + React project

**Files:**
- Create: `frontend/` (entire directory via npm)
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Scaffold the project**

```bash
cd /home/maverick/afro-agri
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom axios recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Replace `vite.config.js`**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Replace `tailwind.config.js`**

```js
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terra: {
          dark:    '#1a2e1a',
          forest:  '#2d5a3d',
          medium:  '#4a7c59',
          light:   '#7ec87a',
          gold:    '#d4a843',
          bg:      '#f5f7f0',
          surface: '#ffffff',
          border:  '#e0e8d8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Replace `src/index.css`**

```css
/* frontend/src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-terra-bg text-terra-dark font-sans;
  }
  .dark body {
    @apply bg-[#0f1a0f] text-[#e8f5e4];
  }
}
```

- [ ] **Step 6: Delete boilerplate files**

```bash
rm -f frontend/src/App.css frontend/src/assets/react.svg public/vite.svg
```

- [ ] **Step 7: Verify Vite starts**

```bash
cd frontend && npm run dev
```

Expected: server running at `http://localhost:5173` with no errors in terminal.

- [ ] **Step 8: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/
git commit -m "feat: scaffold React+Vite frontend with Tailwind Terra Verde config"
```

---

## Task 2: AuthContext + ProtectedRoute

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/router/ProtectedRoute.jsx`

- [ ] **Step 1: Create `AuthContext.jsx`**

```jsx
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
```

- [ ] **Step 2: Create `ProtectedRoute.jsx`**

```jsx
// frontend/src/router/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
}

export default function ProtectedRoute({ allowedRole, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  const userRole = user.id_type?.toLowerCase()

  if (allowedRole && userRole !== allowedRole) {
    const redirect = ROLE_ROUTES[userRole] ?? '/login'
    return <Navigate to={redirect} replace />
  }

  return children
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/ frontend/src/router/
git commit -m "feat: add AuthContext with localStorage persist and ProtectedRoute"
```

---

## Task 3: App.jsx — Router tree

**Files:**
- Modify: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: Replace `main.jsx`**

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 2: Create `App.jsx`**

```jsx
// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './router/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardAgriculteur from './pages/agriculteur/DashboardAgriculteur'
import DashboardMinistere from './pages/ministere/DashboardMinistere'
import DashboardAdmin from './pages/admin/DashboardAdmin'

const ROLE_ROUTES = {
  agriculteur: '/dashboard/agriculteur',
  minister:    '/dashboard/ministere',
  admin:       '/dashboard/admin',
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_ROUTES[user.id_type?.toLowerCase()] ?? '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
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
```

- [ ] **Step 3: Create placeholder pages so imports resolve**

```bash
mkdir -p frontend/src/pages/agriculteur frontend/src/pages/ministere frontend/src/pages/admin
```

```jsx
// frontend/src/pages/LoginPage.jsx
export default function LoginPage() { return <div>Login</div> }
```

```jsx
// frontend/src/pages/agriculteur/DashboardAgriculteur.jsx
export default function DashboardAgriculteur() { return <div>Agriculteur</div> }
```

```jsx
// frontend/src/pages/ministere/DashboardMinistere.jsx
export default function DashboardMinistere() { return <div>Ministere</div> }
```

```jsx
// frontend/src/pages/admin/DashboardAdmin.jsx
export default function DashboardAdmin() { return <div>Admin</div> }
```

- [ ] **Step 4: Verify the app compiles with no errors**

```bash
cd frontend && npm run dev
```

Expected: no compile errors, browser shows blank page or "Login" text at `/login`.

- [ ] **Step 5: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/
git commit -m "feat: add router tree with role-based ProtectedRoute and placeholder pages"
```

---

## Task 4: Shared UI components — KpiCard, BarChartWidget, DonutChartWidget

**Files:**
- Create: `frontend/src/components/KpiCard.jsx`
- Create: `frontend/src/components/BarChartWidget.jsx`
- Create: `frontend/src/components/DonutChartWidget.jsx`

- [ ] **Step 1: Create `KpiCard.jsx`**

```jsx
// frontend/src/components/KpiCard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KpiCard({ value, label, trend, trendDirection }) {
  const TrendIcon =
    trendDirection === 'up' ? TrendingUp :
    trendDirection === 'down' ? TrendingDown : Minus

  const trendColor =
    trendDirection === 'up' ? 'text-terra-medium' :
    trendDirection === 'down' ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-2xl font-extrabold text-terra-dark dark:text-[#e8f5e4]">
        {value ?? '—'}
      </span>
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={12} />
          {trend}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `BarChartWidget.jsx`**

```jsx
// frontend/src/components/BarChartWidget.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const COLORS = ['#4a7c59', '#7ec87a', '#d4a843', '#2d5a3d', '#1a2e1a']

export default function BarChartWidget({ title, data, dataKey, nameKey = 'name' }) {
  return (
    <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
      {title && (
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e8d8" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#4a7c59' }} />
          <YAxis tick={{ fontSize: 10, fill: '#4a7c59' }} />
          <Tooltip
            contentStyle={{
              background: '#1a2e1a', border: 'none', borderRadius: 8,
              color: '#7ec87a', fontSize: 12,
            }}
          />
          <Bar dataKey={dataKey} fill="#4a7c59" radius={[4, 4, 0, 0]}>
            {data?.map((_, i) => (
              <rect key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create `DonutChartWidget.jsx`**

```jsx
// frontend/src/components/DonutChartWidget.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#4a7c59', '#d4a843', '#7ec87a', '#2d5a3d', '#1a2e1a']

export default function DonutChartWidget({ title, data, nameKey = 'name', valueKey = 'value' }) {
  const normalized = data?.map(d => ({ name: d[nameKey], value: d[valueKey] })) ?? []

  return (
    <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
      {title && (
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={normalized}
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={70}
            paddingAngle={3}
            dataKey="value"
          >
            {normalized.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a2e1a', border: 'none', borderRadius: 8,
              color: '#7ec87a', fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#4a7c59' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/components/
git commit -m "feat: add KpiCard, BarChartWidget, DonutChartWidget shared components"
```

---

## Task 5: Sidebar + Topbar + AppShell

**Files:**
- Create: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/components/Topbar.jsx`
- Create: `frontend/src/components/AppShell.jsx`

- [ ] **Step 1: Create `Sidebar.jsx`**

```jsx
// frontend/src/components/Sidebar.jsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ items }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{ width: expanded ? 200 : 56, transition: 'width 200ms ease' }}
      className="flex-shrink-0 bg-terra-dark flex flex-col gap-1 py-4 overflow-hidden"
    >
      {items.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 mx-2 px-2 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap
            ${isActive
              ? 'bg-terra-forest text-terra-light'
              : 'text-terra-medium hover:bg-terra-forest hover:text-terra-light'
            }`
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          <span
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 150ms ease',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </NavLink>
      ))}
    </aside>
  )
}
```

- [ ] **Step 2: Create `Topbar.jsx`**

```jsx
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
```

- [ ] **Step 3: Create `AppShell.jsx`**

```jsx
// frontend/src/components/AppShell.jsx
import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function AppShell({ sidebarItems, children }) {
  return (
    <div className="flex flex-col h-screen bg-terra-bg dark:bg-[#0f1a0f]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/components/
git commit -m "feat: add Sidebar (icon+expand), Topbar (role badge, dark toggle, logout), AppShell"
```

---

## Task 6: LoginPage — Split screen

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`

- [ ] **Step 1: Replace placeholder `LoginPage.jsx`**

```jsx
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
            Accès sécurisé · AfroAgri 2025
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify login page renders at `/login`**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173/login` — expect split screen with dark left panel and form on right.

- [ ] **Step 3: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/pages/LoginPage.jsx
git commit -m "feat: add split-screen login page with role-based redirect and error handling"
```

---

## Task 7: Dashboard Agriculteur

**Files:**
- Modify: `frontend/src/pages/agriculteur/DashboardAgriculteur.jsx`

- [ ] **Step 1: Replace placeholder with full dashboard**

```jsx
// frontend/src/pages/agriculteur/DashboardAgriculteur.jsx
import { useEffect, useState } from 'react'
import { LayoutDashboard, MapPin, Flower2, BookOpen, Microscope } from 'lucide-react'
import axios from 'axios'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import BarChartWidget from '../../components/BarChartWidget'
import DonutChartWidget from '../../components/DonutChartWidget'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tableau de bord', to: '/dashboard/agriculteur' },
  { icon: MapPin,          label: 'Mes Champs',      to: '/dashboard/agriculteur/champs' },
  { icon: Flower2,         label: 'Mes Plantes',     to: '/dashboard/agriculteur/plantes' },
  { icon: BookOpen,        label: 'Journal',          to: '/dashboard/agriculteur/journal' },
  { icon: Microscope,      label: 'Diagnostic IA',   to: '/dashboard/agriculteur/diagnostic' },
]

const STATUS_STYLES = {
  sain:   'bg-green-100 text-green-800',
  veille: 'bg-yellow-100 text-yellow-800',
  alerte: 'bg-red-100 text-red-800',
}

function getStatus(symptomes) {
  if (!symptomes) return 'sain'
  const s = symptomes.toLowerCase()
  if (s.includes('alerte') || s.includes('maladie') || s.includes('danger')) return 'alerte'
  if (s.includes('veille') || s.includes('attention')) return 'veille'
  return 'sain'
}

export default function DashboardAgriculteur() {
  const [champs, setChamps] = useState([])
  const [plantes, setPlantes] = useState([])
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/champs/'),
      axios.get('/api/plantes/'),
      axios.get('/api/journal/'),
    ]).then(([c, p, j]) => {
      setChamps(c.data?.results ?? c.data ?? [])
      setPlantes(p.data?.results ?? p.data ?? [])
      setJournal(j.data?.results ?? j.data ?? [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  // Prepare chart data
  const stadeData = journal.reduce((acc, entry) => {
    const key = entry.stade_croissance || 'Inconnu'
    const existing = acc.find(d => d.name === key)
    if (existing) existing.count++
    else acc.push({ name: key, count: 1 })
    return acc
  }, [])

  const diagnosticData = [
    { name: 'Sain',    value: journal.filter(j => getStatus(j.symptomes) === 'sain').length },
    { name: 'Veille',  value: journal.filter(j => getStatus(j.symptomes) === 'veille').length },
    { name: 'Alerte',  value: journal.filter(j => getStatus(j.symptomes) === 'alerte').length },
  ].filter(d => d.value > 0)

  const recentJournal = [...journal]
    .sort((a, b) => new Date(b.date_observation) - new Date(a.date_observation))
    .slice(0, 5)

  const alertCount = journal.filter(j => getStatus(j.symptomes) === 'alerte').length
  const healthPct = journal.length
    ? Math.round((journal.filter(j => getStatus(j.symptomes) === 'sain').length / journal.length) * 100)
    : 0

  if (loading) {
    return (
      <AppShell sidebarItems={NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-terra-medium">
          Chargement...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell sidebarItems={NAV_ITEMS}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de votre exploitation</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value={champs.length} label="Mes Champs" trendDirection="up" trend="actifs" />
          <KpiCard value={plantes.length} label="Plantes" />
          <KpiCard value={alertCount} label="Alertes" trendDirection={alertCount > 0 ? 'down' : 'up'} trend={alertCount > 0 ? 'à surveiller' : 'aucune'} />
          <KpiCard value={`${healthPct}%`} label="Santé moyenne" trendDirection="up" trend="bon état" />
        </div>

        {/* Charts + table row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <BarChartWidget
              title="Stades de croissance"
              data={stadeData}
              dataKey="count"
              nameKey="name"
            />
          </div>

          {/* Journal table */}
          <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
              Journal récent
            </p>
            {recentJournal.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune entrée</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentJournal.map(entry => {
                  const status = getStatus(entry.symptomes)
                  return (
                    <div key={entry.id_journal} className="flex items-center justify-between text-sm">
                      <span className="text-terra-dark dark:text-[#e8f5e4] truncate max-w-[60%]">
                        {entry.stade_croissance ?? `Entrée #${entry.id_journal}`}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <DonutChartWidget
              title="Santé des cultures"
              data={diagnosticData}
              nameKey="name"
              valueKey="value"
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/pages/agriculteur/
git commit -m "feat: add Agriculteur dashboard with KPIs, charts, and journal table"
```

---

## Task 8: Dashboard Ministère

**Files:**
- Modify: `frontend/src/pages/ministere/DashboardMinistere.jsx`

- [ ] **Step 1: Replace placeholder**

```jsx
// frontend/src/pages/ministere/DashboardMinistere.jsx
import { useEffect, useState } from 'react'
import { LayoutDashboard, MapPin, Flower2, FlaskConical, FileBarChart } from 'lucide-react'
import axios from 'axios'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import BarChartWidget from '../../components/BarChartWidget'
import DonutChartWidget from '../../components/DonutChartWidget'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Vue nationale',   to: '/dashboard/ministere' },
  { icon: MapPin,          label: 'Champs',          to: '/dashboard/ministere/champs' },
  { icon: Flower2,         label: 'Plantes',         to: '/dashboard/ministere/plantes' },
  { icon: FlaskConical,    label: 'Études de sol',   to: '/dashboard/ministere/etudes' },
  { icon: FileBarChart,    label: 'Rapports',        to: '/dashboard/ministere/rapports' },
]

export default function DashboardMinistere() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/DashboardMinister/')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell sidebarItems={NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-terra-medium">Chargement...</div>
      </AppShell>
    )
  }

  const counts = data?.counts ?? {}

  const sourceEauData = (data?.champs?.by_source_eau ?? [])
    .map(d => ({ name: d.source_eau ?? 'N/A', count: d.count }))

  const typeSolData = (data?.etude_sol?.by_type_sol ?? [])
    .map(d => ({ name: d.type_sol ?? 'N/A', value: d.count }))

  const fertiliteData = (data?.etude_sol?.by_fertilite ?? [])
    .map(d => ({ name: d.fertilite ?? 'N/A', count: d.count }))

  const planteVarieteData = (data?.plantes?.by_variete ?? [])
    .slice(0, 5)
    .map(d => ({ name: d.variete ?? 'N/A', count: d.count }))

  const agriculteurs = (data?.users?.by_type ?? [])
    .find(u => u.id_type__type?.toLowerCase() === 'agriculteur')?.count ?? 0

  return (
    <AppShell sidebarItems={NAV_ITEMS}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">Vue nationale</h1>
          <p className="text-sm text-gray-500 mt-0.5">Statistiques agricoles — lecture seule</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value={counts.champs?.toLocaleString()} label="Champs nationaux" />
          <KpiCard value={counts.plantes?.toLocaleString()} label="Plantes enregistrées" />
          <KpiCard value={agriculteurs} label="Agriculteurs actifs" />
          <KpiCard value={counts.etude_sol} label="Études de sol" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartWidget title="Champs par source d'eau" data={sourceEauData} dataKey="count" nameKey="name" />
          <DonutChartWidget title="Types de sol" data={typeSolData} nameKey="name" valueKey="value" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartWidget title="Fertilité des sols" data={fertiliteData} dataKey="count" nameKey="name" />
          <BarChartWidget title="Top 5 variétés de plantes" data={planteVarieteData} dataKey="count" nameKey="name" />
        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/pages/ministere/
git commit -m "feat: add Ministere dashboard with national KPIs and 4 stat charts"
```

---

## Task 9: Dashboard Admin Système

**Files:**
- Modify: `frontend/src/pages/admin/DashboardAdmin.jsx`

- [ ] **Step 1: Replace placeholder**

```jsx
// frontend/src/pages/admin/DashboardAdmin.jsx
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, MapPin, Flower2, Microscope, Settings } from 'lucide-react'
import axios from 'axios'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import BarChartWidget from '../../components/BarChartWidget'
import DonutChartWidget from '../../components/DonutChartWidget'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Vue globale',    to: '/dashboard/admin' },
  { icon: Users,           label: 'Utilisateurs',  to: '/dashboard/admin/users' },
  { icon: MapPin,          label: 'Champs',        to: '/dashboard/admin/champs' },
  { icon: Flower2,         label: 'Plantes',       to: '/dashboard/admin/plantes' },
  { icon: Microscope,      label: 'Diagnostics',   to: '/dashboard/admin/diagnostics' },
  { icon: Settings,        label: 'Paramètres',    to: '/dashboard/admin/settings' },
]

const TYPE_COLORS = {
  agriculteur: 'bg-terra-forest text-terra-light',
  minister:    'bg-blue-900 text-blue-300',
  admin:       'bg-red-900 text-red-300',
}

export default function DashboardAdmin() {
  const [data, setData] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/DashboardAdmin/'),
      axios.get('/api/users/users/'),
    ]).then(([d, u]) => {
      setData(d.data)
      const raw = u.data?.results ?? u.data ?? []
      setUsers(Array.isArray(raw) ? raw.slice(0, 6) : [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell sidebarItems={NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-terra-medium">Chargement...</div>
      </AppShell>
    )
  }

  const counts = data?.counts ?? {}

  const activityData = (data?.journal?.by_stade ?? [])
    .map(d => ({ name: d.stade_croissance ?? 'N/A', count: d.count }))

  const userTypeData = (data?.users?.by_type ?? [])
    .map(d => ({ name: d.id_type__type ?? 'N/A', value: d.count }))

  return (
    <AppShell sidebarItems={NAV_ITEMS}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">Vue globale</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administration système — accès complet</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value={counts.users} label="Utilisateurs" trendDirection="up" trend="ce mois" />
          <KpiCard value={counts.champs?.toLocaleString()} label="Champs" />
          <KpiCard value={counts.journal} label="Entrées journal" />
          <KpiCard value={counts.etude_sol} label="Études de sol" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BarChartWidget
              title="Activité — stades de croissance"
              data={activityData}
              dataKey="count"
              nameKey="name"
            />
          </div>
          <DonutChartWidget
            title="Utilisateurs par rôle"
            data={userTypeData}
            nameKey="name"
            valueKey="value"
          />
        </div>

        {/* Users panel */}
        <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
            Derniers utilisateurs inscrits
          </p>
          {users.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun utilisateur</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map(u => {
                const role = u.id_type?.type?.toLowerCase() ?? ''
                const colorClass = TYPE_COLORS[role] ?? 'bg-gray-700 text-gray-300'
                const initials = `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || '?'
                return (
                  <div
                    key={u.id_user}
                    className="flex items-center gap-3 p-3 bg-terra-bg dark:bg-terra-forest rounded-lg"
                  >
                    <div className="w-9 h-9 rounded-full bg-terra-forest dark:bg-terra-dark flex items-center justify-center text-terra-light text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-terra-dark dark:text-[#e8f5e4] truncate">
                        {u.prenom} {u.nom}
                      </div>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${colorClass}`}>
                        {u.id_type?.type ?? role}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/pages/admin/
git commit -m "feat: add Admin dashboard with full stats and users panel"
```

---

## Task 10: Dark mode init + final polish

**Files:**
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Apply saved theme preference on app load**

Add this before `ReactDOM.createRoot` in `main.jsx`:

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

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
```

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

```bash
echo '.superpowers/' >> /home/maverick/afro-agri/.gitignore
```

- [ ] **Step 3: Build and verify no errors**

```bash
cd frontend && npm run build
```

Expected: `dist/` folder created, no TypeScript/compile errors.

- [ ] **Step 4: Final commit**

```bash
cd /home/maverick/afro-agri
git add frontend/src/main.jsx .gitignore
git commit -m "feat: apply dark mode on load from localStorage, finalize frontend build"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| React + Vite + Tailwind + Recharts | Task 1 |
| Palette Terra Verde | Task 1 (tailwind.config.js) |
| AuthContext + localStorage | Task 2 |
| ProtectedRoute role guard | Task 2 |
| Router tree with redirects | Task 3 |
| KpiCard, BarChartWidget, DonutChartWidget | Task 4 |
| Sidebar icon (56px→200px hover expand) | Task 5 |
| Topbar (badge, dark toggle, avatar, logout) | Task 5 |
| AppShell layout | Task 5 |
| Login split screen, no role selector | Task 6 |
| Post-login redirect by id_type | Task 6 + Task 3 |
| Dashboard Agriculteur (champs, plantes, journal, IA) | Task 7 |
| Dashboard Ministère (stats nationales, read-only) | Task 8 |
| Dashboard Admin (tout + users panel) | Task 9 |
| Dark/Light toggle persisted | Task 5 + Task 10 |
| Dark mode applied on load | Task 10 |

All spec requirements are covered. No gaps found.
