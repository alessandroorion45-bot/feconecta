import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { themes } from '@/lib/themes';

interface VerseImageGeneratorProps {
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  onGenerate: (imageDataUrl: string) => void;
}

export const VerseImageGenerator = ({
  book,
  chapter,
  verse,
  verseText,
  onGenerate,
}: VerseImageGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTheme } = useTheme();
  // @ts-ignore - Theme type compatibility
  const theme = themes[currentTheme] || themes['default'];

  useEffect(() => {
    generateImage();
  }, [verseText, currentTheme]);

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 📱 FORMATO 9:16 (Stories/Reels) - 1080x1920
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const tokens = theme.designTokens;

    // Fundo com gradiente vertical (mais dramático)
    if (tokens.background.includes('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, theme.colors.primary);
      gradient.addColorStop(0.4, theme.colors.secondary);
      gradient.addColorStop(1, theme.colors.accent);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = tokens.background;
    }
    ctx.fillRect(0, 0, width, height);

    // Overlay sutil
    ctx.fillStyle = tokens.glassMorphism || 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Elemento decorativo (baseado no tema) - NO FUNDO
    if (theme.tier === 'platinum' || theme.tier === 'gold') {
      // Adicionar estrelas ou sparkles
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 6 + 2;

        ctx.fillStyle = tokens.glow;
        ctx.globalAlpha = Math.random() * 0.4 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Moldura decorativa (mais estreita)
    ctx.strokeStyle = tokens.borderHover;
    ctx.lineWidth = 6;
    ctx.strokeRect(50, 100, width - 100, height - 200);

    // Referência no topo (maior e mais destacada)
    ctx.fillStyle = tokens.text;
    ctx.font = 'bold 56px serif';
    ctx.textAlign = 'center';
    const reference = `${book} ${chapter}:${verse}`;
    ctx.fillText(reference, width / 2, 250);

    // Linha decorativa
    ctx.strokeStyle = tokens.glow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 300);
    ctx.lineTo(width / 2 + 200, 300);
    ctx.stroke();

    // Texto do versículo (centralizado verticalmente)
    ctx.fillStyle = tokens.text;
    ctx.font = 'bold 42px serif';
    ctx.textAlign = 'center';

    const maxWidth = width - 200;
    const lineHeight = 65;
    const words = verseText.split(' ');
    let line = '';
    let y = height / 2 - 100; // Centralizado

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);

    // Logo/marca d'água no rodapé (maior)
    ctx.fillStyle = tokens.textSecondary;
    ctx.font = 'italic 38px serif';
    ctx.fillText('✨ Rede da Fé', width / 2, height - 150);

    ctx.font = '28px sans-serif';
    ctx.fillText('Baixe o app e fortaleça sua fé!', width / 2, height - 100);

    // Gerar data URL em alta qualidade
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    onGenerate(dataUrl);
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg border theme-card shadow-lg"
        style={{ maxHeight: '400px', objectFit: 'contain' }}
      />
      <p className="text-xs text-muted-foreground text-center">
        Imagem gerada com o tema <strong>{theme.name}</strong>
      </p>
    </div>
  );
};
