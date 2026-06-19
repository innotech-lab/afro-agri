/* eslint-disable react-refresh/only-export-components */
import { Navigate, useLocation } from 'react-router-dom'
import ResourceManager from './ResourceManager'
import { MapView, ProfileView, ReportsView, SettingsView } from './DashboardExtras'

const waterOptions = ['Forage', 'Pluie', 'Irrigation', 'Riviere'].map(value => ({ value, label: value }))

export const champConfig = {
  title: 'Champs',
  description: 'Informations, superficies, sources d’eau et coordonnées des exploitations',
  endpoint: '/api/champs/',
  idKey: 'id_champ',
  columns: [
    { key: 'id_champ', label: 'ID' },
    { key: 'superficie', label: 'Superficie (ha)' },
    { key: 'source_eau', label: 'Source d’eau' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
  ],
  fields: [
    { name: 'superficie', label: 'Superficie (ha)', type: 'number', step: '0.01' },
    { name: 'source_eau', label: 'Source d’eau', type: 'select', options: waterOptions },
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any' },
    { name: 'longitude', label: 'Longitude', type: 'number', step: 'any' },
  ],
}

export const plantConfig = {
  title: 'Plantes',
  description: 'Cultures et variétés enregistrées dans les champs',
  endpoint: '/api/plantes/',
  idKey: 'id_plante',
  columns: [
    { key: 'id_plante', label: 'ID' },
    { key: 'nom_plante', label: 'Culture' },
    { key: 'variete', label: 'Variété' },
    { key: 'date_plantation', label: 'Plantation' },
    { key: 'id_champ', label: 'Champ' },
  ],
  fields: [
    { name: 'nom_plante', label: 'Nom de la culture' },
    { name: 'variete', label: 'Variété' },
    { name: 'date_plantation', label: 'Date de plantation', type: 'date' },
    { name: 'id_champ', label: 'Champ', type: 'select', optionsEndpoint: '/api/champs/', optionValue: 'id_champ', optionLabel: 'id_champ' },
  ],
}

const journalConfig = {
  title: 'Journal agricole',
  description: 'Observations, stades de croissance, symptômes et maladies suspectées',
  endpoint: '/api/journal/',
  idKey: 'id_journal',
  columns: [
    { key: 'date_observation', label: 'Date' },
    { key: 'id_plante', label: 'Plante' },
    { key: 'stade_croissance', label: 'Stade' },
    { key: 'symptomes', label: 'Symptômes' },
    { key: 'maladie_suspecte', label: 'Maladie suspectée' },
  ],
  fields: [
    { name: 'id_plante', label: 'Plante', type: 'select', optionsEndpoint: '/api/plantes/', optionValue: 'id_plante', optionLabel: 'nom_plante' },
    { name: 'date_observation', label: 'Date', type: 'date' },
    { name: 'stade_croissance', label: 'Stade de croissance' },
    { name: 'symptomes', label: 'Symptômes' },
    { name: 'ravageur_suspecte', label: 'Ravageur suspecté' },
    { name: 'maladie_suspecte', label: 'Maladie suspectée' },
    { name: 'id_user', label: 'Utilisateur', type: 'select', optionsEndpoint: '/api/users/users/', optionValue: 'id_user', optionLabel: 'email' },
    { name: 'session_uuid', label: 'Identifiant session', defaultValue: 'dashboard' },
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', defaultValue: 0 },
    { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', defaultValue: 0 },
  ],
}

const diagnosticConfig = {
  title: 'Diagnostics',
  description: 'Résultats IA, maladies détectées, niveaux de confiance et recommandations',
  endpoint: '/api/diagnostic/',
  idKey: 'id_diagnostic',
  columns: [
    { key: 'id_diagnostic', label: 'ID' },
    { key: 'id_journal', label: 'Journal' },
    { key: 'maladie_detectee', label: 'Maladie' },
    { key: 'confiance', label: 'Confiance (%)' },
    { key: 'traitement_suggere', label: 'Recommandation' },
    { key: 'created_at', label: 'Date' },
  ],
  fields: [
    { name: 'maladie_detectee', label: 'Maladie détectée' },
    { name: 'confiance', label: 'Confiance (%)', type: 'number', step: '0.01' },
    { name: 'ravageur_detecte', label: 'Ravageur détecté', required: false },
    { name: 'traitement_suggere', label: 'Traitement suggéré', type: 'textarea', fullWidth: true, required: false },
    { name: 'source_github', label: 'Source', type: 'url', fullWidth: true, required: false },
  ],
  canCreate: true,
  createHref: '/analyser',
}

const soilConfig = {
  title: 'Études de sol',
  description: 'Résultats d’analyses chimiques et niveau de fertilité des sols',
  endpoint: '/api/etude-sol/',
  idKey: 'id_etude_sol',
  columns: [
    { key: 'date_analyse', label: 'Date' },
    { key: 'id_champ', label: 'Champ' },
    { key: 'type_sol', label: 'Type de sol' },
    { key: 'ph_sol', label: 'pH' },
    { key: 'fertilite', label: 'Fertilité' },
    { key: 'rapport_analyse', label: 'Rapport' },
  ],
  fields: [
    { name: 'id_champ', label: 'Champ', type: 'select', optionsEndpoint: '/api/champs/', optionValue: 'id_champ', optionLabel: 'id_champ' },
    { name: 'date_analyse', label: 'Date d’analyse', type: 'date' },
    { name: 'ph_sol', label: 'pH du sol' },
    { name: 'matiere_organique', label: 'Matière organique' },
    { name: 'azote', label: 'Azote' },
    { name: 'phosphore', label: 'Phosphore' },
    { name: 'potassium', label: 'Potassium' },
    { name: 'humidite', label: 'Humidité' },
    { name: 'type_sol', label: 'Type de sol' },
    { name: 'fertilite', label: 'Fertilité' },
    { name: 'rapport_analyse', label: 'Rapport d’analyse', type: 'textarea', fullWidth: true },
  ],
}

const userConfig = {
  title: 'Utilisateurs',
  description: 'Comptes, identités et rôles d’accès à la plateforme',
  endpoint: '/api/users/users/',
  idKey: 'id_user',
  columns: [
    { key: 'id_user', label: 'ID' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'nom', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'id_type', label: 'Rôle', render: row => row.id_type?.type ?? row.id_type ?? '—' },
    { key: 'created_at', label: 'Création' },
  ],
  fields: [
    { name: 'prenom', label: 'Prénom' },
    { name: 'nom', label: 'Nom', required: false },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Mot de passe', type: 'password', optionalOnEdit: true },
    { name: 'id_type', label: 'Rôle', type: 'select', optionsEndpoint: '/api/type-users/', optionValue: 'id_type', optionLabel: 'type' },
  ],
}

function readonly(config) {
  return <ResourceManager {...config} readOnly canCreate={false} canEdit={false} canDelete={false} />
}

export function AdminSection() {
  const slug = useLocation().pathname.split('/').filter(Boolean).at(-1)
  if (slug === 'users') return <ResourceManager {...userConfig} />
  if (slug === 'champs') return <ResourceManager {...champConfig} />
  if (slug === 'plantes') return <ResourceManager {...plantConfig} />
  if (slug === 'diagnostics') return <ResourceManager {...diagnosticConfig} />
  if (slug === 'etudes') return <ResourceManager {...soilConfig} />
  if (slug === 'carte') return <MapView />
  if (slug === 'rapports') return <ReportsView dashboardEndpoint="/api/DashboardAdmin/" />
  if (slug === 'settings') return <SettingsView />
  return <Navigate to="/dashboard/admin" replace />
}

export function MinisterSection() {
  const slug = useLocation().pathname.split('/').filter(Boolean).at(-1)
  if (slug === 'champs') return readonly(champConfig)
  if (slug === 'plantes') return readonly(plantConfig)
  if (slug === 'diagnostics') return readonly(diagnosticConfig)
  if (slug === 'etudes') return readonly(soilConfig)
  if (slug === 'carte') return <MapView />
  if (slug === 'rapports') return <ReportsView dashboardEndpoint="/api/DashboardMinister/" />
  return <Navigate to="/dashboard/ministere" replace />
}

export function FarmerSection() {
  const slug = useLocation().pathname.split('/').filter(Boolean).at(-1)
  if (slug === 'champs') return <ResourceManager {...champConfig} canDelete={false} />
  if (slug === 'plantes') return <ResourceManager {...plantConfig} canDelete={false} />
  if (slug === 'journal') return <ResourceManager {...journalConfig} canDelete={false} />
  if (slug === 'diagnostic') return readonly(diagnosticConfig)
  if (slug === 'carte') return <MapView title="Carte de mes observations" description="Localisation des observations enregistrées dans votre journal" />
  if (slug === 'profil') return <ProfileView />
  return <Navigate to="/dashboard/agriculteur" replace />
}
