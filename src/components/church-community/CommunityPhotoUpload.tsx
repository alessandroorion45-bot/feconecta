import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Upload } from "lucide-react";
import RectAvatar from "@/components/RectAvatar";
import { ImageCropModal } from "@/components/ImageCropModal";

interface CommunityPhotoUploadProps {
  communityId: string;
  currentImageUrl: string | null;
  communityName: string;
  isAdmin: boolean;
  onUpdate: (newUrl: string) => void;
}

const CommunityPhotoUpload = ({
  communityId,
  currentImageUrl,
  communityName,
  isAdmin,
  onUpdate
}: CommunityPhotoUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setCropModalOpen(false);
    setSelectedImage(null);
    setUploading(true);

    try {
      const fileName = `community-${communityId}-${Date.now()}.jpg`;
      const filePath = `community-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-photos")
        .upload(filePath, croppedImage, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("community-photos")
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;

      // Update community record
      const { error: updateError } = await supabase
        .from("church_communities")
        .update({ cover_image_url: newUrl })
        .eq("id", communityId);

      if (updateError) throw updateError;

      onUpdate(newUrl);

      toast({
        title: "✅ Foto atualizada!",
        description: "A nova imagem da comunidade foi salva com sucesso.",
      });
    } catch (error: any) {
      console.error("Error uploading community photo:", error);
      toast({
        title: "Erro ao enviar foto",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <RectAvatar
        src={currentImageUrl}
        fallback={communityName}
        size="xl"
      />
      
      {isAdmin && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {selectedImage && (
        <ImageCropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={7 / 10}
          title="Recortar Foto da Comunidade"
        />
      )}
    </div>
  );
};

export default CommunityPhotoUpload;
