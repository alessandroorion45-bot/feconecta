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
  const theme = themes[currentTheme];

  useEffect(() => {
    generateImage();
  }, [verseText, currentTheme]);

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    const tokens = theme.designTokens;

    // Fundo com gradiente
    if (tokens.background.includes('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, theme.colors.primary);
      gradient.addColorStop(0.5, theme.colors.secondary);
      gradient.addColorStop(1, theme.colors.accent);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = tokens.background;
    }
    ctx.fillRect(0, 0, width, height);

    // Overlay sutil
    ctx.fillStyle = tokens.glassMorphism || 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Moldura decorativa
    ctx.strokeStyle = tokens.borderHover;
    ctx.lineWidth = 8;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Referência no topo
    ctx.fillStyle = tokens.text;
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    const reference = `${book} ${chapter}:${verse}`;
    ctx.fillText(reference, width / 2, 180);

    // Linha decorativa
    ctx.strokeStyle = tokens.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, 220);
    ctx.lineTo(width / 2 + 150, 220);
    ctx.stroke();

    // Texto do versículo (quebra em múltiplas linhas)
    ctx.fillStyle = tokens.text;
    ctx.font = '36px serif';
    ctx.textAlign = 'center';

    const maxWidth = width - 240;
    const lineHeight = 55;
    const words = verseText.split(' ');
    let line = '';
    let y = 350;

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

    // Logo/marca d'água no rodapé
    ctx.fillStyle = tokens.textSecondary;
    ctx.font = 'italic 32px serif';
    ctx.fillText('✨ Rede da Fé', width / 2, height - 120);

    // Elemento decorativo (baseado no tema)
    if (theme.tier === 'platinum' || theme.tier === 'gold') {
      // Adicionar estrelas ou sparkles
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 4 + 2;

        ctx.fillStyle = tokens.glow;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Gerar data URL
    const dataUrl = canvas.toDataURL('image/png');
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
