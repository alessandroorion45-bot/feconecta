import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { CHESTS, type ChestTier } from '@/lib/wordSearchChests';
import { cn } from '@/lib/utils';

interface ChestRevealProps {
  open: boolean;
  tier: ChestTier | null;
  xpEarned: number;
  hasFragment: boolean;
  onClose: () => void;
}

export const ChestReveal = memo(({ open, tier, xpEarned, hasFragment, onClose }: ChestRevealProps) => {
  const config = tier ? CHESTS[tier] : null;

  return (
    <AnimatePresence>
      {open && config && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex flex-col items-center gap-4 px-8 py-10 rounded-3xl pv-modal max-w-xs mx-4"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className={cn(
                'flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br shadow-2xl text-6xl',
                config.color
              )}
              initial={{ rotate: -8, scale: 0.8 }}
              animate={{ rotate: [0, -6, 6, -3, 3, 0], scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              {config.icon}
            </motion.div>

            <h3 className="pv-text-gold text-lg font-bold text-center">{config.label}</h3>

            <div className="flex flex-col items-center gap-1 text-center">
              <span className="flex items-center gap-1 text-white text-sm font-medium">
                <Sparkles className="h-4 w-4 pv-text-gold" />
                +{xpEarned} XP bônus
              </span>
              {hasFragment && (
                <span className="text-xs pv-text-muted">📜 Um fragmento bíblico foi revelado!</span>
              )}
            </div>

            <button onClick={onClose} className="pv-btn-gold w-full mt-2">
              Continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ChestReveal.displayName = 'ChestReveal';

export default ChestReveal;
