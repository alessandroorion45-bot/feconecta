/**
 * BARRA DE PROGRESSO DE NÍVEL
 *
 * Mostra o progresso do usuário para o próximo nível
 * Usado no perfil e no header
 */

import { useGamification } from '@/hooks/useGamification';
import { getTitleIcon, getLevelColor, formatLargeNumber } from '@/lib/gamification';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface LevelProgressBarProps {
  userId: string;
  compact?: boolean; // versão compacta para header
}

export function LevelProgressBar({ userId, compact = false }: LevelProgressBarProps) {
  const { userStats, loading, getNextLevelInfo } = useGamification(userId);

  if (loading) {
    return <Skeleton className={compact ? "h-12 w-full" : "h-20 w-full"} />;
  }

  if (!userStats) return null;

  const nextLevel = getNextLevelInfo();
  if (!nextLevel) return null;

  const { currentLevel, nextLevel: next, currentXP, xpForNext, xpRemaining, progressPercent } = nextLevel;
  const titleIcon = getTitleIcon(userStats.title);
  const levelColor = getLevelColor(userStats.title);

  if (compact) {
    // Versão compacta para header
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-lg">{titleIcon}</span>
          <span className={`text-sm font-bold ${levelColor}`}>
            Nv {currentLevel}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <Progress value={progressPercent} className="h-2" />
        </div>

        <span className="text-xs text-muted-foreground shrink-0">
          {progressPercent}%
        </span>
      </div>
    );
  }

  // Versão completa para perfil
  return (
    <div className="space-y-2">
      {/* Header com título e nível */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{titleIcon}</span>
          <div>
            <h3 className={`font-bold ${levelColor}`}>{userStats.title}</h3>
            <p className="text-sm text-muted-foreground">
              Nível {currentLevel}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium">
            {formatLargeNumber(currentXP)} XP
          </p>
          <p className="text-xs text-muted-foreground">
            Total
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1">
        <Progress value={progressPercent} className="h-3" />

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {formatLargeNumber(currentXP)} / {formatLargeNumber(xpForNext)} XP
          </span>
          <span className="font-medium">
            {formatLargeNumber(xpRemaining)} XP para Nv {next}
          </span>
        </div>
      </div>

      {/* Stats adicionais */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span>🔥</span>
          <span className="font-medium">{userStats.current_streak}</span>
          <span className="text-muted-foreground">dias</span>
        </div>

        <div className="flex items-center gap-1">
          <span>🏆</span>
          <span className="font-medium">{userStats.total_achievements}</span>
          <span className="text-muted-foreground">conquistas</span>
        </div>

        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span className="font-medium">{formatLargeNumber(userStats.final_score)}</span>
          <span className="text-muted-foreground">pontos</span>
        </div>
      </div>
    </div>
  );
}
