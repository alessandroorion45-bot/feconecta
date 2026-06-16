import { memo } from 'react';
import { Timer, Snowflake, Pause, Star } from 'lucide-react';

interface GameTopBarProps {
  level: number;
  levelLabel: string;
  score: number;
  timeLeft: number;
  timerFrozen: boolean;
  foundCount: number;
  totalCount: number;
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
  onPause,
}: GameTopBarProps) => {
  const stars = Math.min(level, 5);

  return (
    <div className="pv-top-bar">
      {/* Title */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="pv-game-title">✝ Caça-Palavras Bíblico</h1>
        <div className="flex items-center gap-2 flex-wrap justify-center">
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

      {/* Right: Timer + Pause */}
      <div className="flex items-center gap-2">
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
