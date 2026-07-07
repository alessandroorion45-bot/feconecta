import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trophy, ArrowRight, Star, Flame } from 'lucide-react';
import SpiritualTrail from './SpiritualTrail';

interface GameCompleteModalProps {
  open: boolean;
  level: number;
  score: number;
  verseText: string;
  verseRef: string;
  timeLeft: number;
  maxCombo: number;
  userId?: string | null;
  trailRefreshKey?: number;
  onNextLevel: () => void;
}

const MOTIVATIONAL_MESSAGES = [
  '🙏 Que a Palavra de Deus ilumine seus passos!',
  '✨ Você é uma bênção! Continue buscando a sabedoria divina.',
  '🕊️ A paz do Senhor esteja com você nesta jornada.',
  '💪 Forte e corajoso! Deus está contigo.',
  '🌟 Sua dedicação à Palavra é inspiradora!',
  '📖 Cada palavra encontrada é uma semente plantada no coração.',
  '🔥 O Espírito Santo guia sua jornada bíblica!',
  '💎 Mais precioso que ouro é o conhecimento da Palavra.',
];

const GameCompleteModal = memo(({
  open,
  level,
  score,
  verseText,
  verseRef,
  timeLeft,
  maxCombo,
  userId,
  trailRefreshKey,
  onNextLevel,
}: GameCompleteModalProps) => {
  const starCount = timeLeft > 60 ? 3 : timeLeft > 30 ? 2 : 1;
  const motivational = MOTIVATIONAL_MESSAGES[level % MOTIVATIONAL_MESSAGES.length];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="pv-modal sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center pv-text-gold text-xl">
            <Trophy className="h-6 w-6" />
            Fase Completa!
          </DialogTitle>
          <DialogDescription className="text-center pv-text-muted">
            Nível {level} concluído com sucesso!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Stars */}
          <div className="flex gap-2">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`h-10 w-10 transition-all duration-500 ${
                  star <= starCount
                    ? 'pv-text-gold fill-current'
                    : 'text-[hsl(220,30%,25%)]'
                }`}
              />
            ))}
          </div>

          {/* Score summary */}
          <div className="pv-modal-stats">
            <div className="flex justify-between text-sm">
              <span className="pv-text-muted">Pontuação</span>
              <span className="font-bold text-white">{score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="pv-text-muted">Tempo restante</span>
              <span className="font-bold text-white">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            {maxCombo > 1 && (
              <div className="flex justify-between text-sm">
                <span className="pv-text-muted flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> Maior combo</span>
                <span className="font-bold text-white">x{maxCombo}</span>
              </div>
            )}
          </div>

          {/* Motivational message */}
          <p className="text-center text-sm pv-text-gold font-medium">{motivational}</p>

          {/* Verse */}
          {verseText && (
            <div className="pv-modal-verse">
              <p className="text-sm italic text-white/90 leading-relaxed">"{verseText}"</p>
              <p className="text-xs pv-text-gold mt-2 text-right">— {verseRef}</p>
            </div>
          )}

          <SpiritualTrail userId={userId} refreshKey={trailRefreshKey} />

          {/* Next level button */}
          <button onClick={onNextLevel} className="pv-btn-gold w-full gap-2">
            <ArrowRight className="h-5 w-5" />
            Próximo Nível
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

GameCompleteModal.displayName = 'GameCompleteModal';

export default GameCompleteModal;
