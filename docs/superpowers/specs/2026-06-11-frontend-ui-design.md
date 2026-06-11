# AfroAgri — Frontend UI Design Spec
**Date:** 2026-06-11  
**Scope:** Login + 3 Dashboards (Agriculteur, Ministère, Admin Système)  
**Responsable UI/UX:** Francis Danzo

---

## 1. Stack technique

| Outil | Rôle |
|-------|------|
| React + Vite | Framework / bundler |
| React Router v6 | Routing & navigation |
| Tailwind CSS | Styling utilitaire |
| Recharts | Graphiques (bar, donut, line) |
| Context API | État auth global |
| Axios | Appels API |

Le frontend vit dans `/frontend` à la racine du repo, séparé du backend Django.

---

## 2. Identité visuelle — Terra Verde

### Palette
```
--color-dark:      #1a2e1a   (sidebar, login gauche, topbar)
--color-forest:    #2d5a3d   (hover sidebar, cards actives)
--color-medium:    #4a7c59   (bordures, icônes inactives)
--color-light:     #7ec87a   (accents, texte actif sidebar)
--color-gold:      #d4a843   (CTA, bouton login, highlights)
--color-bg:        #f5f7f0   (fond principal light mode)
--color-surface:   #ffffff   (cards, panels)
--color-border:    #e0e8d8   (séparateurs, bordures cards)

/* Dark mode */
--color-bg-dark:   #0f1a0f
--color-surface-dk:#1a2e1a
--color-border-dk: #2d5a3d
```

### Typographie
- Font: `Inter` (Google Fonts)
- Titres dashboard: `font-bold text-xl text-dark`
- Labels KPI: `text-xs uppercase tracking-wide text-gray-500`
- Valeurs KPI: `text-2xl font-extrabold`

---

## 3. Architecture des routes

```
/                   → redirect vers /login si non authentifié
/login              → LoginPage (publique)
/dashboard/agriculteur  → DashboardAgriculteur (rôle: agriculteur)
/dashboard/ministere    → DashboardMinistere   (rôle: minister)
/dashboard/admin        → DashboardAdmin       (rôle: admin)
```

**Auth flow :**
1. POST `/api/users/auth/login/` → `{ user_id, id_type }`
2. Stockage dans `AuthContext` (+ localStorage pour persist)
3. `ProtectedRoute` compare `id_type` → redirige vers le bon dashboard
4. Si `id_type` inconnu → redirect `/login`

---

## 4. Composants partagés

### `<AppShell>`
Layout de base utilisé par les 3 dashboards :
- `<Sidebar>` — sombre, icônes, expand au hover (width 56px → 200px)
- `<Topbar>` — logo, badge rôle coloré, toggle dark/light, avatar + menu
- `<MainContent>` — zone scrollable principale

### `<Sidebar>`
- Fond `#1a2e1a`, icônes inactives `#4a7c59`, actif `#7ec87a` sur fond `#2d5a3d`
- Expand au hover avec transition CSS 200ms
- Items différents par rôle (injectés via props)

### `<Topbar>`
- Badge rôle coloré : vert agriculteur, bleu ministère, rouge admin
- Toggle dark/light : bascule classe `dark` sur `<html>`
- Avatar avec initiales de l'utilisateur

### `<KpiCard>`
```
props: { value, label, trend, trendDirection }
```
Card blanche, valeur large, label uppercase, indicateur de tendance coloré.

### `<BarChartWidget>` / `<DonutChartWidget>`
Wrappers Recharts avec couleurs Terra Verde pré-configurées.

---

## 5. Page Login

**Layout :** Split screen 50/50

**Gauche (fond `#1a2e1a`) :**
- Logo AfroAgri + icône 🌿
- Tagline : "Agriculture intelligente pour l'Afrique"
- Illustration / pattern géométrique africain (SVG)
- Citation ou stat clé du projet

**Droite (fond `#f5f7f0`) :**
- Titre "Bon retour"
- Sous-titre "Connectez-vous à votre espace"
- Champ email
- Champ password (toggle visibilité)
- Bouton "Connexion →" (fond `#1a2e1a`, texte `#d4a843`)
- Message d'erreur inline si credentials invalides
- Pas de sélecteur de rôle — le système détecte automatiquement

