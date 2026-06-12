# 🌿 AfroAgri - Frontend

Bienvenue dans la partie Frontend de la plateforme **AfroAgri**, une application moderne dédiée à la digitalisation de l'agriculture africaine.

## 🚀 Stack Technique

L'interface est bâtie avec des technologies de pointe pour garantir performance, réactivité et maintenabilité :

- **React 19** : Bibliothèque principale pour une UI dynamique et performante.
- **Vite** : Outil de build ultra-rapide pour un développement fluide.
- **Tailwind CSS** : Framework utilitaire pour un design personnalisé (Thème "Terra").
- **React Router 7** : Gestion avancée de la navigation et des routes protégées.
- **Lucide React** : Bibliothèque d'icônes épurées et modernes.
- **Recharts** : Visualisation de données pour les tableaux de bord.
- **Axios** : Client HTTP pour la communication avec l'API Django.

## ✨ Fonctionnalités (Features)

L'application propose une expérience utilisateur segmentée par rôles :

### 🌍 Portail Public
- **Landing Page** : Présentation des services et de la mission d'AfroAgri.
- **Authentification** : Système de login sécurisé avec gestion de session via contextes React.

### 🚜 Espace Agriculteur
- **Dashboard Agriculteur** : Suivi des cultures et des activités.
- **Analyseur de Terrain** : Outil intelligent pour évaluer la santé des sols et des plantes.
- **Journal de Bord** : Historique des interventions sur les parcelles.

### 🏛️ Espace Ministère & Admin
- **Dashboard Ministériel** : Vue d'ensemble statistique sur la production nationale.
- **Administration Système** : Gestion des utilisateurs et des référentiels (plantes, types d'usagers).
- **KPI Cards & Graphiques** : Visualisation en temps réel des indicateurs clés via des diagrammes circulaires et à barres.

### 🌓 Design & UX
- **Thème "Terra"** : Identité visuelle forte basée sur des tons organiques (Vert forêt, Or, Terre).
- **Mode Sombre/Clair** : Support natif du mode sombre pour un confort visuel optimal.
- **Responsive Design** : Interface totalement adaptée aux mobiles et tablettes.

## 🛠️ Installation et Lancement

1. Entrez dans le dossier :
   ```bash
   cd frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 📁 Structure du Projet

- `/src/components` : Composants réutilisables (KpiCards, Charts, AppShell).
- `/src/pages` : Pages principales organisées par modules (Admin, Agriculteur, Ministère).
- `/src/context` : Gestion de l'état global (Authentification).
- `/src/router` : Configuration des routes et des accès sécurisés.
- `/src/assets` : Ressources statiques (images, logo).
