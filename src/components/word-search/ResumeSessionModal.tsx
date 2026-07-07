import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookOpen, Play, RotateCcw } from 'lucide-react';
import type { SavedGameState } from '@/hooks/useWordSearchGame';

interface ResumeSessionModalProps {
  open: boolean;
  saved: SavedGameState | null;
  onContinue: () => void;
  onRestart: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ResumeSessionModal = memo(({ open, saved, onContinue, onRestart }: ResumeSessionModalProps) => {
  if (!saved) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="pv-modal sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center pv-text-gold text-xl">
            <BookOpen className="h-5 w-5" />
            Palavra Viva
          </DialogTitle>
          <DialogDescription className="text-center pv-text-muted">
            Você possui uma jornada em andamento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="pv-modal-stats w-full">
            <div className="flex justify-between text-sm">
              <span className="pv-text-muted">Nível</span>
              <span className="font-bold text-white">{saved.level}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="pv-text-muted">Tempo restante</span>
              <span className="font-bold text-white">{formatTime(saved.timeLeft)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="pv-text-muted">Palavras encontradas</span>
              <span className="font-bold text-white">{saved.foundWords.length}/{saved.placements.length}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button onClick={onContinue} className="pv-btn-gold w-full gap-2">
              <Play className="h-4 w-4" />
              Continuar
            </button>
            <button onClick={onRestart} className="pv-pause-btn w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ResumeSessionModal.displayName = 'ResumeSessionModal';

export default ResumeSessionModal;
