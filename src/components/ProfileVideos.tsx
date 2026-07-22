import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Video, 
  Plus, 
  Globe, 
  Lock, 
  Users, 
  UserCheck,
  Play,
  Trash2,
  Heart,
  Eye,
  Upload,
  X,
  Loader2,
  MapPin,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Navigation,
  MessageCircle,
  Pencil,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isSameMonth, isSameYear, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/useGeolocation";
import { VideoComments } from "./VideoComments";

interface VideoData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  visibility: 'public' | 'private' | 'friends' | 'custom';
  views_count: number;
  likes_count: number;
  created_at: string;
  location: string | null;
}

interface ProfileVideosProps {
  userId: string;
  isOwner: boolean;
  isFriend?: boolean;
}

interface MonthGroup {
  month: Date;
  label: string;
  videos: VideoData[];
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público', icon: Globe, color: 'text-green-500' },
  { value: 'friends', label: 'Somente amigos', icon: Users, color: 'text-blue-500' },
  { value: 'private', label: 'Privado', icon: Lock, color: 'text-red-500' },
  { value: 'custom', label: 'Personalizado', icon: UserCheck, color: 'text-purple-500' },
];

export const ProfileVideos = ({ userId, isOwner, isFriend = false }: ProfileVideosProps) => {
  const { toast } = useToast();
  const geolocation = useGeolocation();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [likingVideo, setLikingVideo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'public' as 'public' | 'private' | 'friends' | 'custom',
    location: ''
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    visibility: 'public' as 'public' | 'private' | 'friends' | 'custom',
    location: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadVideo = async (video: VideoData) => {
    setDownloading(true);
    try {
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video_${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado! 📥",
        description: "O vídeo está sendo baixado."
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o vídeo.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    loadCurrentUser();
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
      .from('video_likes')
      .select('video_id')
      .eq('user_id', currentId);
    
    if (data) {
      setLikedVideos(new Set(data.map(l => l.video_id)));
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_videos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos((data || []) as VideoData[]);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupVideosByMonth = (): MonthGroup[] => {
    const groups: MonthGroup[] = [];
    
    videos.forEach(video => {
      const videoDate = parseISO(video.created_at);
      const monthStart = startOfMonth(videoDate);
      
      let group = groups.find(g => isSameMonth(g.month, monthStart) && isSameYear(g.month, monthStart));
      
      if (!group) {
        group = {
          month: monthStart,
          label: format(monthStart, "MMMM 'de' yyyy", { locale: ptBR }),
          videos: []
        };
        groups.push(group);
      }
      
      group.videos.push(video);
    });
    
    groups.sort((a, b) => b.month.getTime() - a.month.getTime());
    
    return groups;
  };

  const monthGroups = groupVideosByMonth();

  const formatVideoDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatShortDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "d MMM", { locale: ptBR });
  };

  const handleGetLocation = async () => {
    const location = await geolocation.getLocation();
    if (location) {
      setFormData(prev => ({ ...prev, location }));
      toast({
        title: "Localização obtida! 📍",
        description: location
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

  const handleLike = async (video: VideoData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUserId || likingVideo === video.id) return;

    setLikingVideo(video.id);
    const isLiked = likedVideos.has(video.id);

    try {
      if (isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', currentUserId);
        
        setLikedVideos(prev => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });
        
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, likes_count: Math.max(0, v.likes_count - 1) } : v
        ));
        if (selectedVideo?.id === video.id) {
          setSelectedVideo({ ...selectedVideo, likes_count: Math.max(0, selectedVideo.likes_count - 1) });
        }
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: video.id, user_id: currentUserId });
        
        setLikedVideos(prev => new Set([...prev, video.id]));
        
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, likes_count: v.likes_count + 1 } : v
        ));
        if (selectedVideo?.id === video.id) {
          setSelectedVideo({ ...selectedVideo, likes_count: selectedVideo.likes_count + 1 });
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLikingVideo(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de vídeo.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O vídeo deve ter no máximo 100MB.",
        variant: "destructive"
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!videoFile || !formData.title.trim()) {
      toast({
        title: "Preencha os campos",
        description: "Título e vídeo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('user_videos')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          video_url: urlData.publicUrl,
          visibility: formData.visibility,
          location: formData.location.trim() || null
        });

      if (insertError) throw insertError;

      toast({
        title: "Vídeo publicado! 🎬",
        description: "Seu vídeo foi publicado com sucesso."
      });

      setVideoFile(null);
      setVideoPreview(null);
      setFormData({ title: '', description: '', visibility: 'public', location: '' });
      setUploadDialogOpen(false);
      loadVideos();

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o vídeo.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (video: VideoData) => {
    setEditingVideo(video);
    setEditFormData({
      title: video.title,
      description: video.description || '',
      visibility: video.visibility,
      location: video.location || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingVideo || !editFormData.title.trim()) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from('user_videos')
        .update({
          title: editFormData.title.trim(),
          description: editFormData.description.trim() || null,
          visibility: editFormData.visibility,
          location: editFormData.location.trim() || null
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      toast({
        title: "Vídeo atualizado!",
        description: "As alterações foram salvas com sucesso."
      });

      setEditDialogOpen(false);
      setEditingVideo(null);
      loadVideos();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o vídeo.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string, videoUrl: string) => {
    try {
      const urlParts = videoUrl.split('/videos/');
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from('videos').remove([filePath]);
      }

      const { error } = await supabase
        .from('user_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Vídeo excluído",
        description: "O vídeo foi removido com sucesso."
      });

      setVideos(videos.filter(v => v.id !== videoId));
      setSelectedVideo(null);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o vídeo.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (video: VideoData) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description || 'Confira este vídeo na Aliança!',
          url: video.video_url
        });
      } else {
        await navigator.clipboard.writeText(video.video_url);
        toast({
          title: "Link copiado!",
          description: "O link do vídeo foi copiado para a área de transferência."
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    const option = VISIBILITY_OPTIONS.find(o => o.value === visibility);
    if (!option) return null;
    const Icon = option.icon;
    return <Icon className={cn("h-3 w-3", option.color)} />;
  };

  const getVisibilityLabel = (visibility: string) => {
    return VISIBILITY_OPTIONS.find(o => o.value === visibility)?.label || visibility;
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
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Vídeos</h3>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Vídeos</h3>
          <span className="text-sm text-muted-foreground">({videos.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {videos.length > 0 && (
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
            <Button 
              size="sm" 
              onClick={() => setUploadDialogOpen(true)}
              className="gap-1.5 h-8 px-3 rounded-full"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Vídeo</span>
            </Button>
          )}
        </div>
      </div>

      {videos.length === 0 ? (
        isOwner ? (
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border/70 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Video className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Nenhum vídeo ainda</p>
              <p className="text-xs text-muted-foreground">Publique o primeiro e conte sua história em movimento.</p>
            </div>
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </button>
        ) : (
          <p className="py-3 text-center text-sm text-muted-foreground">Nenhum vídeo disponível.</p>
        )
      ) : viewMode === 'timeline' ? (
        <div className="space-y-6">
          {monthGroups.length > 1 && (
            <div className="flex items-center justify-center gap-4 pb-4 border-b">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} disabled={selectedMonthIndex === 0} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[200px] justify-center">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium capitalize">{monthGroups[selectedMonthIndex]?.label}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} disabled={selectedMonthIndex === monthGroups.length - 1} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {monthGroups.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2">
              {monthGroups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMonthIndex(idx)}
                  className={cn("w-2 h-2 rounded-full transition-all", idx === selectedMonthIndex ? "bg-primary w-6" : "bg-muted hover:bg-muted-foreground/30")}
                />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={selectedMonthIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              {monthGroups[selectedMonthIndex]?.videos.map((video, index) => (
                <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.3 }} className="group relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-border -z-10 hidden sm:block" />
                  
                  <div className="flex gap-4">
                    <div className="hidden sm:flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{formatShortDate(video.created_at)}</div>
                    </div>

                    <div className="flex-1 bg-muted/30 rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                      <div className="relative cursor-pointer overflow-hidden bg-black" onClick={() => setSelectedVideo(video)}>
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-auto object-contain max-h-[400px]" loading="lazy" />
                        ) : (
                          <video src={video.video_url} className="w-full h-auto object-contain max-h-[400px]" muted preload="metadata" />
                        )}
                        
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="h-8 w-8 text-primary ml-1" />
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                          {getVisibilityIcon(video.visibility)}
                          <span className="text-white text-xs">{getVisibilityLabel(video.visibility)}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <h4 className="font-semibold">{video.title}</h4>
                        {video.description && <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            <span>Publicado em {formatVideoDate(video.created_at)}</span>
                          </div>
                          {video.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/70" />
                              <span>{video.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => handleLike(video, e)}
                              disabled={likingVideo === video.id}
                              className="flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <Heart className={cn("h-4 w-4 transition-all duration-300", likedVideos.has(video.id) ? "fill-red-500 text-red-500 scale-110" : "hover:scale-110", likingVideo === video.id && "animate-pulse")} />
                              <span className={cn("text-sm", likedVideos.has(video.id) && "text-red-500 font-medium")}>{video.likes_count}</span>
                            </button>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-4 w-4" /> {video.views_count}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isOwner && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); openEditDialog(video); }} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); handleDownloadVideo(video); }} disabled={downloading} title="Baixar">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); handleShare(video); }} title="Compartilhar">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            {isOwner && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(video.id, video.video_url); }} title="Remover">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {videos.map((video, index) => (
            <motion.div key={video.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05, duration: 0.3 }} className="group relative bg-black rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedVideo(video)}>
              <div className="relative aspect-video">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <video src={video.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="h-10 w-10 text-white" />
                </div>

                <div className="absolute top-2 right-2">{getVisibilityIcon(video.visibility)}</div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{video.title}</p>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views_count}</span>
                    <span className="flex items-center gap-1"><Heart className={cn("h-3 w-3", likedVideos.has(video.id) && "fill-red-400 text-red-400")} /> {video.likes_count}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Publicar Novo Vídeo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vídeo *</Label>
              {videoPreview ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video src={videoPreview} className="w-full h-auto max-h-64 object-contain" controls />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => { setVideoFile(null); setVideoPreview(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Formato original preservado • Máx. 100MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Digite um título para o vídeo" maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Adicione uma descrição" maxLength={500} rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />Localização (opcional)</Label>
              <div className="flex gap-2">
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: São Paulo, SP" maxLength={100} className="flex-1" />
                <Button type="button" size="icon" variant="outline" onClick={handleGetLocation} disabled={geolocation.loading} className="shrink-0">
                  {geolocation.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quem pode ver</Label>
              <Select value={formData.visibility} onValueChange={(value: 'public' | 'private' | 'friends' | 'custom') => setFormData({ ...formData, visibility: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2"><option.icon className={cn("h-4 w-4", option.color)} />{option.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !videoFile || !formData.title.trim()} className="gap-2">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4" />Publicar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Vídeo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input id="edit-title" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea id="edit-description" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} maxLength={500} rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />Localização</Label>
              <div className="flex gap-2">
                <Input value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="Ex: São Paulo, SP" maxLength={100} className="flex-1" />
                <Button type="button" size="icon" variant="outline" onClick={handleGetEditLocation} disabled={geolocation.loading} className="shrink-0">
                  {geolocation.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Select value={editFormData.visibility} onValueChange={(value: 'public' | 'private' | 'friends' | 'custom') => setEditFormData({ ...editFormData, visibility: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2"><option.icon className={cn("h-4 w-4", option.color)} />{option.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={uploading}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={uploading || !editFormData.title.trim()} className="gap-2">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => { setSelectedVideo(null); setShowComments(false); }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
          {selectedVideo && (
            <div className="flex flex-col lg:flex-row max-h-[90vh]">
              <div className="bg-black flex items-center justify-center min-h-[300px] lg:min-h-[500px] lg:flex-1">
                <video src={selectedVideo.video_url} className="max-w-full max-h-[70vh] lg:max-h-[80vh]" controls autoPlay />
              </div>

              <div className="lg:w-96 p-4 lg:p-6 space-y-4 bg-background overflow-y-auto max-h-[40vh] lg:max-h-[90vh]">
                <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
                {selectedVideo.description && <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/70" /><span>Publicado em {formatVideoDate(selectedVideo.created_at)}</span></div>
                  {selectedVideo.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/70" /><span>{selectedVideo.location}</span></div>}
                  <div className="flex items-center gap-2">{getVisibilityIcon(selectedVideo.visibility)}<span>{getVisibilityLabel(selectedVideo.visibility)}</span></div>
                </div>

                <div className="pt-4 border-t">
                  <button onClick={() => handleLike(selectedVideo)} disabled={likingVideo === selectedVideo.id} className="flex items-center gap-2 hover:text-red-500 transition-colors disabled:opacity-50">
                    <Heart className={cn("h-6 w-6 transition-all duration-300", likedVideos.has(selectedVideo.id) ? "fill-red-500 text-red-500 scale-110" : "hover:scale-110", likingVideo === selectedVideo.id && "animate-pulse")} />
                    <span className={cn("font-medium", likedVideos.has(selectedVideo.id) && "text-red-500")}>{selectedVideo.likes_count} {selectedVideo.likes_count === 1 ? 'curtida' : 'curtidas'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {selectedVideo.views_count} visualizações</span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  {!isOwner && currentUserId && (
                    <Button size="sm" variant={likedVideos.has(selectedVideo.id) ? "default" : "outline"} className={cn("flex-1 transition-all duration-300", likedVideos.has(selectedVideo.id) && "bg-red-500 hover:bg-red-600 text-white")} onClick={() => handleLike(selectedVideo)} disabled={likingVideo === selectedVideo.id}>
                      <Heart className={cn("h-4 w-4 mr-2 transition-transform", likedVideos.has(selectedVideo.id) && "fill-white")} />
                      {likedVideos.has(selectedVideo.id) ? "Curtido" : "Curtir"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowComments(!showComments)}>
                    <MessageCircle className="h-4 w-4 mr-2" />Comentários
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadVideo(selectedVideo)} disabled={downloading}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShare(selectedVideo)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <VideoComments 
                    videoId={selectedVideo.id} 
                    videoOwnerId={selectedVideo.user_id}
                    visibility={selectedVideo.visibility}
                    isOpen={showComments} 
                  />
                </div>

                {isOwner && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(selectedVideo)}>
                      <Pencil className="h-4 w-4 mr-2" />Editar
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(selectedVideo.id, selectedVideo.video_url)}>
                      <Trash2 className="h-4 w-4 mr-2" />Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Export as default for lazy loading
export default ProfileVideos;
