import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Video, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventMediaUploadProps {
  imageUrl: string | null;
  videoUrl: string | null;
  onImageChange: (url: string | null) => void;
  onVideoChange: (url: string | null) => void;
  userId: string;
}

export const EventMediaUpload = ({
  imageUrl,
  videoUrl,
  onImageChange,
  onVideoChange,
  userId,
}: EventMediaUploadProps) => {
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use JPG, PNG ou WEBP",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("event-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("event-media")
        .getPublicUrl(fileName);

      onImageChange(urlData.publicUrl);
      toast({
        title: "Imagem carregada!",
        description: "A imagem do evento foi adicionada",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar a imagem",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["video/mp4", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use MP4 ou MOV",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 100MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("event-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("event-media")
        .getPublicUrl(fileName);

      onVideoChange(urlData.publicUrl);
      toast({
        title: "Vídeo carregado!",
        description: "O vídeo promocional foi adicionado",
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar o vídeo",
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Imagem do Evento (16:9 ou 9:16)</label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
        {imageUrl ? (
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Preview do evento"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => onImageChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full h-32 border-dashed flex flex-col gap-2"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm">Adicionar imagem</span>
                <span className="text-xs text-muted-foreground">JPG, PNG ou WEBP (max 10MB)</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Video Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Vídeo Promocional (opcional)</label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={handleVideoUpload}
          className="hidden"
        />
        {videoUrl ? (
          <div className="relative rounded-lg overflow-hidden">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: "200px" }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => onVideoChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full h-24 border-dashed flex flex-col gap-2"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Video className="h-6 w-6" />
                <span className="text-sm">Adicionar vídeo</span>
                <span className="text-xs text-muted-foreground">MP4 ou MOV (max 100MB)</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
