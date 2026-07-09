import { useState, useEffect, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { optimizeImage, getResponsiveImageUrl } from "@/lib/imageOptimization";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Camera, 
  Plus, 
  Globe, 
  Lock, 
  Users, 
  Trash2,
  Heart,
  Upload,
  X,
  Loader2,
  Share2,
  ZoomIn,
  ImageIcon,
  MapPin,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageCircle,
  Navigation,
  Pencil,
  Download,
  FolderPlus,
  Folder,
  Play,
  Link2,
  Image
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, parseISO, isSameMonth, isSameYear, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoComments } from "./PhotoComments";
import { useGeolocation } from "@/hooks/useGeolocation";
import { PhotoSlideshow } from "./PhotoSlideshow";

interface PhotoData {
  id: string;
  user_id: string;
  photo_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  caption: string | null;
  visibility: 'public' | 'private' | 'friends';
  likes_count: number;
  created_at: string;
  location: string | null;
  album_id: string | null;
  compression_ratio?: number;
}

interface Album {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_photo_id: string | null;
  created_at: string;
}

interface ProfilePhotosProps {
  userId: string;
  isOwner: boolean;
  isFriend?: boolean;
}

interface MonthGroup {
  month: Date;
  label: string;
  photos: PhotoData[];
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público', icon: Globe, color: 'text-green-500' },
  { value: 'friends', label: 'Somente amigos', icon: Users, color: 'text-blue-500' },
  { value: 'private', label: 'Privado', icon: Lock, color: 'text-red-500' },
];

