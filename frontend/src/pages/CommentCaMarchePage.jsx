import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Leaf, BarChart2, ShieldCheck, Zap } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'

const STEPS = [
  { step: '01', title: 'Prenez une photo', desc: 'Photographiez le terrain que vous envisagez d\'acheter — sol, végétation, état général.' },
  { step: '02', title: 'L\'IA analyse', desc: 'Notre modèle entraîné sur des milliers d\'images agricoles détecte les problèmes en temps réel.' },
  { step: '03', title: 'Obtenez le rapport', desc: 'Verdict clair (sain / problème détecté), niveau de confiance, et recommandations de traitement.' },
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

export default function CommentCaMarchePage() {
  return (
    <div className="min-h-screen bg-terra-bg dark:bg-[#0f1a0f]">
      <PublicNavbar />

      {/* Hero — gradient */}
      <section className="relative overflow-hidden flex items-end px-6 pb-16 pt-28
        bg-gradient-to-br from-terra-forest via-terra-medium to-terra-gold
        dark:from-[#0b1a0b] dark:via-terra-dark dark:to-terra-forest">

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-black/10 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full flex flex-col gap-5">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à l'accueil
          </Link>

          <div className="inline-flex w-fit items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/25">
            <span className="w-1.5 h-1.5 bg-terra-gold rounded-full" />
            Simple · Rapide · Précis
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight max-w-2xl">
            Comment ça marche.
          </h1>

          <p className="text-white/75 text-base max-w-lg leading-relaxed">
            Trois étapes simples pour analyser votre terrain et protéger votre investissement.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6 bg-white dark:bg-terra-dark border-b border-terra-border dark:border-terra-forest">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="relative bg-terra-bg dark:bg-[#0f1a0f] border border-terra-border dark:border-terra-forest rounded-2xl p-6">
              <div className="text-5xl font-extrabold text-terra-border dark:text-terra-forest/40 absolute top-4 right-5 leading-none select-none">
                {step}
              </div>
              <h3 className="font-bold text-terra-dark dark:text-[#e8f5e4] mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-extrabold text-terra-dark dark:text-[#e8f5e4]">
              Ce que vous obtenez
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Un diagnostic complet basé sur l'intelligence artificielle.
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
      <section className="py-14 px-6 mx-6 mb-10 rounded-3xl
        bg-gradient-to-r from-terra-forest to-terra-medium
        dark:from-terra-dark dark:to-terra-forest">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Prêt à analyser votre terrain ?
          </h2>
          <p className="text-white/70 text-sm">Gratuit, sans inscription. Résultat en quelques secondes.</p>
          <Link
            to="/analyser"
            className="inline-flex items-center gap-2 bg-terra-gold text-terra-dark font-extrabold px-7 py-3 rounded-xl text-sm hover:bg-[#e8b840] transition-colors"
          >
            Commencer l'analyse
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
