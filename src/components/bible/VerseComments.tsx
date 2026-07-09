import { useState, useEffect } from 'react';
import { Heart, MoreVertical, Flag, Trash2, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import UserAvatar from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportContentModal } from '@/components/ReportContentModal';

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  likes_count: number;
  created_at: string;
  parent_comment_id: string | null;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  liked_by_me?: boolean;
  replies?: Comment[];
}

interface VerseCommentsProps {
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  onCountChange: (count: number) => void;
}

type SortOption = 'recent' | 'likes' | 'relevant';

export const VerseComments = ({ book, chapter, verse, onCountChange }: VerseCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardXP } = useGamification(user?.id);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);

  useEffect(() => {
    loadComments();
  }, [book, chapter, verse, sortBy]);

  const loadComments = async () => {
    // Sem join embutido (falha quando o FK não existe no banco remoto);
    // perfis são buscados separadamente
    // @ts-ignore - Schema types not updated
    let { data: allCommentsData, error } = await supabase
      .from('verse_comments')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .eq('is_hidden', false);

    if (error) {
      // Coluna is_hidden pode não existir no remoto — tenta sem o filtro
      console.warn('[VerseComments] Recarregando sem is_hidden:', error.message);
      // @ts-ignore
      ({ data: allCommentsData, error } = await supabase
        .from('verse_comments')
        .select('*')
        .eq('book', book)
        .eq('chapter', chapter)
        .eq('verse', verse));
    }

    if (error) {
      console.error('[VerseComments] Erro ao carregar comentários:', error);
      return;
    }
    if (!allCommentsData) return;

    // Buscar perfis dos autores em lote
    const userIds = [...new Set(allCommentsData.map((c: any) => c.user_id))];
    let profileMap = new Map<string, any>();
    if (userIds.length) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
    }
    allCommentsData = allCommentsData.map((c: any) => ({
      ...c,
      profiles: c.profiles || profileMap.get(c.user_id) || { username: 'usuario', full_name: 'Irmão(ã)', avatar_url: null },
    }));

    // Organizar em árvore
    const commentsMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Primeiro, criar o mapa de todos os comentários
    allCommentsData.forEach((c: any) => {
      commentsMap.set(c.id, { ...c, replies: [] });
    });

    // Obter curtidas do usuário se logado
    let likedSet = new Set<string>();
    if (user) {
      const commentIds = allCommentsData.map((c: any) => c.id);
      // @ts-ignore - Table exists in database but not in generated types
      const { data: myLikes } = await supabase
        .from('verse_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      likedSet = new Set(myLikes?.map((l: any) => l.comment_id) || []);
    }

    // Construir árvore
    allCommentsData.forEach((c: any) => {
      const comment = commentsMap.get(c.id)!;
      comment.liked_by_me = likedSet.has(c.id);

      if (c.parent_comment_id) {
        // É uma resposta
        const parent = commentsMap.get(c.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        // É comentário raiz
        rootComments.push(comment);
      }
    });

    // Ordenar comentários raiz
    sortComments(rootComments, sortBy);

    // Ordenar respostas também
    rootComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    });

    setComments(rootComments);
    onCountChange(allCommentsData.length);
  };

  const sortComments = (comments: Comment[], sortOption: SortOption) => {
    switch (sortOption) {
      case 'likes':
        comments.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'relevant':
        comments.sort((a, b) => {
          const scoreA = a.likes_count * 2 + (a.replies?.length || 0) * 3;
          const scoreB = b.likes_count * 2 + (b.replies?.length || 0) * 3;
          return scoreB - scoreA;
        });
        break;
      case 'recent':
      default:
        comments.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  };

  const handleSubmit = async (parentId?: string | null) => {
    if (!user) {
      toast({
        title: '🔒 Login necessário',
        description: 'Você precisa estar logado para comentar',
        variant: 'destructive',
      });
      return;
    }

    const text = parentId ? replyText : newComment;

    if (!text.trim()) {
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
        comment_text: text,
        parent_comment_id: parentId || null,
      });

      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }

      // Conceder XP por comentar
      if (user) {
        try {
          await awardXP('verse_commented');
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      }

      toast({
        title: parentId ? '✨ Resposta publicada!' : '✨ Comentário publicado!',
        description: '+5 XP - Obrigado por compartilhar sua reflexão',
        className: 'animate-in slide-in-from-top bg-green-50 border-green-200',
      });

      // Aguardar um pouco antes de recarregar para garantir que o banco salvou
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadComments();
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
        // @ts-ignore - Table exists in database but not in generated types
        await supabase
          .from('verse_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        // @ts-ignore - Table exists in database but not in generated types
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

  const handleReport = (comment: Comment) => {
    if (!user) return;
    setReportingComment(comment);
  };

  // Componente recursivo para renderizar comentário e suas respostas
  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-all animate-in fade-in slide-in-from-bottom-2 ${
        depth > 0 ? 'ml-8 mt-2 border-l-2 border-primary/20' : ''
      }`}
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
                <DropdownMenuItem onClick={() => handleReport(comment)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Denunciar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{comment.comment_text}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLike(comment.id)}
            className={`gap-2 transition-all hover:scale-110 ${
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
          {depth < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="gap-2 transition-all hover:scale-110"
            >
              <Reply className="h-4 w-4" />
              Responder
            </Button>
          )}
        </div>

        {/* Formulário de resposta */}
        {replyingTo === comment.id && (
          <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/30">
            <Textarea
              placeholder={`Respondendo a ${comment.profiles?.full_name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="resize-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmit(comment.id)}
                disabled={loading || !replyText.trim()}
                size="sm"
                className="gap-2 transition-all hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? '⏳ Publicando...' : '✨ Responder'}
              </Button>
              <Button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Respostas aninhadas */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in duration-300">
      {/* 🎯 BARRA DE ORDENAÇÃO */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          💬 {comments.length === 0 ? 'Nenhum comentário' : `${comments.length} comentário${comments.length !== 1 ? 's' : ''}`}
        </h3>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="likes">Mais curtidos</SelectItem>
            <SelectItem value="relevant">Mais relevantes</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            onClick={() => handleSubmit(null)}
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
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {user && reportingComment && (
        <ReportContentModal
          open={!!reportingComment}
          onOpenChange={(open) => !open && setReportingComment(null)}
          reporterId={user.id}
          reportedUserId={reportingComment.user_id}
          contentType="verse_comment"
          contentId={reportingComment.id}
          contentSnippet={reportingComment.comment_text.slice(0, 100)}
        />
      )}
    </div>
  );
};
