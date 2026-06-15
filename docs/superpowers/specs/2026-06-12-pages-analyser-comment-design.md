# Design : Pages dédiées Analyser & Comment ça Marche

**Date :** 2026-06-12  
**Statut :** Approuvé

## Contexte

Les sections "Analysez Votre Terrain" et "Comment ça Marche" sont actuellement intégrées directement dans `LandingPage.jsx`. L'objectif est de les extraire en pages dédiées accessibles via des routes publiques distinctes.

## Objectif

- Créer deux pages publiques indépendantes pour ces sections
- Mettre à jour la navigation pour pointer vers ces pages
- Alléger la Landing Page

## Routes

| Route | Composant | Description |
|-------|-----------|-------------|
| `/analyser` | `AnalysePage.jsx` | Section d'analyse de terrain avec TerrainAnalyzer |
| `/comment` | `CommentCaMarchePage.jsx` | Section "Comment ça Marche" avec étapes + features |

## Fichiers à créer

### `src/pages/AnalysePage.jsx`
- Contient `PublicNavbar`
- Reprend exactement la section `#analyse` de LandingPage (titre, sous-titre, `TerrainAnalyzer`)
- Page publique (pas de ProtectedRoute)

### `src/pages/CommentCaMarchePage.jsx`
- Contient `PublicNavbar`
- Reprend exactement la section `#comment` de LandingPage (3 étapes + grille de 4 features)
- Les constantes `FEATURES` et les étapes sont déplacées ici
- Page publique (pas de ProtectedRoute)

## Fichiers à modifier

### `LandingPage.jsx`
- Supprimer la section `id="analyse"` (TerrainAnalyzer)
- Supprimer la section `id="comment"` (Comment ça marche + features)
- Supprimer l'import `TerrainAnalyzer`
- Supprimer les icônes `Leaf, BarChart2, ShieldCheck, Zap` (plus utilisées)
- Supprimer la constante `FEATURES`
- Mettre à jour le lien footer CTA de `#analyse` vers `/analyser`

### `App.jsx`
- Ajouter `<Route path="/analyser" element={<AnalysePage />} />`
- Ajouter `<Route path="/comment" element={<CommentCaMarchePage />} />`

### `PublicNavbar.jsx`
- Remplacer `<a href="#analyse">` par `<Link to="/analyser">`
- Remplacer `<a href="#comment">` par `<Link to="/comment">`
- Ajouter l'import `Link` depuis `react-router-dom`
