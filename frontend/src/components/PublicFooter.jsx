import { Link } from 'react-router-dom'

export default function PublicFooter() {
  return (
    <footer className="border-t border-terra-border dark:border-terra-forest/40 bg-white dark:bg-terra-dark px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="font-extrabold text-terra-dark dark:text-terra-gold text-sm tracking-tight">AfroAgri</span>
        </div>

        <nav className="flex items-center gap-6 text-xs font-medium text-terra-medium dark:text-terra-medium">
          <Link to="/analyser" className="hover:text-terra-forest dark:hover:text-terra-light transition-colors">
            Analyser un terrain
          </Link>
          <Link to="/comment" className="hover:text-terra-forest dark:hover:text-terra-light transition-colors">
            Comment ça marche
          </Link>
        </nav>

        <p className="text-xs text-terra-medium/60 dark:text-terra-medium/50">
          © 2026 AfroAgri
        </p>
      </div>
    </footer>
  )
}
