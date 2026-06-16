import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Share2, Download, Loader2, Square, RectangleVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface VerseImageShareProps {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  onShare?: () => void;
  shareCount?: number;
}

type ImageFormat = "square" | "story";

const VerseImageShare = ({
  bookAbbrev,
  bookName,
  chapter,
  verseNumber,
  verseText,
  onShare,
  shareCount = 0,
}: VerseImageShareProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<ImageFormat>("square");

  const generateCanvasImage = async (imageFormat: ImageFormat): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // Set dimensions based on format
    if (imageFormat === "square") {
      canvas.width = 1080;
      canvas.height = 1080;
    } else {
      canvas.width = 1080;
      canvas.height = 1920;
    }

    // Create celestial gradient background (deep blue)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0a0f1a");
    gradient.addColorStop(0.3, "#0d1526");
    gradient.addColorStop(0.6, "#111d35");
    gradient.addColorStop(1, "#0a1628");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add celestial glow effect (golden light from top)
    const lightGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.2,
      0,
      canvas.width / 2,
      canvas.height * 0.2,
      canvas.width * 0.8
    );
    lightGradient.addColorStop(0, "rgba(255, 215, 100, 0.15)");
    lightGradient.addColorStop(0.3, "rgba(255, 200, 80, 0.08)");
    lightGradient.addColorStop(0.6, "rgba(255, 180, 60, 0.03)");
    lightGradient.addColorStop(1, "transparent");
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    const starCount = imageFormat === "story" ? 80 : 50;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.6;
      const size = Math.random() * 2 + 0.5;
      const opacity = Math.random() * 0.5 + 0.3;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Add golden decorative lines
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 2;
    const padding = 80;
    const lineLength = 100;

    // Top left corner
    ctx.beginPath();
    ctx.moveTo(padding, padding + lineLength);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + lineLength, padding);
    ctx.stroke();

    // Top right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - padding - lineLength, padding);
    ctx.lineTo(canvas.width - padding, padding);
    ctx.lineTo(canvas.width - padding, padding + lineLength);
    ctx.stroke();

    // Bottom left corner
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding - lineLength);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(padding + lineLength, canvas.height - padding);
    ctx.stroke();

    // Bottom right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - padding - lineLength, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding - lineLength);
    ctx.stroke();

    // Calculate text area
    const maxWidth = canvas.width - 160;
    const fontSize = imageFormat === "story" ? 42 : 38;
    const lineHeight = fontSize * 1.6;

    // Word wrap function
    const wrapText = (text: string, maxW: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      ctx.font = `italic ${fontSize}px "Georgia", "Times New Roman", serif`;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    const lines = wrapText(verseText, maxWidth);
    const totalTextHeight = lines.length * lineHeight;
    const centerY = canvas.height / 2;
    let y = centerY - totalTextHeight / 2;

    // Draw opening quotation mark
    ctx.font = 'bold 100px "Georgia", serif';
    ctx.fillStyle = "rgba(212, 175, 55, 0.5)";
    ctx.textAlign = "left";
    ctx.fillText("\u201C", padding + 20, y - 20);

    // Draw verse text (white, centered)
    ctx.font = `italic ${fontSize}px "Georgia", "Times New Roman", serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add subtle text shadow for readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    for (const line of lines) {
      ctx.fillText(line, canvas.width / 2, y);
      y += lineHeight;
    }

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw closing quotation mark
    ctx.font = 'bold 100px "Georgia", serif';
    ctx.fillStyle = "rgba(212, 175, 55, 0.5)";
    ctx.textAlign = "right";
    ctx.fillText("\u201D", canvas.width - padding - 20, y + 30);

    // Draw reference (golden)
    ctx.font = `bold 32px "Georgia", serif`;
    ctx.fillStyle = "rgba(212, 175, 55, 0.95)";
    ctx.textAlign = "center";
    ctx.fillText(
      `— ${bookName} ${chapter}:${verseNumber} —`,
      canvas.width / 2,
      y + 100
    );

    // Add app watermark
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("Fé em Comunidade", canvas.width / 2, canvas.height - 50);

    return canvas.toDataURL("image/png", 1.0);
  };

  const uploadImage = async (imageDataUrl: string): Promise<string> => {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    const { data: { user } } = await supabase.auth.getUser();
    const fileName = `${user?.id || "anonymous"}/${Date.now()}-${format}.png`;

    const { error: uploadError } = await supabase.storage
      .from("verse-images")
      .upload(fileName, blob, { contentType: "image/png" });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("verse-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const recordShare = async (url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("verse_shares").insert({
      user_id: user.id,
      book_abbrev: bookAbbrev,
      book_name: bookName,
      chapter,
      verse_number: verseNumber,
      share_channel: "image",
      image_url: url,
    });

    onShare?.();
  };

  const generateImage = async () => {
    setGenerating(true);
    try {
      const canvasDataUrl = await generateCanvasImage(format);
      const uploadedUrl = await uploadImage(canvasDataUrl);
      setImageUrl(uploadedUrl);
      
      toast({
        title: "Imagem gerada!",
        description: `Arte ${format === "square" ? "quadrada (1:1)" : "vertical (9:16)"} pronta.`,
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Erro ao gerar imagem",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `versiculo-${bookName.replace(/\s+/g, "-")}-${chapter}-${verseNumber}-${format}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado!",
        description: "A imagem está sendo baixada.",
      });
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const shareImage = async () => {
    if (!imageUrl) return;

    await recordShare(imageUrl);

    // Try native share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bookName} ${chapter}:${verseNumber}`,
          text: `"${verseText}" — ${bookName} ${chapter}:${verseNumber}`,
          url: imageUrl,
        });
        return;
      } catch {
        // Fallback to WhatsApp
      }
    }
    
    const message = `✨ ${bookName} ${chapter}:${verseNumber}\n\n"${verseText}"\n\n📖 Veja a imagem: ${imageUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Compartilhar",
      description: "Compartilhe o versículo com seus amigos!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setImageUrl(null);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-8 px-2 sm:px-3"
          aria-label={`Gerar imagem do versículo, ${shareCount} imagens geradas`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="text-xs">{shareCount > 0 ? shareCount : ''}</span>
          <span className="hidden sm:inline text-xs">Imagem</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" aria-describedby="verse-image-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Criar Arte do Versículo
          </DialogTitle>
        </DialogHeader>
        <p id="verse-image-desc" className="sr-only">Gerar imagem artística do versículo</p>

        <div className="space-y-4">
          {/* Preview text */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm italic text-center">"{verseText}"</p>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              — {bookName} {chapter}:{verseNumber}
            </p>
          </div>

          {!imageUrl ? (
            <div className="space-y-4">
              {/* Format selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato da imagem:</label>
                <ToggleGroup 
                  type="single" 
                  value={format} 
                  onValueChange={(value) => value && setFormat(value as ImageFormat)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="square" aria-label="Formato quadrado" className="gap-2">
                    <Square className="h-4 w-4" />
                    <span>Feed (1:1)</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="story" aria-label="Formato story" className="gap-2">
                    <RectangleVertical className="h-4 w-4" />
                    <span>Story (9:16)</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Style info */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>✨ Fundo celestial com luz suave e estrelas</p>
                <p>🎨 Paleta: azul profundo, dourado e branco</p>
                <p>📜 Tipografia elegante e centralizada</p>
              </div>
              
              <Button
                onClick={generateImage}
                disabled={generating}
                className="w-full gap-2"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando arte...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Gerar Arte Inspiradora
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generated image preview */}
              <div className="rounded-lg overflow-hidden border shadow-lg">
                <img
                  src={imageUrl}
                  alt={`Versículo ${bookName} ${chapter}:${verseNumber}`}
                  className="w-full"
                />
              </div>

              {/* Action buttons - only download and share */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={downloadImage}
                  aria-label="Baixar imagem"
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={shareImage}
                  aria-label="Compartilhar imagem"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              {/* Generate new */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setImageUrl(null)}
              >
                ← Gerar outra arte
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerseImageShare;
