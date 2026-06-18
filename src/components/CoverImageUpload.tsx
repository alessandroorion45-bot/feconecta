import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { optimizeImage } from "@/lib/imageOptimization";

interface CoverImageUploadProps {
  currentUrl?: string;
  userId: string;
  onUploadComplete: (url: string | null) => void;
  variant?: "inline" | "overlay";
}

const ASPECT_RATIO = 16 / 9;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const CoverImageUpload = ({ 
  currentUrl, 
  userId, 
  onUploadComplete,
  variant = "inline"
}: CoverImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: "Formato não suportado",
          description: "Use JPG, PNG ou WEBP.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: "Tamanho máximo: 5 MB.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setDialogOpen(true);
      });
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
  }, []);

  const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Output size: max 1920px wide, maintain 16:9
    const outputWidth = Math.min(1920, pixelCrop.width * scaleX);
    const outputHeight = outputWidth / ASPECT_RATIO;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas is empty"));
          }
        },
        "image/jpeg",
        0.85
      );
    });
  };

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) {
      toast({
        title: "Erro",
        description: "Ajuste o recorte para manter a proporção 16:9.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });

      toast({
        title: "Otimizando capa... 🔄",
        description: "Comprimindo e gerando versões WebP"
      });

      // ✨ OTIMIZAÇÃO: Processar com Sharp
      const optimized = await optimizeImage(file, 'cover', userId);

      // Save cover URL directly to database for persistence
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cover_image_url: optimized.photo_url,
          cover_thumbnail_url: optimized.thumbnail_url,
          cover_medium_url: optimized.medium_url
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploadComplete(optimized.photo_url);
      setDialogOpen(false);
      setImgSrc("");

      toast({
        title: "Capa atualizada! ✨",
        description: `${optimized.compression_ratio}% menor • WebP`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a capa.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      
      // Remove cover URL from database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_image_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploadComplete(null);
      toast({
        title: "Capa removida com sucesso!",
        description: "Sua imagem de capa foi removida.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // Overlay variant - discrete icon button only
  if (variant === "overlay") {
    return (
      <>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-9 w-9 bg-black/40 backdrop-blur-md hover:bg-black/60 border-0 shadow-lg transition-all hover:scale-110"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          aria-label="Alterar imagem de capa"
        >
          <Camera className="h-4 w-4 text-white" />
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={onSelectFile}
          className="hidden"
          aria-label="Selecionar imagem de capa"
        />

        {/* Crop Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Ajustar Capa do Perfil</DialogTitle>
              <DialogDescription>
                Ajuste o recorte para manter a proporção 16:9. Arraste para reposicionar.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center gap-4">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={ASPECT_RATIO}
                  className="max-h-[60vh]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Prévia da capa"
                    onLoad={onImageLoad}
                    className="max-h-[60vh] max-w-full"
                  />
                </ReactCrop>
              )}
              
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCancel}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-gradient-primary"
                  onClick={handleSave}
                  disabled={uploading || !completedCrop}
                >
                  <Check className="h-4 w-4" />
                  {uploading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Inline variant - full section with preview
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Capa do Perfil
      </label>
      <p className="text-xs text-muted-foreground">
        Adicione uma imagem de capa para personalizar seu perfil. Proporção 16:9.
      </p>
      
      {/* Cover Preview */}
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Capa do perfil"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Camera className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          {currentUrl ? "Alterar capa" : "Adicionar capa"}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={uploading}
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onSelectFile}
        className="hidden"
        aria-label="Selecionar imagem de capa"
      />

      {/* Crop Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajustar Capa do Perfil</DialogTitle>
            <DialogDescription>
              Ajuste o recorte para manter a proporção 16:9. Arraste para reposicionar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT_RATIO}
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Prévia da capa"
                  onLoad={onImageLoad}
                  className="max-h-[60vh] max-w-full"
                />
              </ReactCrop>
            )}
            
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCancel}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2 bg-gradient-primary"
                onClick={handleSave}
                disabled={uploading || !completedCrop}
              >
                <Check className="h-4 w-4" />
                {uploading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
