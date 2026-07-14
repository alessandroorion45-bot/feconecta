import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Save, X, RotateCcw, RotateCw, Move } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  aspectRatio: number; // e.g., 9/16 for avatar, 16/9 for cover
  onCropComplete: (croppedImageBlob: Blob) => void;
  title: string;
  /** Moldura de recorte redonda (selos, avatares) em vez de retangular */
  round?: boolean;
}

/**
 * Recorte estilo Instagram/WhatsApp: a moldura fica FIXA e o usuário
 * arrasta a imagem por baixo (mouse ou toque), com zoom por slider,
 * roda do mouse ou gesto de pinça, e rotação em passos de 90°.
 * O resultado salvo é exatamente o que aparece dentro da moldura.
 */
export const ImageCropModal = ({
  open,
  onOpenChange,
  imageSrc,
  aspectRatio,
  onCropComplete,
  title,
  round,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropChange = setCrop;
  const onZoomChange = setZoom;

  const onCropAreaComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const radians = (rotation * Math.PI) / 180;

    // Canvas intermediário com a imagem rotacionada
    const rotatedCanvas = document.createElement("canvas");
    const rotatedCtx = rotatedCanvas.getContext("2d");
    if (!rotatedCtx) return null;

    const isSideways = rotation % 180 !== 0;
    rotatedCanvas.width = isSideways ? image.naturalHeight : image.naturalWidth;
    rotatedCanvas.height = isSideways ? image.naturalWidth : image.naturalHeight;

    rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
    rotatedCtx.rotate(radians);
    rotatedCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // Recorte final exatamente na área da moldura
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Limita o tamanho final (economia de banda/storage)
    const MAX_DIMENSION = 1280;
    const scaleDown = Math.min(1, MAX_DIMENSION / Math.max(croppedAreaPixels.width, croppedAreaPixels.height));
    canvas.width = Math.round(croppedAreaPixels.width * scaleDown);
    canvas.height = Math.round(croppedAreaPixels.height * scaleDown);

    ctx.drawImage(
      rotatedCanvas,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }, [croppedAreaPixels, imageSrc, rotation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const croppedBlob = await getCroppedImg();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
        onOpenChange(false);
        reset();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Move className="h-3.5 w-3.5" />
            Arraste a imagem para posicionar. Use a roda do mouse ou o controle para dar zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de recorte: moldura fixa, imagem móvel */}
          <div className="relative w-full h-[340px] bg-black/90 rounded-lg overflow-hidden touch-none">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
              cropShape={round ? "round" : "rect"}
              showGrid={!round}
              zoomWithScroll
              minZoom={1}
              maxZoom={4}
              style={{
                cropAreaStyle: {
                  border: "2px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                },
              }}
            />
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={4}
              step={0.05}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotação */}
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            >
              <RotateCcw className="h-4 w-4" />
              Girar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
              Girar
            </Button>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" />
              Resetar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2 bg-gradient-primary text-primary-foreground"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
