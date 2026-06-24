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
      const commentIds = commentsData.map(c => c.id);
      const { data: myLikes } = await supabase
        .from('verse_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      const likedSet = new Set(myLikes?.map(l => l.comment_id) || []);

      const withLikes = commentsData.map(c => ({
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
      toast({ title: 'Faça login para comentar', variant: 'destructive' });
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);

    try {
      await supabase.from('verse_comments').insert({
        user_id: user.id,
        book,
        chapter,
        verse,
        comment_text: newComment,
      });

      setNewComment('');
      toast({ title: '✨ Comentário publicado!', description: '+5 XP' });
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({ title: 'Erro ao publicar comentário', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.liked_by_me;

    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, liked_by_me: !wasLiked, likes_count: wasLiked ? c.likes_count - 1 : c.likes_count + 1 }
        : c
    ));

    try {
      if (wasLiked) {
        await supabase
          .from('verse_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        await supabase.from('verse_comment_likes').insert({
          user_id: user.id,
          comment_id: commentId,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      loadComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabase.from('verse_comments').delete().eq('id', commentId);
      toast({ title: 'Comentário excluído' });
      loadComments();
    } catch (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleReport = async (commentId: string) => {
    if (!user) return;

    try {
      await supabase.from('verse_comment_reports').insert({
        comment_id: commentId,
        reporter_id: user.id,
        reason: 'Conteúdo inapropriado',
      });
      toast({ title: 'Comentário denunciado', description: 'Nossa equipe irá analisar' });
    } catch (error) {
      toast({ title: 'Erro ao denunciar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
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
            placeholder="Compartilhe sua reflexão sobre este versículo..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button onClick={handleSubmit} disabled={loading || !newComment.trim()} size="sm">
            Publicar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30">
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
              <p className="text-sm mt-2 whitespace-pre-wrap">{comment.comment_text}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleLike(comment.id)}
                className={`mt-2 gap-2 ${comment.liked_by_me ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-4 w-4 ${comment.liked_by_me ? 'fill-current' : ''}`} />
                {comment.likes_count > 0 && comment.likes_count}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
