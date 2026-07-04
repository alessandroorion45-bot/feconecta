import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  profile?: { username: string; full_name: string; avatar_url: string | null } | null;
}

interface FeedCommentsProps {
  postId: string;
  userId: string | undefined;
  onCountChange?: (delta: number) => void;
}

export const FeedComments = ({ postId, userId, onCountChange }: FeedCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [sending, setSending] = useState(false);
  const [threadsSupported, setThreadsSupported] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Tenta com parent_id (threads); se a coluna não existir ainda, cai para flat
    let rows: any[] | null = null;
    const withThreads = await (supabase as any)
      .from('post_comments')
      .select('id, content, created_at, user_id, parent_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (withThreads.error) {
      setThreadsSupported(false);
      const flat = await (supabase as any)
        .from('post_comments')
        .select('id, content, created_at, user_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      rows = flat.data;
    } else {
      rows = withThreads.data;
    }

    const list: FeedComment[] = rows || [];
    if (list.length) {
      const userIds = [...new Set(list.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      const map = new Map((profiles || []).map(p => [p.id, p]));
      list.forEach(c => { c.profile = map.get(c.user_id) || null; });
    }
    setComments(list);
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!userId) {
      toast({ title: "Faça login", description: "Você precisa estar logado para comentar", variant: "destructive" });
      return;
    }
    const content = newComment.trim();
    if (!content) return;
    setSending(true);

    const payload: any = { post_id: postId, user_id: userId, content };
    if (replyTo && threadsSupported) payload.parent_id = replyTo.id;

    let { error } = await (supabase as any).from('post_comments').insert(payload);
    if (error && payload.parent_id) {
      // Coluna parent_id pode não existir ainda — tenta sem thread
      delete payload.parent_id;
      ({ error } = await (supabase as any).from('post_comments').insert(payload));
    }

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar o comentário", variant: "destructive" });
    } else {
      setNewComment("");
      setReplyTo(null);
      onCountChange?.(1);
      await load();
    }
    setSending(false);
  };

  const roots = comments.filter(c => !c.parent_id);
  const repliesOf = (id: string) => comments.filter(c => c.parent_id === id);

  const CommentRow = ({ comment, isReply }: { comment: FeedComment; isReply?: boolean }) => (
    <div className={isReply ? "ml-8" : ""}>
      <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
        <UserAvatar
          src={comment.profile?.avatar_url || undefined}
          fallback={comment.profile?.full_name || "U"}
          size="xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.profile?.full_name || "Usuário"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.content}</p>
          {!isReply && threadsSupported && (
            <button
              className="text-xs text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1"
              onClick={() => setReplyTo(comment)}
            >
              <Reply className="h-3 w-3" />
              Responder
            </button>
          )}
        </div>
      </div>
      {!isReply && repliesOf(comment.id).map(r => (
        <div key={r.id} className="mt-1">
          <CommentRow comment={r} isReply />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3 pt-3 border-t w-full">
      {userId && (
        <div className="space-y-1">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              <span>Respondendo a {replyTo.profile?.full_name || "comentário"}</span>
              <button className="hover:text-destructive" onClick={() => setReplyTo(null)}>Cancelar</button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder={replyTo ? "Escreva sua resposta..." : "Escreva um comentário..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] flex-1 resize-none"
              maxLength={500}
            />
            <Button
              size="icon"
              onClick={submit}
              disabled={sending || !newComment.trim()}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-2">Carregando comentários...</p>
      ) : roots.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {roots.map(c => <CommentRow key={c.id} comment={c} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Seja o primeiro a comentar! 💬
        </p>
      )}
    </div>
  );
};
