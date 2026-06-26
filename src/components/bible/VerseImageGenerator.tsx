import { useEffect, useRef, useState } from 'react';
import { VERSE_IMAGE_THEMES, getThemeById, type VerseImageTheme } from '@/lib/verseImageThemes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Download, Sparkles } from 'lucide-react';

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
  const [selectedTheme, setSelectedTheme] = useState<string>('dark-royal');
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    generateImage();
  }, [verseText, selectedTheme]);

  const drawDecoration = (ctx: CanvasRenderingContext2D, theme: VerseImageTheme, width: number, height: number) => {
    ctx.globalAlpha = 0.3;

    switch (theme.decorationStyle) {
      case 'stars':
        // Estrelas espalhadas
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 4 + 2;
          ctx.fillStyle = theme.glowColor;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'particles':
        // Partículas flutuantes
        for (let i = 0; i < 60; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 6 + 1;
          ctx.fillStyle = theme.accentColor;
          ctx.fillRect(x, y, size, size);
        }
        break;

      case 'rays':
        // Raios de luz
        ctx.strokeStyle = theme.glowColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12;
          ctx.beginPath();
          ctx.moveTo(width / 2, height / 2);
          ctx.lineTo(width / 2 + Math.cos(angle) * width, height / 2 + Math.sin(angle) * height);
          ctx.stroke();
        }
        break;

      case 'waves':
        // Ondas suaves
        ctx.strokeStyle = theme.accentColor;
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          for (let x = 0; x < width; x += 10) {
            const y = height / 2 + Math.sin((x + i * 100) / 50) * 100;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;

      case 'geometric':
        // Formas geométricas
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 80 + 20;
          ctx.strokeStyle = theme.borderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, size, size);
        }
        break;

      case 'floral':
        // Elementos florais (círculos concêntricos)
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          ctx.strokeStyle = theme.accentColor;
          ctx.lineWidth = 1;
          for (let r = 10; r < 50; r += 10) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        break;

      case 'crystals':
        // Cristais (triângulos)
        for (let i = 0; i < 25; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 40 + 20;
          ctx.fillStyle = theme.glowColor;
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x - size, y + size);
          ctx.lineTo(x + size, y + size);
          ctx.closePath();
          ctx.fill();
        }
        break;

      case 'mountains':
        // Montanhas (triângulos maiores no fundo)
        for (let i = 0; i < 5; i++) {
          const x = (i * width) / 4;
          const y = height - 200;
          const size = 150 + Math.random() * 100;
          ctx.fillStyle = theme.accentColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - size, height);
          ctx.lineTo(x + size, height);
          ctx.closePath();
          ctx.fill();
        }
        break;
    }

    ctx.globalAlpha = 1;
  };

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = getThemeById(selectedTheme);

    // 📱 FORMATO 9:16 (Stories/Reels) - 1080x1920
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Fundo com gradiente vertical
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.gradientStart);
    gradient.addColorStop(0.5, theme.gradientMid);
    gradient.addColorStop(1, theme.gradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decoração de fundo
    drawDecoration(ctx, theme, width, height);

    // Moldura decorativa
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(60, 120, width - 120, height - 240);

    // Referência no topo
    ctx.fillStyle = theme.textColor;
    ctx.font = `${theme.fontWeight} 60px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    const reference = `${book} ${chapter}:${verse}`;
    ctx.fillText(reference, width / 2, 280);

    // Linha decorativa
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 220, 340);
    ctx.lineTo(width / 2 + 220, 340);
    ctx.stroke();

    // Texto do versículo (centralizado verticalmente)
    ctx.fillStyle = theme.textColor;
    ctx.font = `${theme.fontWeight} 46px ${theme.fontFamily}`;
    ctx.textAlign = 'center';

    const maxWidth = width - 220;
    const lineHeight = 72;
    const words = verseText.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Calcular Y inicial para centralizar verticalmente
    const totalHeight = lines.length * lineHeight;
    let y = height / 2 - totalHeight / 2 + 100;

    lines.forEach(textLine => {
      ctx.fillText(textLine, width / 2, y);
      y += lineHeight;
    });

    // Logo/marca d'água no rodapé
    ctx.fillStyle = theme.secondaryTextColor;
    ctx.font = `italic 42px ${theme.fontFamily}`;
    ctx.fillText('✨ Aliança', width / 2, height - 180);

    ctx.font = '32px sans-serif';
    ctx.fillText('Fortaleça sua fé diariamente', width / 2, height - 120);

    // Gerar data URL em alta qualidade
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setImageUrl(dataUrl);
    onGenerate(dataUrl);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `${book}-${chapter}-${verse}-${selectedTheme}.png`;
    link.href = imageUrl;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Preview da imagem */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-lg border theme-card shadow-lg"
          style={{ maxHeight: '500px', objectFit: 'contain' }}
        />
        <Button
          onClick={handleDownload}
          size="sm"
          className="absolute top-3 right-3 gap-2 bg-black/50 hover:bg-black/70 text-white"
        >
          <Download className="h-4 w-4" />
          Baixar
        </Button>
      </div>

      {/* Seletor de temas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Escolha o Tema Premium</h3>
        </div>

        <Tabs value={selectedTheme} onValueChange={setSelectedTheme} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-2 bg-transparent">
            {VERSE_IMAGE_THEMES.map((theme) => (
              <TabsTrigger
                key={theme.id}
                value={theme.id}
                className="flex-col h-auto py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                title={theme.description}
              >
                <Sparkles className="h-4 w-4 mb-1" />
                <span className="text-xs font-semibold text-center leading-tight">
                  {theme.name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {VERSE_IMAGE_THEMES.map((theme) => (
            <TabsContent key={theme.id} value={theme.id} className="mt-3">
              <div className="theme-card p-4 rounded-lg">
                <h4 className="font-bold mb-1">{theme.name}</h4>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Imagem gerada em alta resolução (1080x1920px) • Formato: Stories/Reels
      </p>
    </div>
  );
};
