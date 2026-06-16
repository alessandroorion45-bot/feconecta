import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  Loader2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface PhotoCommentsProps {
  photoId: string;
  isOpen: boolean;
}

export const PhotoComments = ({ photoId, isOpen }: PhotoCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
      loadCurrentUser();
    }
  }, [photoId, isOpen]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("photo_comments")
        .select("*")
        .eq("photo_id", photoId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for each comment
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
        .from("photo_comments")
        .insert({
          photo_id: photoId,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch profile for new comment
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("id", currentUserId)
        .single();

      setComments([...comments, { ...data, profile }]);
      setNewComment("");
      
      toast({
        title: "Comentário enviado!",
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

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("photo_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentId));
      
      toast({
        title: "Comentário removido",
        description: "O comentário foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "d 'de' MMM 'às' HH:mm", { locale: ptBR });
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span>Comentários ({comments.length})</span>
      </div>

      {/* Comments List */}
      <ScrollArea className="h-[200px] pr-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum comentário ainda.</p>
            <p>Seja o primeiro a comentar!</p>
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
                      <p className="text-sm break-words">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                      {currentUserId === comment.user_id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                        >
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

      {/* New Comment Input */}
      {currentUserId && (
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="min-h-[60px] resize-none text-sm"
            maxLength={500}
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
    </div>
  );
};
