import PublicNavbar from '../components/PublicNavbar'
import TerrainAnalyzer from '../components/TerrainAnalyzer'
import { Leaf, BarChart2, ShieldCheck, Zap, ArrowDown } from 'lucide-react'

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

const STATS = [
  { v: '1 800+', l: 'Champs analysés' },
  { v: '4 200+', l: 'Plantes suivies' },
  { v: '286',    l: 'Agriculteurs actifs' },
  { v: '94%',    l: 'Précision IA' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-terra-bg dark:bg-[#0f1a0f]">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 bg-terra-forest/20 dark:bg-terra-forest/30 text-terra-forest dark:text-terra-light text-xs font-bold px-4 py-1.5 rounded-full border border-terra-medium/30">
            <span className="w-1.5 h-1.5 bg-terra-light rounded-full animate-pulse" />
            Diagnostic IA disponible gratuitement
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-terra-dark dark:text-[#e8f5e4] leading-tight tracking-tight">
            Vérifiez la santé de votre{' '}
            <span className="text-terra-forest dark:text-terra-light relative">
              terrain
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-terra-gold rounded-full opacity-70" />
            </span>{' '}
            avant d'acheter
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Prenez une photo du terrain qui vous intéresse. Notre intelligence artificielle
            analyse l'état du sol, détecte les maladies et vous donne un rapport de confiance
            en quelques secondes — gratuitement, sans inscription.
          </p>

          <a
            href="#analyse"
            className="flex items-center gap-2 bg-terra-dark text-terra-gold font-bold px-8 py-4 rounded-xl text-sm hover:bg-terra-forest transition-colors shadow-lg"
          >
            Analyser maintenant
            <ArrowDown size={16} />
          </a>

          {/* Stats band */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-6">
            {STATS.map(({ v, l }) => (
              <div
                key={l}
                className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 text-center shadow-sm"
              >
                <div className="text-2xl font-extrabold text-terra-dark dark:text-terra-gold">{v}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analyzer section */}
      <section id="analyse" className="py-20 px-6 bg-white dark:bg-terra-dark border-y border-terra-border dark:border-terra-forest">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-terra-dark dark:text-[#e8f5e4]">
              Analysez votre terrain
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Déposez ou sélectionnez une photo du terrain à analyser
            </p>
          </div>

          <TerrainAnalyzer />
        </div>
      </section>

      {/* How it works */}
      <section id="comment" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-terra-dark dark:text-[#e8f5e4]">
              Comment ça marche
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-xl mx-auto">
              Trois étapes simples pour protéger votre investissement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { step: '01', title: 'Prenez une photo', desc: 'Photographiez le terrain que vous envisagez d\'acheter — sol, végétation, état général.' },
              { step: '02', title: 'L\'IA analyse', desc: 'Notre modèle entraîné sur des milliers d\'images agricoles détecte les problèmes en temps réel.' },
              { step: '03', title: 'Obtenez le rapport', desc: 'Verdict clair (sain / problème détecté), niveau de confiance, et recommandations de traitement.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-2xl p-6 shadow-sm">
                <div className="text-5xl font-extrabold text-terra-border dark:text-terra-forest/40 absolute top-4 right-5 leading-none select-none">
                  {step}
                </div>
                <h3 className="font-bold text-terra-dark dark:text-[#e8f5e4] mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Features grid */}
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

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-terra-dark">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
          <div className="text-4xl">🌿</div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Agriculture intelligente<br />
            <span className="text-terra-gold">pour toute l'Afrique</span>
          </h2>
          <p className="text-terra-medium text-sm max-w-md leading-relaxed">
            AfroAgri connecte les agriculteurs, le Ministère de l'Agriculture et les porteurs
            de projets pour une gestion durable et éclairée des terres africaines.
          </p>
          <a
            href="#analyse"
            className="bg-terra-gold text-terra-dark font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#e8b840] transition-colors"
          >
            Analyser un terrain gratuitement
          </a>
          <p className="text-terra-medium/50 text-xs mt-2">
            © 2025 AfroAgri · Accès professionnel via le bouton Connexion
          </p>
        </div>
      </section>
    </div>
  )
}
