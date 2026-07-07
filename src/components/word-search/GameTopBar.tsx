import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Snowflake, Pause, Star, Flame } from 'lucide-react';
import { AvatarPro } from '@/components/AvatarPro';

interface GameTopBarProps {
  level: number;
  levelLabel: string;
  score: number;
  timeLeft: number;
  timerFrozen: boolean;
  foundCount: number;
  totalCount: number;
  combo: number;
  userId?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  onPause: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const GameTopBar = memo(({
  level,
  levelLabel,
  score,
  timeLeft,
  timerFrozen,
  foundCount,
  totalCount,
  combo,
  userId,
  userName,
  userAvatar,
  onPause,
}: GameTopBarProps) => {
  const stars = Math.min(level, 5);

  return (
    <div className="pv-top-bar">
      {/* Avatar + Title */}
      <div className="flex items-center gap-3">
        {userId && (
          <div className={combo >= 3 ? 'pv-avatar-combo-glow' : ''}>
            <AvatarPro src={userAvatar} name={userName} userId={userId} size="sm" clickable={false} />
          </div>
        )}
        <div className="flex flex-col items-start gap-1">
          <h1 className="pv-game-title">✝ Caça-Palavras Bíblico</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="pv-level-badge">
              Nível {level}
              <span className="pv-level-stars">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </span>
            </span>
            <span className="pv-text-muted text-xs">{levelLabel}</span>
            <span className="pv-score-badge">
              <Star className="h-3 w-3" />
              {score} pts
            </span>
          </div>
        </div>
      </div>

      {/* Right: Combo + Timer + Pause */}
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              key={combo}
              initial={{ scale: 0.5, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="pv-combo-badge"
            >
              <Flame className="h-3.5 w-3.5" />
              Combo x{combo}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`pv-timer ${timerFrozen ? 'pv-timer-frozen' : timeLeft <= 30 ? 'pv-timer-danger' : ''}`}>
          {timerFrozen ? <Snowflake className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
          <span className="font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
        </div>
        <button onClick={onPause} className="pv-pause-button" aria-label="Pausar jogo">
          <Pause className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="pv-progress-bar-container">
        <div
          className="pv-progress-bar-fill"
          style={{ width: `${totalCount > 0 ? (foundCount / totalCount) * 100 : 0}%` }}
        />
        <span className="pv-progress-label">{foundCount}/{totalCount}</span>
      </div>
    </div>
  );
});

GameTopBar.displayName = 'GameTopBar';

export default GameTopBar;
