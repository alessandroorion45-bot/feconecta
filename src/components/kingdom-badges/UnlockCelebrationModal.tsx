import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import KingdomBadge, { BadgeRarity, RARITY_STYLES } from "./KingdomBadge";

interface UnlockedBadge {
  name: string;
  description: string;
  rarity: BadgeRarity | string;
  rarityColors?: { corInicio: string; corFim: string } | null;
  icon?: React.ReactNode;
  imageUrl?: string | null;
  emoji?: string;
  verseReference?: string | null;
}

interface UnlockCelebrationModalProps {
  badge: UnlockedBadge | null;
  onClose: () => void;
}

const UnlockCelebrationModal = ({ badge, onClose }: UnlockCelebrationModalProps) => {
  const baseStyle = badge ? (RARITY_STYLES[badge.rarity as BadgeRarity] ?? RARITY_STYLES.common) : null;
  const style = badge?.rarityColors && baseStyle
    ? { ...baseStyle, particleColor: badge.rarityColors.corInicio, label: baseStyle.label }
    : baseStyle;

  return (
    <AnimatePresence>
      {badge && style && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* explosão dourada */}
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{ width: 4, height: 4, backgroundColor: style.particleColor, boxShadow: `0 0 8px ${style.particleColor}` }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * (typeof window !== "undefined" ? window.innerWidth * 0.7 : 600),
                y: (Math.random() - 0.5) * (typeof window !== "undefined" ? window.innerHeight * 0.6 : 500),
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1.6, delay: i * 0.015, ease: "easeOut" }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 max-w-sm rounded-2xl border border-amber-400/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-8 text-center shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-white/50 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-semibold uppercase tracking-widest text-amber-300 mb-4"
            >
              Parabéns!
            </motion.p>

            <div className="flex justify-center mb-5">
              <KingdomBadge rarity={badge.rarity} rarityColors={badge.rarityColors} icon={badge.icon} imageUrl={badge.imageUrl} emoji={badge.emoji} size="lg" />
            </div>

            <h2 className="text-xl font-bold text-white mb-1">{badge.name}</h2>
            <p className="text-xs font-medium mb-3" style={{ color: style.particleColor }}>
              {style.label}
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-3">{badge.description}</p>
            {badge.verseReference && (
              <p className="text-xs italic text-amber-200/70">— {badge.verseReference}</p>
            )}

            <p className="mt-5 text-sm text-white/90">Você desbloqueou um novo Selo Kingdom.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnlockCelebrationModal;
