import { useState, useEffect } from 'react';
import { Heart, MoreVertical, Flag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  likes_count: number;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  liked_by_me?: boolean;
}

interface VerseCommentsProps {
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  onCountChange: (count: number) => void;
}

export const VerseComments = ({ book, chapter, verse, verseText, onCountChange }: VerseCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [book, chapter, verse]);

  const loadComments = async () => {
    // @ts-ignore - Schema types not updated
    const { data: commentsData } = await supabase
      .from('verse_comments')
      .select(`
        *,
        profiles(username, full_name, avatar_url)
      `)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .eq('is_hidden', false)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (commentsData && user) {
      const commentIds = commentsData.map((c: any) => c.id);
      // @ts-ignore - Schema types not updated
      const { data: myLikes } = await supabase
        .from('verse_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      const likedSet = new Set(myLikes?.map((l: any) => l.comment_id) || []);

      const withLikes = commentsData.map((c: any) => ({
        ...c,
        liked_by_me: likedSet.has(c.id),
      }));

      setComments(withLikes as Comment[]);
      onCountChange(withLikes.length);
    } else if (commentsData) {
      setComments(commentsData as Comment[]);
      onCountChange(commentsData.length);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: '🔒 Login necessário',
        description: 'Você precisa estar logado para comentar',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: '⚠️ Comentário vazio',
        description: 'Digite algo antes de publicar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // @ts-ignore - Schema types not updated
      await supabase.from('verse_comments').insert({
        user_id: user.id,
        book,
        chapter,
        verse,
        comment_text: newComment,
      });

      setNewComment('');
      toast({
        title: '✨ Comentário publicado!',
        description: '+5 XP - Obrigado por compartilhar sua reflexão',
        className: 'animate-in slide-in-from-top bg-green-50 border-green-200',
      });
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: '❌ Erro ao publicar',
        description: 'Tente novamente em alguns segundos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: '🔒 Login necessário',
        description: 'Faça login para curtir comentários',
        variant: 'destructive',
      });
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.liked_by_me;

    // Atualização otimista (UI responde imediatamente)
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, liked_by_me: !wasLiked, likes_count: wasLiked ? c.likes_count - 1 : c.likes_count + 1 }
        : c
    ));

    try {
      if (wasLiked) {
        // @ts-ignore - Schema types not updated
        await supabase
          .from('verse_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        // @ts-ignore - Schema types not updated
        await supabase.from('verse_comment_likes').insert({
          user_id: user.id,
          comment_id: commentId,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Reverter em caso de erro
      loadComments();
      toast({
        title: '❌ Erro ao curtir',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      // @ts-ignore - Schema types not updated
      await supabase.from('verse_comments').delete().eq('id', commentId);
      toast({
        title: '✅ Comentário excluído',
        description: 'Seu comentário foi removido',
      });
      loadComments();
    } catch (error) {
      toast({
        title: '❌ Erro ao excluir',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleReport = async (commentId: string) => {
    if (!user) return;

    try {
      // @ts-ignore - Schema types not updated
      await supabase.from('verse_comment_reports').insert({
        comment_id: commentId,
        reporter_id: user.id,
        reason: 'Conteúdo inapropriado',
      });
      toast({
        title: '🚩 Comentário denunciado',
        description: 'Nossa equipe irá analisar em breve',
        className: 'animate-in slide-in-from-top',
      });
    } catch (error) {
      toast({
        title: '❌ Erro ao denunciar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in duration-300">
      {/* 💬 ÁREA DE NOVO COMENTÁRIO */}
      <div className="flex items-start gap-3">
        {user && (
          <UserAvatar
            src={user.user_metadata?.avatar_url}
            fallback={user.user_metadata?.full_name || 'U'}
            size="sm"
          />
        )}
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="💭 Compartilhe sua reflexão sobre este versículo..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            size="sm"
            className="gap-2 transition-all hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? '⏳ Publicando...' : '✨ Publicar'}
          </Button>
        </div>
      </div>

      {/* 💬 LISTA DE COMENTÁRIOS */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            💭 Seja o primeiro a comentar sobre este versículo!
          </p>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-all animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <UserAvatar
                src={comment.profiles?.avatar_url}
                fallback={comment.profiles?.full_name || 'U'}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{comment.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:scale-110 transition-transform">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user?.id === comment.user_id ? (
                        <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleReport(comment.id)}>
                          <Flag className="h-4 w-4 mr-2" />
                          Denunciar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{comment.comment_text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLike(comment.id)}
                  className={`mt-2 gap-2 transition-all hover:scale-110 ${
                    comment.liked_by_me ? 'text-red-500 animate-pulse' : ''
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 transition-all ${
                      comment.liked_by_me ? 'fill-current scale-110' : ''
                    }`}
                  />
                  {comment.likes_count > 0 && (
                    <span className="font-semibold">{comment.likes_count}</span>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