export const ProfilePhotos = memo(({ userId, isOwner, isFriend = false }: ProfilePhotosProps) => {
  const { toast } = useToast();
  const geolocation = useGeolocation();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [likingPhoto, setLikingPhoto] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoData | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);
  const [formData, setFormData] = useState({
    caption: '',
    visibility: 'public' as 'public' | 'private' | 'friends',
    location: '',
    album_id: null as string | null
  });
  const [editFormData, setEditFormData] = useState({
    caption: '',
    visibility: 'public' as 'public' | 'private' | 'friends',
    location: '',
    album_id: null as string | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startSlideshow = (startIndex: number = 0) => {
    setSlideshowStartIndex(startIndex);
    setSlideshowOpen(true);
  };

  const handleShareAlbum = async (album: Album) => {
    const shareUrl = `${window.location.origin}/profile/${userId}?album=${album.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Álbum: ${album.name}`,
          text: album.description || `Confira o álbum "${album.name}" na Aliança!`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copiado! 📋",
          description: `O link do álbum "${album.name}" foi copiado.`
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleSetAlbumCover = async (albumId: string, photoId: string) => {
    try {
      const { error } = await supabase
        .from('photo_albums')
        .update({ cover_photo_id: photoId })
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Capa definida! 🖼️",
        description: "A foto foi definida como capa do álbum."
      });

      loadAlbums();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível definir a capa.",
        variant: "destructive"
      });
    }
  };

  const handleGetLocation = async () => {
    const location = await geolocation.getLocation();
    if (location) {
      setFormData(prev => ({ ...prev, location }));
      toast({
        title: "Localização obtida! 📍",
        description: location
      });
    } else if (geolocation.error) {
      toast({
        title: "Erro de localização",
        description: geolocation.error,
        variant: "destructive"
      });
    }
  };

  const handleGetEditLocation = async () => {
    const location = await geolocation.getLocation();
    if (location) {
      setEditFormData(prev => ({ ...prev, location }));
      toast({
        title: "Localização obtida! 📍",
        description: location
      });
    }
  };

  const openEditDialog = (photo: PhotoData) => {
    setEditingPhoto(photo);
    setEditFormData({
      caption: photo.caption || '',
      visibility: photo.visibility,
      location: photo.location || '',
      album_id: photo.album_id
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPhoto) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from('profile_photos')
        .update({
          caption: editFormData.caption.trim() || null,
          visibility: editFormData.visibility,
          location: editFormData.location.trim() || null,
          album_id: editFormData.album_id
        })
        .eq('id', editingPhoto.id);

      if (error) throw error;

      toast({
        title: "Foto atualizada!",
        description: "As alterações foram salvas com sucesso."
      });

      setEditDialogOpen(false);
      setEditingPhoto(null);
      loadPhotos();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
    loadCurrentUser();
    loadAlbums();
  }, [userId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      loadUserLikes(user.id);
    }
  };

  const loadUserLikes = async (currentId: string) => {
    const { data } = await supabase
      .from('photo_likes')
      .select('photo_id')
      .eq('user_id', currentId);
    
    if (data) {
      setLikedPhotos(new Set(data.map(l => l.photo_id)));
    }
  };

  const loadAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from("photo_albums")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlbums((data || []) as Album[]);
    } catch (error) {
      console.error("Error loading albums:", error);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      // any: encadear mais um .eq() aqui faz o TS explodir em "type
      // instantiation excessively deep" contra o schema gerado.
      const sb: any = supabase;
      const { data, error } = await sb
        .from("profile_photos")
        .select("*")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos((data || []) as PhotoData[]);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o álbum.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('photo_albums')
        .insert({
          user_id: user.id,
          name: newAlbumName.trim(),
          description: newAlbumDescription.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Álbum criado! 📁",
        description: `O álbum "${newAlbumName}" foi criado com sucesso.`
      });

      setNewAlbumName('');
      setNewAlbumDescription('');
      setAlbumDialogOpen(false);
      loadAlbums();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o álbum.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      // First remove album_id from photos
      await supabase
        .from('profile_photos')
        .update({ album_id: null })
        .eq('album_id', albumId);

      const { error } = await supabase
        .from('photo_albums')
        .delete()
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Álbum excluído",
        description: "O álbum foi removido. As fotos não foram excluídas."
      });

      setAlbums(albums.filter(a => a.id !== albumId));
      if (selectedAlbum === albumId) setSelectedAlbum(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o álbum.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (photo: PhotoData) => {
    setDownloading(true);
    try {
      const response = await fetch(photo.photo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `foto_${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado! 📥",
        description: "A foto está sendo baixada."
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a foto.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const filteredPhotos = selectedAlbum 
    ? photos.filter(p => p.album_id === selectedAlbum)
    : photos;

  // Group photos by month for timeline view
  const groupPhotosByMonth = (): MonthGroup[] => {
    const groups: MonthGroup[] = [];
    
    filteredPhotos.forEach(photo => {
      const photoDate = parseISO(photo.created_at);
      const monthStart = startOfMonth(photoDate);
      
      let group = groups.find(g => isSameMonth(g.month, monthStart) && isSameYear(g.month, monthStart));
      
      if (!group) {
        group = {
          month: monthStart,
          label: format(monthStart, "MMMM 'de' yyyy", { locale: ptBR }),
          photos: []
        };
        groups.push(group);
      }
      
      group.photos.push(photo);
    });
    
    // Sort groups by date (most recent first)
    groups.sort((a, b) => b.month.getTime() - a.month.getTime());
    
    return groups;
  };

  const monthGroups = groupPhotosByMonth();

  const formatPhotoDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatShortDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "d MMM", { locale: ptBR });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!photoFile) {
      toast({
        title: "Selecione uma foto",
        description: "É necessário selecionar uma imagem para publicar.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // ✨ OTIMIZAÇÃO: Processar imagem com Sharp via Edge Function
      toast({
        title: "Otimizando imagem... 🔄",
        description: "Comprimindo e gerando versões otimizadas"
      });

      const optimized = await optimizeImage(photoFile, 'photo', user.id);

      // Inserir no banco com URLs otimizadas
      const { error: insertError } = await supabase
        .from('profile_photos')
        .insert({
          user_id: user.id,
          photo_url: optimized.photo_url,
          thumbnail_url: optimized.thumbnail_url,
          medium_url: optimized.medium_url,
          original_size: optimized.original_size,
          optimized_size: optimized.optimized_size,
          compression_ratio: optimized.compression_ratio,
          caption: formData.caption.trim() || null,
          visibility: formData.visibility,
          location: formData.location.trim() || null,
          album_id: formData.album_id
        });

      if (insertError) throw insertError;

      toast({
        title: "Foto publicada! 📸✨",
        description: `Otimização: ${optimized.compression_ratio}% menor • WebP`
      });

      setPhotoFile(null);
      setPhotoPreview(null);
      setFormData({ caption: '', visibility: 'public', location: '', album_id: null });
      setUploadDialogOpen(false);
      loadPhotos();

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a foto.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    try {
      const urlParts = photoUrl.split('/photos/');
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from('photos').remove([filePath]);
      }

      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Foto excluída",
        description: "A foto foi removida com sucesso."
      });

      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a foto.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (photo: PhotoData) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Foto - Aliança',
          text: photo.caption || 'Confira esta foto na Aliança!',
          url: photo.photo_url
        });
      } else {
        await navigator.clipboard.writeText(photo.photo_url);
        toast({
          title: "Link copiado!",
          description: "O link da foto foi copiado para a área de transferência."
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleLike = async (photo: PhotoData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUserId || likingPhoto === photo.id) return;

    setLikingPhoto(photo.id);
    const isLiked = likedPhotos.has(photo.id);

    try {
      if (isLiked) {
        await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photo.id)
          .eq('user_id', currentUserId);
        
        setLikedPhotos(prev => {
          const next = new Set(prev);
          next.delete(photo.id);
          return next;
        });
        
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
        ));
        if (selectedPhoto?.id === photo.id) {
          setSelectedPhoto({ ...selectedPhoto, likes_count: Math.max(0, selectedPhoto.likes_count - 1) });
        }
      } else {
        await supabase
          .from('photo_likes')
          .insert({ photo_id: photo.id, user_id: currentUserId });
        
        setLikedPhotos(prev => new Set([...prev, photo.id]));
        
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, likes_count: p.likes_count + 1 } : p
        ));
        if (selectedPhoto?.id === photo.id) {
          setSelectedPhoto({ ...selectedPhoto, likes_count: selectedPhoto.likes_count + 1 });
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLikingPhoto(null);
    }
  };

  const openPhotoDetail = (photo: PhotoData) => {
    setSelectedPhoto(photo);
  };

  const getVisibilityIcon = (visibility: string) => {
    const option = VISIBILITY_OPTIONS.find(o => o.value === visibility);
    if (!option) return null;
    const Icon = option.icon;
    return <Icon className={cn("h-3 w-3", option.color)} />;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    } else if (direction === 'next' && selectedMonthIndex < monthGroups.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Fotos</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Fotos</h3>
          <span className="text-sm text-muted-foreground">({photos.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {photos.length > 0 && (
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === 'timeline' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Linha do tempo
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === 'grid' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Grade
              </button>
            </div>
          )}
          {isOwner && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setAlbumDialogOpen(true)}
                className="gap-1.5 h-8 px-3 rounded-full"
                title="Criar álbum"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Álbum</span>
              </Button>
              <Button 
                size="sm" 
                onClick={() => setUploadDialogOpen(true)}
                className="gap-1.5 h-8 px-3 rounded-full"
                title="Publicar nova foto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Foto</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Albums Section */}
      {(albums.length > 0 || isOwner) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Álbuns</span>
            </div>
            {filteredPhotos.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startSlideshow(0)}
                className="gap-1.5 h-7 text-xs"
              >
                <Play className="h-3 w-3" />
                Slideshow
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAlbum(null)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                selectedAlbum === null 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted hover:bg-muted/80 border-border"
              )}
            >
              Todas ({photos.length})
            </button>
            {albums.map(album => {
              const albumPhotosCount = photos.filter(p => p.album_id === album.id).length;
              const albumCoverPhoto = photos.find(p => p.id === album.cover_photo_id);
              return (
                <div key={album.id} className="relative group">
                  <button
                    onClick={() => setSelectedAlbum(album.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5",
                      selectedAlbum === album.id 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-muted hover:bg-muted/80 border-border"
                    )}
                  >
                    {albumCoverPhoto && (
                      <img 
                        src={albumCoverPhoto.photo_url} 
                        alt="" 
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    {album.name} ({albumPhotosCount})
                  </button>
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => handleShareAlbum(album)}
                          className="bg-primary text-primary-foreground rounded-full p-0.5"
                          title="Compartilhar álbum"
                        >
                          <Link2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAlbum(album.id)}
                          className="bg-destructive text-destructive-foreground rounded-full p-0.5"
                          title="Excluir álbum"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{selectedAlbum ? "Nenhuma foto neste álbum." : (isOwner ? "Você ainda não publicou nenhuma foto." : "Nenhuma foto disponível.")}</p>
          {isOwner && !selectedAlbum && (
            <Button 
              variant="outline" 
              className="mt-4 gap-2 rounded-full"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Publicar primeira foto
            </Button>
          )}
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="space-y-6">
          {/* Month Navigation */}
          {monthGroups.length > 1 && (
            <div className="flex items-center justify-center gap-4 pb-4 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('prev')}
                disabled={selectedMonthIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[200px] justify-center">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium capitalize">
                  {monthGroups[selectedMonthIndex]?.label}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('next')}
                disabled={selectedMonthIndex === monthGroups.length - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Month dots navigation */}
          {monthGroups.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2">
              {monthGroups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMonthIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === selectedMonthIndex 
                      ? "bg-primary w-6" 
                      : "bg-muted hover:bg-muted-foreground/30"
                  )}
                  title={monthGroups[idx].label}
                />
              ))}
            </div>
          )}

          {/* Photos in selected month */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMonthIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {monthGroups[selectedMonthIndex]?.photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="group relative"
                >
                  {/* Timeline connector */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-border -z-10 hidden sm:block" />
                  
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                        {formatShortDate(photo.created_at)}
                      </div>
                    </div>

                    {/* Photo Card */}
                    <div className="flex-1 bg-muted/30 rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                      {/* Photo with original aspect ratio */}
                      <div 
                        className="relative cursor-pointer overflow-hidden"
                        onClick={() => openPhotoDetail(photo)}
                      >
                        <img
                          src={getResponsiveImageUrl(photo, 'medium')}
                          alt={photo.caption || "Foto"}
                          className="w-full h-auto object-contain max-h-[500px] transition-transform duration-500 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                          <div className="flex items-center gap-2 text-white">
                            <Maximize2 className="h-5 w-5" />
                            <span className="text-sm font-medium">Ver em tela cheia</span>
                          </div>
                        </div>

                        {/* Visibility badge */}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                          {getVisibilityIcon(photo.visibility)}
                          <span className="text-white text-xs">
                            {VISIBILITY_OPTIONS.find(o => o.value === photo.visibility)?.label}
                          </span>
                        </div>
                      </div>

                      {/* Photo Info */}
                      <div className="p-4 space-y-3">
                        {/* Caption */}
                        {photo.caption && (
                          <p className="text-sm">{photo.caption}</p>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {/* Date & Time */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            <span>Postado em {formatPhotoDate(photo.created_at)}</span>
                          </div>

                          {/* Location */}
                          {photo.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/70" />
                              <span>{photo.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions row */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <button
                            onClick={(e) => handleLike(photo, e)}
                            disabled={likingPhoto === photo.id}
                            className="flex items-center gap-1.5 hover:text-red-500 transition-all disabled:opacity-50"
                          >
                            <Heart 
                              className={cn(
                                "h-5 w-5 transition-all duration-300",
                                likedPhotos.has(photo.id) 
                                  ? "fill-red-500 text-red-500 scale-110" 
                                  : "hover:scale-110",
                                likingPhoto === photo.id && "animate-pulse"
                              )} 
                            />
                            <span className={cn(
                              "text-sm",
                              likedPhotos.has(photo.id) && "text-red-500 font-medium"
                            )}>
                              {photo.likes_count} {photo.likes_count === 1 ? 'curtida' : 'curtidas'}
                            </span>
                          </button>

                          <div className="flex items-center gap-2">
                            {isOwner && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-primary/10"
                                onClick={(e) => { e.stopPropagation(); openEditDialog(photo); }}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full hover:bg-primary/10"
                              onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}
                              disabled={downloading}
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full hover:bg-primary/10"
                              onClick={() => handleShare(photo)}
                              title="Compartilhar"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            {isOwner && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(photo.id, photo.photo_url)}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group relative bg-muted rounded-lg overflow-hidden cursor-pointer"
              onClick={() => openPhotoDetail(photo)}
            >
              {/* Photo with preserved aspect ratio using padding trick */}
              <div className="relative">
                <img
                  src={getResponsiveImageUrl(photo, 'thumbnail')}
                  alt={photo.caption || "Foto"}
                  className="w-full h-auto object-contain max-h-[300px] transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <ZoomIn className="h-6 w-6 text-white" />
                  <div className="text-white text-xs text-center">
                    {formatShortDate(photo.created_at)}
                  </div>
                  {photo.location && (
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{photo.location}</span>
                    </div>
                  )}
                </div>

                {/* Visibility badge */}
                <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1">
                  {getVisibilityIcon(photo.visibility)}
                </div>

                {/* Likes count */}
                {photo.likes_count > 0 && (
                  <div className="absolute bottom-1.5 left-1.5 bg-black/50 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-400 fill-red-400" />
                    <span className="text-white text-xs">{photo.likes_count}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Publicar Nova Foto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo Preview/Upload */}
            <div className="space-y-2">
              <Label>Foto *</Label>
              {photoPreview ? (
                <div className="relative max-h-64 mx-auto bg-muted rounded-lg overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="aspect-video max-h-64 mx-auto border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Formato original preservado • Máx. 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Input
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Adicione uma legenda..."
                maxLength={200}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Localização (opcional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: São Paulo, SP"
                  maxLength={100}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={geolocation.loading}
                  title="Obter localização automática"
                  className="shrink-0"
                >
                  {geolocation.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {geolocation.error && (
                <p className="text-xs text-destructive">{geolocation.error}</p>
              )}
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Quem pode ver</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: 'public' | 'private' | 'friends') => 
                  setFormData({ ...formData, visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={cn("h-4 w-4", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Album */}
            {albums.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-primary" />
                  Adicionar ao álbum
                </Label>
                <Select
                  value={formData.album_id || "none"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, album_id: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um álbum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem álbum</SelectItem>
                    {albums.map((album) => (
                      <SelectItem key={album.id} value={album.id}>
                        {album.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !photoFile}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Publicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Dialog - Full Screen */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedPhoto && (
            <div className="flex flex-col lg:flex-row">
              {/* Photo - preserving original aspect ratio */}
              <div className="bg-black flex items-center justify-center min-h-[300px] lg:min-h-[500px] lg:flex-1">
                <img
                  src={getResponsiveImageUrl(selectedPhoto, 'full')}
                  alt={selectedPhoto.caption || "Foto"}
                  className="max-w-full max-h-[70vh] lg:max-h-[80vh] object-contain"
                />
              </div>

              {/* Photo Info Sidebar */}
              <div className="lg:w-80 p-4 lg:p-6 space-y-4 bg-background">
                {/* Caption */}
                {selectedPhoto.caption && (
                  <p className="text-sm lg:text-base">{selectedPhoto.caption}</p>
                )}

                {/* Metadata */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary/70" />
                    <span>Postado em {formatPhotoDate(selectedPhoto.created_at)}</span>
                  </div>

                  {/* Location */}
                  {selectedPhoto.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/70" />
                      <span>{selectedPhoto.location}</span>
                    </div>
                  )}

                  {/* Visibility */}
                  <div className="flex items-center gap-2">
                    {getVisibilityIcon(selectedPhoto.visibility)}
                    <span>
                      {VISIBILITY_OPTIONS.find(o => o.value === selectedPhoto.visibility)?.label}
                    </span>
                  </div>
                </div>

                {/* Likes */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => handleLike(selectedPhoto)}
                    disabled={likingPhoto === selectedPhoto.id}
                    className="flex items-center gap-2 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Heart 
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        likedPhotos.has(selectedPhoto.id) 
                          ? "fill-red-500 text-red-500 scale-110" 
                          : "hover:scale-110",
                        likingPhoto === selectedPhoto.id && "animate-pulse"
                      )} 
                    />
                    <span className={cn(
                      "font-medium",
                      likedPhotos.has(selectedPhoto.id) && "text-red-500"
                    )}>
                      {selectedPhoto.likes_count} {selectedPhoto.likes_count === 1 ? 'curtida' : 'curtidas'}
                    </span>
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  {!isOwner && currentUserId && (
                    <Button
                      size="sm"
                      variant={likedPhotos.has(selectedPhoto.id) ? "default" : "outline"}
                      className={cn(
                        "flex-1 transition-all duration-300",
                        likedPhotos.has(selectedPhoto.id) && "bg-red-500 hover:bg-red-600 text-white"
                      )}
                      onClick={() => handleLike(selectedPhoto)}
                      disabled={likingPhoto === selectedPhoto.id}
                    >
                      <Heart className={cn(
                        "h-4 w-4 mr-2 transition-transform",
                        likedPhotos.has(selectedPhoto.id) && "fill-white"
                      )} />
                      {likedPhotos.has(selectedPhoto.id) ? "Curtido" : "Curtir"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comentários
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(selectedPhoto)}
                    disabled={downloading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(selectedPhoto)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t">
                  <PhotoComments photoId={selectedPhoto.id} isOpen={showComments} />
                </div>

                {isOwner && (
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    {selectedPhoto.album_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetAlbumCover(selectedPhoto.album_id!, selectedPhoto.id)}
                        className="gap-2"
                      >
                        <Image className="h-4 w-4" />
                        Definir como capa do álbum
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(selectedPhoto)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(selectedPhoto.id, selectedPhoto.photo_url)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Photo Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Foto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="edit-caption">Legenda</Label>
              <Input
                id="edit-caption"
                value={editFormData.caption}
                onChange={(e) => setEditFormData({ ...editFormData, caption: e.target.value })}
                placeholder="Adicione uma legenda..."
                maxLength={200}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Localização
              </Label>
              <div className="flex gap-2">
                <Input
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="Ex: São Paulo, SP"
                  maxLength={100}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleGetEditLocation}
                  disabled={geolocation.loading}
                  className="shrink-0"
                >
                  {geolocation.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Select
                value={editFormData.visibility}
                onValueChange={(value: 'public' | 'private' | 'friends') => 
                  setEditFormData({ ...editFormData, visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={cn("h-4 w-4", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Album */}
            {albums.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-primary" />
                  Álbum
                </Label>
                <Select
                  value={editFormData.album_id || "none"}
                  onValueChange={(value) => 
                    setEditFormData({ ...editFormData, album_id: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um álbum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem álbum</SelectItem>
                    {albums.map((album) => (
                      <SelectItem key={album.id} value={album.id}>
                        {album.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Album Dialog */}
      <Dialog open={albumDialogOpen} onOpenChange={setAlbumDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Criar Novo Álbum
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="album-name">Nome do álbum *</Label>
              <Input
                id="album-name"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Ex: Viagem, Família, Igreja..."
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="album-description">Descrição (opcional)</Label>
              <Textarea
                id="album-description"
                value={newAlbumDescription}
                onChange={(e) => setNewAlbumDescription(e.target.value)}
                placeholder="Adicione uma descrição para o álbum..."
                maxLength={200}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlbumDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAlbum}
              disabled={!newAlbumName.trim()}
              className="gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Criar Álbum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Slideshow */}
      <PhotoSlideshow
        photos={filteredPhotos}
        isOpen={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        startIndex={slideshowStartIndex}
      />
    </Card>
  );
});

ProfilePhotos.displayName = 'ProfilePhotos';

// Export as default for lazy loading
export default ProfilePhotos;