**Comportement post-login :**
```
id_type === "agriculteur" → /dashboard/agriculteur
id_type === "minister"    → /dashboard/ministere
id_type === "admin"       → /dashboard/admin
autre                     → /login (erreur)
```

---

## 6. Dashboard Agriculteur

**Sidebar items :** Tableau de bord, Mes Champs, Mes Plantes, Journal, Diagnostic IA

**KPIs (ligne 1) :**
- Nombre de champs actifs
- Nombre de plantes enregistrées
- Nombre d'alertes actives
- Score santé moyen (%)

**Widgets :**
- `BarChart` — stades de croissance des plantes
- `Table` — journal récent (5 dernières entrées) avec badge statut (Sain / Veille / Alerte)
- `DonutChart` — répartition diagnostic IA (sain / malade / inconnu)

**Pages secondaires (sidebar) :**
- `/dashboard/agriculteur/champs` — liste de ses champs
- `/dashboard/agriculteur/plantes` — liste de ses plantes
- `/dashboard/agriculteur/journal` — journal complet
- `/dashboard/agriculteur/diagnostic` — interface diagnostic IA (upload photo)

---

## 7. Dashboard Ministère

**Sidebar items :** Vue nationale, Champs, Plantes, Études de sol, Rapports

**KPIs (ligne 1) :**
- Total champs nationaux
- Total plantes enregistrées
- Total agriculteurs actifs
- Score santé national moyen (%)

**Widgets :**
- `BarChart` — champs par source d'eau
- `DonutChart` — types de sol (répartition nationale)
- `BarChart` — fertilité des sols (haute / moyenne / basse)
- `BarChart` — plantes par variété (top 5)

**Contrainte :** Lecture seule — aucun bouton de modification. Pas d'accès à la gestion users.

---

## 8. Dashboard Admin Système

**Sidebar items :** Vue globale, Utilisateurs, Champs, Plantes, Diagnostics, Paramètres

**KPIs (ligne 1) :**
- Total utilisateurs (+ trend mensuel)
- Total champs
- Total diagnostics IA soumis
- Alertes système actives

**Widgets :**
- `BarChart` — activité globale (journal entries par période)
- `DonutChart` — répartition users par type
- Panel latéral droit — derniers utilisateurs inscrits (avatar, nom, type)

**Fonctionnalités admin :**
- Page `/dashboard/admin/users` — liste complète des users, création, désactivation
- Toutes les stats du dashboard Ministère accessibles également

---

## 9. Dark / Light Mode

- Implémenté via Tailwind `darkMode: 'class'`
- Classe `dark` toggleée sur `<html>` au clic du bouton dans la topbar
- Préférence persistée dans `localStorage`
- Dark mode colors : fond `#0f1a0f`, cards `#1a2e1a`, bordures `#2d5a3d`, texte `#e8f5e4`

---

## 10. Structure des fichiers

```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx               # Router + AuthContext provider
│   ├── context/
│   │   └── AuthContext.jsx   # user_id, id_type, login(), logout()
│   ├── components/
│   │   ├── AppShell.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── KpiCard.jsx
│   │   ├── BarChartWidget.jsx
│   │   └── DonutChartWidget.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── agriculteur/
│   │   │   └── DashboardAgriculteur.jsx
│   │   ├── ministere/
│   │   │   └── DashboardMinistere.jsx
│   │   └── admin/
│   │       └── DashboardAdmin.jsx
│   └── router/
│       └── ProtectedRoute.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 11. API endpoints utilisés

| Endpoint | Méthode | Utilisé par |
|----------|---------|-------------|
| `/api/users/auth/login/` | POST | LoginPage |
| `/api/users/auth/logout/` | POST | Topbar |
| `/api/DashboardMinister/` | GET | Ministère + Admin |
| `/api/DashboardAdmin/` | GET | Admin |
| `/api/champs/` | GET | Agriculteur |
| `/api/plantes/` | GET | Agriculteur |
| `/api/journal/` | GET | Agriculteur |
| `/api/diagnostic/` | POST | Agriculteur (IA) |
| `/api/users/users/` | GET/POST | Admin |
