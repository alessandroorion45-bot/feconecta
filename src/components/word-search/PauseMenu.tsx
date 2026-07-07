import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Home, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
}

const PauseMenu = memo(({ open, onResume }: PauseMenuProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pv-pause-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onResume}
        >
          {/* Partículas douradas discretas */}
          <div className="pv-pause-particles" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="pv-pause-particle"
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDelay: `${(i % 7) * 0.4}s`,
                  animationDuration: `${4 + (i % 5)}s`,
                }}
              />
            ))}
          </div>

          <motion.div
            className="pv-pause-menu"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pv-pause-icon">⏸</div>
            <h2 className="pv-pause-title">Jogo Pausado</h2>
            <p className="pv-pause-subtitle">Seu progresso está protegido.</p>

            <button onClick={onResume} className="pv-pause-btn pv-pause-btn-primary">
              <Play className="h-5 w-5" />
              <span>Continuar</span>
            </button>

            <Link to="/" className="pv-pause-btn">
              <Home className="h-5 w-5" />
              <span>Voltar ao início</span>
            </Link>

            <p className="pv-pause-save-note">
              <ShieldCheck className="h-3.5 w-3.5" />
              Progresso salvo automaticamente
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PauseMenu.displayName = 'PauseMenu';

export default PauseMenu;
