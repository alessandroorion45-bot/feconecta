import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VerseComment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profile?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface VerseCommentsProps {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  commentCount?: number;
}

const VerseComments = ({
  bookAbbrev,
  bookName,
  chapter,
  verseNumber,
  verseText,
  commentCount = 0,
}: VerseCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<VerseComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    checkUser();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("verse_comments")
        .select("*")
        .eq("book_abbrev", bookAbbrev)
        .eq("chapter", chapter)
        .eq("verse_number", verseNumber)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url")
            .eq("id", comment.user_id)
            .maybeSingle();
          return { ...comment, profile };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error: any) {
      console.error("Error loading comments:", error);
      toast({
        title: "Erro ao carregar comentários",
        description: "Não foi possível carregar os comentários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, bookAbbrev, chapter, verseNumber]);

  // Real-time subscription for new comments
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`verse-comments-${bookAbbrev}-${chapter}-${verseNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'verse_comments',
          filter: `book_abbrev=eq.${bookAbbrev}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            loadComments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, bookAbbrev, chapter, verseNumber]);

  // Sanitize text to prevent XSS
  // Using centralized sanitization from validation lib
  const sanitizeComment = (text: string): string => {
    return text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .replace(/`/g, "&#x60;")
      .trim();
  };

  const handleSubmit = async () => {
    const trimmedComment = newComment.trim();
    
    if (!trimmedComment) {
      toast({
        title: "Comentário inválido",
        description: "O comentário não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedComment.length > 300) {
      toast({
        title: "Comentário muito longo",
        description: "O comentário deve ter no máximo 300 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comentar.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const sanitizedComment = sanitizeComment(trimmedComment);
      
      const { error } = await supabase.from("verse_comments").insert({
        user_id: user.id,
        book_abbrev: bookAbbrev,
        book_name: bookName,
        chapter,
        verse_number: verseNumber,
        verse_text: verseText,
        comment_text: sanitizedComment,
      });

      if (error) throw error;

      toast({
        title: "Comentário enviado com sucesso!",
        description: "Seu comentário foi publicado.",
      });

      setNewComment("");
      await loadComments();
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Erro ao enviar comentário",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("verse_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Comentário removido",
        description: "Seu comentário foi excluído.",
      });

      await loadComments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-8 px-2 sm:px-3"
          aria-label={`Comentar versículo, ${commentCount} comentários`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="text-xs">{commentCount > 0 ? commentCount : ''}</span>
          <span className="hidden sm:inline text-xs">Comentar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby="verse-comment-desc">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Comentários - {bookName} {chapter}:{verseNumber}
          </DialogTitle>
        </DialogHeader>

        <p id="verse-comment-desc" className="sr-only">Comentários do versículo</p>

        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <p className="text-sm italic">"{verseText}"</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Escreva um comentário sobre este versículo..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={300}
              className="resize-none"
              rows={3}
              aria-label="Campo de comentário"
            />
            <div className="flex justify-between items-center">
              <span 
                className={`text-xs ${newComment.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {newComment.length}/300 caracteres
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim() || newComment.length > 300}
                className="gap-2"
                aria-label="Enviar comentário"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4" aria-live="polite" aria-label="Lista de comentários">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <UserAvatar
                    src={comment.profile?.avatar_url}
                    fallback={comment.profile?.full_name || "U"}
                    size="xs"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.profile?.full_name || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{comment.profile?.username || "usuario"}
                      </span>
                      {currentUserId === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-auto"
                          onClick={() => handleDelete(comment.id)}
                          aria-label="Excluir comentário"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mt-1">{comment.comment_text}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerseComments;
