import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { optimizeImage } from "@/lib/imageOptimization";

interface AvatarUploadProps {
  currentUrl?: string;
  userId: string;
  onUploadComplete: (url: string) => void;
  variant?: "circular" | "rectangular";
}

const ASPECT_RATIO = 9 / 16; // Portrait 9:16
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 50,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const AvatarUpload = ({ 
  currentUrl, 
  userId, 
  onUploadComplete,
  variant = "circular"
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: "Formato não suportado",
          description: "Use JPG, PNG ou WEBP.",
          variant: "destructive",
        });
        return;
      }
      
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
        setScale(1);
      });
      reader.readAsDataURL(file);
    }
    
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, variant === "rectangular" ? ASPECT_RATIO : 1));
  }, [variant]);

  const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Apply zoom scale
    const cropX = pixelCrop.x * scaleX;
    const cropY = pixelCrop.y * scaleY;
    const cropWidth = pixelCrop.width * scaleX;
    const cropHeight = pixelCrop.height * scaleY;

    // Output size
    canvas.width = Math.min(400, cropWidth);
    canvas.height = variant === "rectangular" 
      ? canvas.width / ASPECT_RATIO 
      : canvas.width;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
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
        0.9
      );
    });
  };

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) {
      toast({
        title: "Erro",
        description: "Ajuste o recorte da imagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Get cropped blob
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);

      // Convert blob to File for optimization
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

      toast({
        title: "Otimizando avatar... 🔄",
        description: "Comprimindo e gerando versões WebP"
      });

      // ✨ OTIMIZAÇÃO: Processar com Sharp
      const optimized = await optimizeImage(file, 'avatar', userId);

      // Save optimized URLs to database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: optimized.photo_url,
          avatar_thumbnail_url: optimized.thumbnail_url,
          avatar_medium_url: optimized.medium_url
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploadComplete(optimized.photo_url);
      setDialogOpen(false);
      setImgSrc("");

      toast({
        title: "Avatar atualizado! ✨",
        description: `${optimized.compression_ratio}% menor • WebP`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o avatar.",
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
    setScale(1);
  };

  // Rectangular 9:16 variant
  if (variant === "rectangular") {
    return (
      <>
        <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
          <div className="w-[84px] h-[120px] sm:w-[112px] sm:h-[160px] relative overflow-hidden bg-muted rounded-xl">
            {currentUrl ? (
              <img 
                src={currentUrl} 
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-xl sm:text-2xl font-semibold text-primary">U</span>
              </div>
            )}
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={onSelectFile}
          className="hidden"
          aria-label="Selecionar foto de perfil"
        />

        {/* Crop Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
              <DialogDescription>
                Ajuste a posição e o zoom. Proporção 9:16 (retrato).
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center gap-4">
              {imgSrc && (
                <div className="relative bg-muted rounded-lg overflow-hidden">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={ASPECT_RATIO}
                    className="max-h-[50vh]"
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt="Prévia do avatar"
                      onLoad={onImageLoad}
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "center",
                      }}
                      className="max-h-[50vh] max-w-full"
                    />
                  </ReactCrop>
                </div>
              )}

              {/* Zoom Slider */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Zoom</span>
                  <span>{Math.round(scale * 100)}%</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([value]) => setScale(value)}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
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
                  className="flex-1 gap-2 bg-gradient-primary text-primary-foreground"
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

  // Circular variant (default)
  return (
    <>
      <div className="relative group cursor-pointer transition-transform duration-200 hover:scale-105" onClick={() => inputRef.current?.click()}>
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-primary/25 via-amber-300/15 to-transparent blur-md" aria-hidden />
        <Avatar className="relative h-[72px] w-[72px] sm:h-24 sm:w-24 md:h-32 md:w-32 ring-2 ring-border/60 ring-offset-2 ring-offset-background shadow-lg">
          <AvatarImage
            src={currentUrl}
            alt="Foto de perfil"
            className="object-cover object-center"
          />
          <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-br from-sky-400 to-blue-500 text-white">U</AvatarFallback>
        </Avatar>
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onSelectFile}
        className="hidden"
        aria-label="Selecionar foto de perfil"
      />

      {/* Crop Dialog for Circular */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Ajuste a posição e o zoom da sua foto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4">
            {imgSrc && (
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  className="max-h-[50vh]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Prévia do avatar"
                    onLoad={onImageLoad}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: "center",
                    }}
                    className="max-h-[50vh] max-w-full"
                  />
                </ReactCrop>
              </div>
            )}

            {/* Zoom Slider */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Zoom</span>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
            
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
                className="flex-1 gap-2 bg-gradient-primary text-primary-foreground"
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
};