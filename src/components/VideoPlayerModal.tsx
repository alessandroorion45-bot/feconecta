import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/UserAvatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send,
  Trash2,
  X,
  Loader2,
  Globe,
  Lock,
  Users,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface VideoPlayerModalProps {
  video: VideoData | null;
  onClose: () => void;
  currentUserId: string | null;
  onVideoUpdate?: () => void;
}

const VISIBILITY_ICONS = {
  public: Globe,
  private: Lock,
  friends: Users,
  custom: UserCheck
};

const VISIBILITY_LABELS = {
  public: 'Público',
  private: 'Privado',
  friends: 'Amigos',
  custom: 'Personalizado'
};

export const VideoPlayerModal = ({ 
  video, 
  onClose, 
  currentUserId,
  onVideoUpdate 
}: VideoPlayerModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (video) {
      setLikesCount(video.likes_count);
      loadComments();
      checkLikeStatus();
      incrementViews();
    }
  }, [video?.id]);

  const loadComments = async () => {
    if (!video) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("video_comments")
        .select("*")
        .eq("video_id", video.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for comments
      const commentsData = data || [];
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      setComments(commentsData.map(c => ({
        ...c,
        profiles: profilesMap.get(c.user_id)
      })) as Comment[]);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const checkLikeStatus = async () => {
    if (!video || !currentUserId) return;
    try {
      const { data } = await supabase
        .from("video_likes")
        .select("id")
        .eq("video_id", video.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setIsLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const incrementViews = async () => {
    if (!video) return;
    try {
      await supabase
        .from("user_videos")
        .update({ views_count: video.views_count + 1 })
        .eq("id", video.id);
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handleLike = async () => {
    if (!video || !currentUserId) return;
    
    try {
      if (isLiked) {
        await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", video.id)
          .eq("user_id", currentUserId);
        
        await supabase
          .from("user_videos")
          .update({ likes_count: likesCount - 1 })
          .eq("id", video.id);
        
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await supabase
          .from("video_likes")
          .insert({ video_id: video.id, user_id: currentUserId });
        
        await supabase
          .from("user_videos")
          .update({ likes_count: likesCount + 1 })
          .eq("id", video.id);
        
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSendComment = async () => {
    if (!video || !currentUserId || !newComment.trim()) return;
    
    setSendingComment(true);
    try {
      const { error } = await supabase
        .from("video_comments")
        .insert({
          video_id: video.id,
          user_id: currentUserId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      loadComments();
      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi publicado."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comentário.",
        variant: "destructive"
      });
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("video_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!video) return;
    
    const shareUrl = `${window.location.origin}/videos?v=${video.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || "Confira este vídeo!",
          url: shareUrl
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link do vídeo foi copiado para a área de transferência."
      });
    }
  };

  if (!video) return null;

  const VisibilityIcon = VISIBILITY_ICONS[video.visibility];

  return (
    <Dialog open={!!video} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Video Section */}
          <div className="flex-1 bg-black">
            <div className="aspect-video">
              <video
                src={video.video_url}
                className="w-full h-full"
                controls
                autoPlay
              />
            </div>
          </div>

          {/* Info & Comments Section */}
          <div className={cn(
            "flex flex-col bg-background",
            showComments ? "w-full lg:w-96" : "w-full lg:w-80"
          )}>
            {/* Video Info */}
            <div className="p-4 border-b">
              <div className="flex items-start gap-3">
                {video.profiles && (
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      onClose();
                      navigate(`/user/${video.user_id}`);
                    }}
                  >
                    <UserAvatar
                      src={video.profiles.avatar_url}
                      fallback={video.profiles.full_name}
                      size="sm"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                  {video.profiles && (
                    <p 
                      className="text-sm text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={() => {
                        onClose();
                        navigate(`/user/${video.user_id}`);
                      }}
                    >
                      {video.profiles.full_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <VisibilityIcon className="h-3 w-3" />
                    <span>{VISIBILITY_LABELS[video.visibility]}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(video.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}</span>
                  </div>
                </div>
              </div>

              {video.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                  {video.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={handleLike}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  {likesCount}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {comments.length}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b">
                  <h4 className="font-semibold text-sm">
                    Comentários ({comments.length})
                  </h4>
                </div>

                <ScrollArea className="flex-1 p-3">
                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum comentário ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <UserAvatar
                            src={comment.profiles?.avatar_url}
                            fallback={comment.profiles?.full_name || "U"}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {comment.profiles?.full_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </span>
                              {comment.user_id === currentUserId && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-auto"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-0.5">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Comment Input */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="resize-none"
                      maxLength={500}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || sendingComment}
                    >
                      {sendingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
