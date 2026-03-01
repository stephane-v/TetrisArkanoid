import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080818] text-white overflow-x-hidden">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e1040_0%,_#080818_70%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-900/30 border border-violet-700/40 rounded-full px-4 py-1.5 text-violet-300 text-sm mb-6">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            Outils gratuits de bien-être
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent leading-tight">
            Stimulation Bilatérale Alternée
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Outils gratuits de bien-être basés sur les neurosciences
          </p>
        </header>

        {/* Explanation Section */}
        <section className="mb-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-violet-300 mb-4">Qu'est-ce que la SBA ?</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            La <strong className="text-white">Stimulation Bilatérale Alternée (SBA)</strong> consiste à alterner des stimuli
            sensoriels entre le côté gauche et le côté droit du corps — sons, mouvements oculaires ou tapotements.
            Cette technique est au cœur de l'<strong className="text-white">EMDR</strong> (<em>Eye Movement Desensitization
            and Reprocessing</em>), développé par <strong className="text-white">Francine Shapiro en 1987</strong>.
          </p>
          <p className="text-slate-300 leading-relaxed mb-4">
            Des études menées par les universités d'<strong className="text-white">Oxford</strong> et
            du <strong className="text-white">Karolinska Institutet</strong> ont montré que jouer à Tetris peu
            après un événement stressant réduit significativement les intrus visuels traumatiques, en occupant
            les circuits de mémoire visuelle impliqués dans leur formation.
          </p>
          {/* Disclaimer */}
          <div className="flex gap-3 mt-5 bg-amber-950/40 border border-amber-700/40 rounded-xl p-4">
            <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              Ces outils sont proposés à titre de soutien au bien-être quotidien et ne remplacent en aucun cas
              un suivi thérapeutique. Pour un accompagnement EMDR ou trauma, consultez un professionnel de santé agréé.
            </p>
          </div>
        </section>

        {/* Tool Cards */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-slate-300 mb-6 text-center">Choisissez votre outil</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* SBA Audio Card */}
            <button
              onClick={() => navigate('/audio')}
              className="group text-left bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-700/50 rounded-2xl p-7 hover:border-violet-500/70 hover:from-violet-900/60 hover:to-indigo-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-900/20 hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎧</span>
                <h3 className="text-xl font-bold text-white group-hover:text-violet-200 transition-colors">
                  SBA Audio
                </h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Stimulation bilatérale par sons alternés gauche/droite. 4 types de sons, presets, timer.
                <strong className="text-slate-300"> Casque requis.</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {['Click doux', 'Tonalité pure', 'Goutte d\'eau', 'Bol tibétain'].map(s => (
                  <span key={s} className="text-xs bg-violet-900/50 text-violet-300 border border-violet-700/40 rounded-full px-2.5 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-violet-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                Démarrer <span className="text-base">→</span>
              </div>
            </button>

            {/* TetriKanoid Card */}
            <button
              onClick={() => navigate('/game')}
              className="group text-left bg-gradient-to-br from-cyan-900/40 to-blue-900/30 border border-cyan-700/50 rounded-2xl p-7 hover:border-cyan-500/70 hover:from-cyan-900/60 hover:to-blue-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/20 hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎮</span>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                  TetriKanoid
                </h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Jeu thérapeutique Tetris/Arkanoid avec stimulation bilatérale audio intégrée.
                <strong className="text-slate-300"> Validé par la recherche.</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {['Tetris + Arkanoid', 'SBA intégrée', 'Multi-mode', 'Niveaux'].map(s => (
                  <span key={s} className="text-xs bg-cyan-900/50 text-cyan-300 border border-cyan-700/40 rounded-full px-2.5 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-cyan-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                Jouer <span className="text-base">→</span>
              </div>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-slate-600 text-sm border-t border-slate-800/60 pt-8">
          <p>
            Un outil gratuit by{' '}
            <a
              href="https://andragia.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              Andragia — IA &amp; Formation
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};
