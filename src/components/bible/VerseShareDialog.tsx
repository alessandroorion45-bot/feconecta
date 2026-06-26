import { useState, useEffect } from 'react';
import { Download, Copy, Check, Share } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { VerseImageGenerator } from './VerseImageGenerator';

interface VerseShareDialogProps {
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void;
}

const SHARE_PLATFORMS = [
  { name: 'WhatsApp', icon: '💬', color: 'bg-green-500', getUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}` },
  { name: 'Facebook', icon: '📘', color: 'bg-blue-600', getUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}` },
  { name: 'Twitter', icon: '🐦', color: 'bg-sky-500', getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` },
  { name: 'Telegram', icon: '✈️', color: 'bg-blue-400', getUrl: (text: string) => `https://t.me/share/url?text=${encodeURIComponent(text)}` },
];

export const VerseShareDialog = ({
  book,
  chapter,
  verse,
  verseText,
  open,
  onOpenChange,
  onShare,
}: VerseShareDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardXP } = useGamification(user?.id);
  const [copied, setCopied] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);

  const verseReference = `${book} ${chapter}:${verse}`;
  const shareText = `"${verseText}"\n\n${verseReference}\n\n✨ Compartilhado via Rede da Fé`;

  // Verificar se Web Share API está disponível
  useEffect(() => {
    setCanUseNativeShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  const recordShare = async (platform: string) => {
    if (!user) return;

    // @ts-ignore - Schema types not updated
    await supabase.from('verse_shares').insert({
      user_id: user.id,
      book,
      chapter,
      verse,
      verse_text: verseText,
      platform,
    });

    // Conceder XP por compartilhar
    await awardXP('verse_shared');

    onShare();
  };

  // 📱 Compartilhamento NATIVO (mobile)
  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      // Se tiver imagem, converter para Blob
      if (generatedImage) {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `${book}-${chapter}-${verse}.png`, { type: 'image/png' });

        await navigator.share({
          title: verseReference,
          text: shareText,
          files: [file],
        });
      } else {
        await navigator.share({
          title: verseReference,
          text: shareText,
        });
      }

      recordShare('native-share');
      toast({
        title: '✅ Compartilhado com sucesso!',
        description: '+10 XP',
        className: 'animate-in slide-in-from-top'
      });
      onOpenChange(false);
    } catch (error: any) {
      // Usuário cancelou o compartilhamento
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handlePlatformShare = (platform: typeof SHARE_PLATFORMS[0]) => {
    window.open(platform.getUrl(shareText), '_blank');
    recordShare(platform.name.toLowerCase());
    toast({
      title: `📤 Compartilhando no ${platform.name}`,
      description: '+10 XP',
      className: 'animate-in slide-in-from-top'
    });
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    recordShare('copy');
    toast({ title: 'Texto copiado!', description: '+10 XP' });
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `${book}-${chapter}-${verse}.png`;
    link.href = generatedImage;
    link.click();
    recordShare('download');
    toast({ title: 'Imagem baixada!', description: '+10 XP' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-modal max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Versículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 📱 COMPARTILHAMENTO NATIVO (mobile) */}
          {canUseNativeShare && (
            <Button
              onClick={handleNativeShare}
              size="lg"
              className="w-full gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg animate-pulse-glow"
            >
              <Share className="h-5 w-5" />
              Compartilhar Agora
              <span className="text-sm opacity-90">(WhatsApp, Instagram, etc)</span>
            </Button>
          )}

          {/* Imagem gerada */}
          <div className="theme-card p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Imagem Premium</h3>
            <VerseImageGenerator
              book={book}
              chapter={chapter}
              verse={verse}
              verseText={verseText}
              onGenerate={setGeneratedImage}
            />
          </div>

          {/* Botões de plataformas */}
          <div className="theme-card p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Compartilhar em</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SHARE_PLATFORMS.map((platform) => (
                <Button
                  key={platform.name}
                  onClick={() => handlePlatformShare(platform)}
                  className={`${platform.color} hover:opacity-90 gap-2`}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className="hidden sm:inline">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopyText}
              variant="outline"
              className="flex-1 gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Texto
                </>
              )}
            </Button>

            {generatedImage && (
              <Button
                onClick={handleDownloadImage}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Imagem
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
