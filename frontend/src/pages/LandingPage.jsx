import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, ShieldCheck, BarChart2, Leaf, ScanLine } from 'lucide-react'

const STATS = [
  { v: '1 800+', l: 'Champs analysés' },
  { v: '4 200+', l: 'Plantes suivies' },
  { v: '286',    l: 'Agriculteurs actifs' },
  { v: '94%',    l: 'Précision IA' },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Analyse IA instantanée',
    desc: 'Notre modèle analyse la photo de votre terrain en quelques secondes et détecte les problèmes potentiels.',
  },
  {
    icon: ShieldCheck,
    title: 'Investissement sécurisé',
    desc: 'Avant d\'acheter, vérifiez l\'état sanitaire du sol et obtenez un rapport de confiance chiffré.',
  },
  {
    icon: BarChart2,
    title: 'Données agricoles nationales',
    desc: 'Accédez aux statistiques de santé des terres agricoles à l\'échelle nationale.',
  },
  {
    icon: Leaf,
    title: 'Recommandations de traitement',
    desc: 'Si un problème est détecté, l\'IA propose des traitements adaptés basés sur des sources scientifiques.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-terra-bg dark:bg-[#0f1a0f]">
      <PublicNavbar />

      {/* Hero — gradient */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center px-6
        bg-gradient-to-br from-terra-forest via-terra-medium to-terra-gold
        dark:from-[#0b1a0b] dark:via-terra-dark dark:to-terra-forest">

        {/* Subtle decorative circle */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 -left-24 w-[320px] h-[320px] rounded-full bg-black/10 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full pt-28 pb-20 flex flex-col gap-7">
          {/* Badge */}
          <div className="inline-flex w-fit items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/25">
            <span className="w-1.5 h-1.5 bg-terra-gold rounded-full animate-pulse" />
            Plateforme agricole africaine · IA gratuite
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight max-w-2xl">
            Vérifiez la santé de votre terrain avant d'acheter.
          </h1>

          {/* Subtitle */}
          <p className="text-white/75 text-lg max-w-xl leading-relaxed">
            Une photo suffit. Notre IA analyse le sol, détecte les maladies et vous donne
            un rapport de confiance en quelques secondes — gratuitement, sans inscription.
          </p>

          {/* CTA */}
          <Link
            to="/analyser"
            className="inline-flex w-fit items-center gap-2 bg-terra-gold text-terra-dark font-extrabold px-8 py-4 rounded-xl text-sm hover:bg-[#e8b840] transition-colors shadow-xl"
          >
            <ScanLine size={17} />
            Analyser mon terrain
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Stats band */}
      <section className="py-12 px-6 bg-white dark:bg-terra-dark border-b border-terra-border dark:border-terra-forest">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ v, l }) => (
            <div key={l}>
              <div className="text-3xl font-extrabold text-terra-dark dark:text-terra-gold">{v}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold text-terra-dark dark:text-[#e8f5e4]">
              Pourquoi AfroAgri ?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Une plateforme pensée pour les agriculteurs et porteurs de projets africains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-2xl p-5 shadow-sm"
              >
                <div className="w-10 h-10 bg-terra-forest/15 dark:bg-terra-forest/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-terra-forest dark:text-terra-light" />
                </div>
                <div>
                  <h4 className="font-bold text-terra-dark dark:text-[#e8f5e4] text-sm mb-1">{title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-16 px-6 mx-6 mb-10 rounded-3xl
        bg-gradient-to-r from-terra-forest to-terra-medium
        dark:from-terra-dark dark:to-terra-forest">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Prêt à analyser votre terrain ?
          </h2>
          <p className="text-white/70 text-sm max-w-md leading-relaxed">
            Gratuit, sans inscription. Résultat en quelques secondes.
          </p>
          <Link
            to="/analyser"
            className="bg-terra-gold text-terra-dark font-extrabold px-8 py-3 rounded-xl text-sm hover:bg-[#e8b840] transition-colors"
          >
            Commencer l'analyse
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
