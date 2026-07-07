import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scroll, BookOpen } from 'lucide-react';
import BibleReferenceModal from '@/components/BibleReferenceModal';
import type { WordSearchTheme } from '@/lib/wordSearchThemes';

interface FragmentModalProps {
  open: boolean;
  theme: WordSearchTheme | null;
  onClose: () => void;
}

const FragmentModal = memo(({ open, theme, onClose }: FragmentModalProps) => {
  const [bibleOpen, setBibleOpen] = useState(false);

  if (!theme) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="pv-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center pv-text-gold text-lg">
              <Scroll className="h-5 w-5" />
              Fragmento Desbloqueado
            </DialogTitle>
            <DialogDescription className="text-center pv-text-muted">
              {theme.icon} {theme.label}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="pv-modal-verse">
              <p className="text-sm italic text-white/90 leading-relaxed">"{theme.verseText}"</p>
              <p className="text-xs pv-text-gold mt-2 text-right">— {theme.verseRef}</p>
            </div>

            {theme.character && (
              <p className="text-sm text-center pv-text-muted">
                Personagem central: <span className="text-white font-medium">{theme.character}</span>
              </p>
            )}

            <Button
              onClick={() => setBibleOpen(true)}
              className="pv-btn-gold w-full gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Ler capítulo completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BibleReferenceModal
        open={bibleOpen}
        onOpenChange={setBibleOpen}
        reference={theme.verseRef}
      />
    </>
  );
});

FragmentModal.displayName = 'FragmentModal';

export default FragmentModal;
