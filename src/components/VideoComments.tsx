import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MessageCircle, 
  Send, 
  Loader2,
  User,
  Trash2,
  Lock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface VideoCommentsProps {
  videoId: string;
  videoOwnerId: string;
  visibility: 'public' | 'private' | 'friends' | 'custom';
  isOpen: boolean;
}

export const VideoComments = ({ videoId, videoOwnerId, visibility, isOpen }: VideoCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canComment, setCanComment] = useState(false);
  const [isVideoOwner, setIsVideoOwner] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
      loadCurrentUser();
    }
  }, [videoId, isOpen]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setIsVideoOwner(user.id === videoOwnerId);
      await checkCanComment(user.id);
    }
  };

  const checkCanComment = async (userId: string) => {
    // Owner can always comment
    if (userId === videoOwnerId) {
      setCanComment(true);
      return;
    }

    // Public videos - anyone can comment
    if (visibility === 'public') {
      setCanComment(true);
      return;
    }

    // Private videos - only owner
    if (visibility === 'private') {
      setCanComment(false);
      return;
    }

    // Friends visibility - check friendship
    if (visibility === 'friends') {
      const { data } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id_1.eq.${userId},user_id_2.eq.${videoOwnerId}),and(user_id_1.eq.${videoOwnerId},user_id_2.eq.${userId})`)
        .maybeSingle();
      
      setCanComment(!!data);
      return;
    }

    // Custom visibility - check allowed viewers
    if (visibility === 'custom') {
      const { data } = await supabase
        .from('video_allowed_viewers')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', userId)
        .maybeSingle();
      
      setCanComment(!!data);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("video_comments")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, username")
            .eq("id", comment.user_id)
            .single();
          
          return { ...comment, profile };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("video_comments")
        .insert({
          video_id: videoId,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("id", currentUserId)
        .single();

      setComments([...comments, { ...data, profile }]);
      setNewComment("");
      
      toast({
        title: "💬 Comentário enviado!",
        description: "Seu comentário foi publicado com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comentário.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from("video_comments")
        .delete()
        .eq("id", commentToDelete);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentToDelete));
      
      toast({
        title: "🗑️ Comentário removido",
        description: "O comentário foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário.",
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "d 'de' MMM 'às' HH:mm", { locale: ptBR });
  };

  // Handle @mentions - highlight them
  const renderCommentContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="text-primary font-medium hover:underline cursor-pointer">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  // Show privacy message if user can't comment
  if (!canComment && visibility !== 'public') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Comentários</span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-lg">
          <Lock className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-center">
            {visibility === 'private' 
              ? 'Comentários desativados para vídeos privados.'
              : 'Apenas amigos do autor podem comentar neste vídeo.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span>Comentários ({comments.length})</span>
      </div>

      <ScrollArea className="h-[250px] pr-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum comentário ainda.</p>
            <p>Seja o primeiro a comentar! 💬</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 group"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {comment.profile?.full_name || "Usuário"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{comment.profile?.username}
                        </span>
                      </div>
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {renderCommentContent(comment.content)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                      {/* Owner can delete any comment, user can delete their own */}
                      {(isVideoOwner || currentUserId === comment.user_id) && (
                        <button
                          onClick={() => confirmDelete(comment.id)}
                          className="flex items-center gap-1 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>

      {currentUserId && canComment && (
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário... Use @ para mencionar alguém 💬"
            className="min-h-[60px] resize-none text-sm"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="h-[60px] w-[60px]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};