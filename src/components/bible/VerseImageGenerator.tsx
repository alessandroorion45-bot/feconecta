import { useEffect, useRef, useState } from 'react';
import { VERSE_IMAGE_THEMES, getThemeById, type VerseImageTheme } from '@/lib/verseImageThemes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Download, Image as ImageIcon } from 'lucide-react';

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
  // Fundo de foto (enviado pelo admin). null = usar tema de gradiente.
  const [photoBgUrl, setPhotoBgUrl] = useState<string | null>(null);
  const [backgrounds, setBackgrounds] = useState<{ id: string; image_url: string; name: string | null }[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Busca os fundos ativos cadastrados no painel admin (custo zero, sem IA)
  useEffect(() => {
    (supabase as any)
      .from('verse_backgrounds')
      .select('id, image_url, name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }: { data: { id: string; image_url: string; name: string | null }[] | null }) => {
        setBackgrounds(data || []);
      });
  }, []);

  useEffect(() => {
    generateImage();
  }, [verseText, selectedTheme, photoBgUrl]);

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

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseTheme = getThemeById(selectedTheme);

    // 📱 FORMATO 9:16 (Stories/Reels) - 1080x1920
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // No modo foto, o texto vira branco (legibilidade sobre a imagem);
    // no modo gradiente, mantem as cores do tema escolhido.
    const theme: VerseImageTheme = photoBgUrl
      ? { ...baseTheme, textColor: '#ffffff', secondaryTextColor: 'rgba(255,255,255,0.9)', accentColor: '#FFD76A', borderColor: 'rgba(255,255,255,0.55)' }
      : baseTheme;

    if (photoBgUrl) {
      // Fundo = foto enviada pelo admin (desenhada cobrindo o canvas)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = photoBgUrl;
      });
      if (img.width > 0) {
        // cover: preenche 9:16 sem distorcer
        const scale = Math.max(width / img.width, height / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = '#12061f';
        ctx.fillRect(0, 0, width, height);
      }
      // Escurecimento (scrim) pra letra ficar legivel sobre qualquer foto
      const scrim = ctx.createLinearGradient(0, 0, 0, height);
      scrim.addColorStop(0, 'rgba(0,0,0,0.55)');
      scrim.addColorStop(0.5, 'rgba(0,0,0,0.35)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Fundo com gradiente vertical (temas)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, theme.gradientStart);
      gradient.addColorStop(0.5, theme.gradientMid);
      gradient.addColorStop(1, theme.gradientEnd);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      // Decoração de fundo (só nos gradientes)
      drawDecoration(ctx, theme, width, height);
    }

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

    // Logo/marca d'água no rodapé — dentro da moldura, com folga da linha
    // (a borda inferior fica em height-120; o texto fica bem acima dela).
    ctx.fillStyle = theme.accentColor;
    ctx.font = `bold italic 46px ${theme.fontFamily}`;
    ctx.fillText('✨ Aliança Kingdom', width / 2, height - 220);

    ctx.fillStyle = theme.secondaryTextColor;
    ctx.font = `30px ${theme.fontFamily}`;
    ctx.fillText('Fortaleça sua fé diariamente', width / 2, height - 170);

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

      {/* Fundos de foto (enviados pelo admin) — só aparece se houver algum */}
      {backgrounds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Fundos de Foto</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setPhotoBgUrl(bg.image_url)}
                title={bg.name || 'Fundo'}
                className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  photoBgUrl === bg.image_url ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-transparent hover:border-primary/40'
                }`}
                style={{ width: 54, aspectRatio: '9 / 16' }}
              >
                <img src={bg.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de temas (gradiente) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Temas de Gradiente</h3>
        </div>

        <Tabs value={photoBgUrl ? '' : selectedTheme} onValueChange={(v) => { setPhotoBgUrl(null); setSelectedTheme(v); }} className="w-full">
          {/* Cada tema mostra uma amostra do gradiente + nome que respira
              (grade com poucas colunas, texto quebra em vez de sobrepor). */}
          <TabsList className="grid grid-cols-3 sm:grid-cols-4 h-auto gap-2 bg-transparent p-0">
            {VERSE_IMAGE_THEMES.map((theme) => (
              <TabsTrigger
                key={theme.id}
                value={theme.id}
                className="flex-col gap-1.5 h-auto min-w-0 p-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:ring-2 data-[state=active]:ring-primary"
                title={theme.description}
              >
                <span
                  className="w-full rounded-lg border border-white/10 shadow-sm"
                  style={{
                    aspectRatio: '16 / 10',
                    background: `linear-gradient(to bottom, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`,
                  }}
                  aria-hidden
                />
                <span className="text-[11px] font-medium text-center leading-tight break-words whitespace-normal w-full">
                  {theme.name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Imagem gerada em alta resolução (1080x1920px) • Formato: Stories/Reels
      </p>
    </div>
  );
};
