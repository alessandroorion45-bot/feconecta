import { memo, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { BookOpen, Play, RotateCcw, Trophy, HelpCircle, Sparkles, Flame, Star, ChevronRight } from 'lucide-react';
import WordSearchRanking from './WordSearchRanking';
import type { SavedGameState } from '@/hooks/useWordSearchGame';

interface WordSearchHomeProps {
  saved: SavedGameState | null;
  savedThemeLabel?: string;
  userId?: string | null;
  onStart: () => void;
  onContinue: () => void;
  onRestart: () => void;
}

// Entrada em sequência (revelação): cada elemento surge com leve slide-up.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Home de boas-vindas da rota /palavra-viva.
 * Primeira coisa que o jogador vê — decide continuar ou começar sem popup.
 * Sai com fade/blur suave ao entrar no jogo (o pai controla o unmount).
 */
const WordSearchHome = memo(({ saved, savedThemeLabel, userId, onStart, onContinue, onRestart }: WordSearchHomeProps) => {
  const [showRanking, setShowRanking] = useState(false);
  const [showHow, setShowHow] = useState(false);

  return (
    <motion.div
      className="pv-home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98, transition: { duration: 0.35, ease: 'easeIn' } }}
    >
      <motion.div className="pv-home-inner" variants={container} initial="hidden" animate="show">
        {/* Brasão: livro dourado num círculo com halo pulsando */}
        <motion.div variants={item} className="pv-home-crest-wrap">
          <motion.span
            className="pv-home-halo"
            aria-hidden
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          />
          <span className="pv-home-crest">
            <BookOpen className="h-9 w-9" />
          </span>
        </motion.div>

        {/* Título com glow */}
        <motion.h1 variants={item} className="pv-home-title">Caça-Palavras Bíblico</motion.h1>
        <motion.p variants={item} className="pv-home-subtitle">
          Cada palavra encontrada revela um versículo. Uma jornada pela Palavra, um nível de cada vez.
        </motion.p>

        {/* Card de progresso (se houver) OU começar do zero */}
        {saved ? (
          <motion.div variants={item} className="pv-home-card">
            <div className="pv-home-card-head">
              <span className="pv-home-card-badge"><Sparkles className="h-3.5 w-3.5" /> Jornada em andamento</span>
              {savedThemeLabel && <span className="pv-home-card-theme">{savedThemeLabel}</span>}
            </div>
            <div className="pv-home-card-stats">
              <div><span className="pv-home-stat-num">{saved.level}</span><span className="pv-home-stat-lbl">Nível</span></div>
              <div><span className="pv-home-stat-num pv-flex-center"><Star className="h-4 w-4" />{saved.score}</span><span className="pv-home-stat-lbl">Pontos</span></div>
              <div><span className="pv-home-stat-num pv-flex-center"><Flame className="h-4 w-4" />{saved.maxCombo}</span><span className="pv-home-stat-lbl">Sequência</span></div>
            </div>
            <button onClick={onContinue} className="pv-btn-gold w-full gap-2 mt-1">
              <Play className="h-5 w-5" /> Continuar jornada
            </button>
            <button onClick={onRestart} className="pv-home-restart">
              <RotateCcw className="h-3.5 w-3.5" /> Recomeçar do início
            </button>
          </motion.div>
        ) : (
          <motion.button variants={item} onClick={onStart} className="pv-btn-gold pv-home-start gap-2">
            <Play className="h-5 w-5" /> Começar jornada
          </motion.button>
        )}

        {/* Botões secundários discretos */}
        <motion.div variants={item} className="pv-home-secondary">
          <button onClick={() => { setShowRanking(v => !v); setShowHow(false); }} className={`pv-home-ghost ${showRanking ? 'is-active' : ''}`}>
            <Trophy className="h-4 w-4" /> Ver ranking
          </button>
          <button onClick={() => { setShowHow(v => !v); setShowRanking(false); }} className={`pv-home-ghost ${showHow ? 'is-active' : ''}`}>
            <HelpCircle className="h-4 w-4" /> Como jogar
          </button>
        </motion.div>

        {/* Painéis expansíveis */}
        <AnimatePresence mode="wait">
          {showHow && (
            <motion.div
              key="how"
              className="pv-home-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ul className="pv-home-how">
                <li><ChevronRight className="h-3.5 w-3.5" /> Arraste sobre as letras para formar as palavras da lista.</li>
                <li><ChevronRight className="h-3.5 w-3.5" /> Elas podem estar na horizontal, vertical e — nos níveis mais altos — nas diagonais e invertidas.</li>
                <li><ChevronRight className="h-3.5 w-3.5" /> Ache todas antes do tempo acabar. Cada personagem revela um versículo ao final.</li>
              </ul>
            </motion.div>
          )}
          {showRanking && (
            <motion.div
              key="ranking"
              className="pv-home-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <WordSearchRanking userId={userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});

WordSearchHome.displayName = 'WordSearchHome';

export default WordSearchHome;
