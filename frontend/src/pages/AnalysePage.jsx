import { Link } from 'react-router-dom'
import { ArrowLeft, ScanLine } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
import TerrainAnalyzer from '../components/TerrainAnalyzer'

export default function AnalysePage() {
  return (
    <div className="min-h-screen bg-terra-bg dark:bg-[#0f1a0f]">
      <PublicNavbar />

      {/* Hero + Analyzer fusionnés */}
      <section className="relative overflow-hidden px-6 pt-28 pb-16
        bg-gradient-to-br from-terra-forest via-terra-medium to-terra-gold
        dark:from-[#0b1a0b] dark:via-terra-dark dark:to-terra-forest">

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-black/10 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto flex flex-col gap-6">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à l'accueil
          </Link>

          <div className="inline-flex w-fit items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/25">
            <ScanLine size={13} />
            Diagnostic IA · Gratuit
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.05] tracking-tight">
              Analysez votre terrain.
            </h1>
            <p className="text-white/70 text-sm mt-3">
              Déposez ou prenez une photo — résultat en quelques secondes.
            </p>
          </div>

          {/* TerrainAnalyzer directement dans le hero */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
            <TerrainAnalyzer />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-14 px-6 mx-6 my-10 rounded-3xl
        bg-gradient-to-r from-terra-forest to-terra-medium
        dark:from-terra-dark dark:to-terra-forest">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Vous voulez en savoir plus sur notre méthode ?
          </h2>
          <Link
            to="/comment"
            className="bg-terra-gold text-terra-dark font-extrabold px-7 py-3 rounded-xl text-sm hover:bg-[#e8b840] transition-colors"
          >
            Comment ça marche
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
