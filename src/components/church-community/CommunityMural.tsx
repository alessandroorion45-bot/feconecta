import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import WordOfWeekModal from "./WordOfWeekModal";
import {
  MURAL_POST_TYPES, POST_TYPE_BY_VALUE,
  canPostWordOfWeek, canModerateMural, getRoleInfo,
} from "@/lib/communityRoles";
import { Send, Sparkles, Trash2, MessageCircle, Loader2, Megaphone, Share2, Bookmark, FileText, Paperclip, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

const sb = supabase as any;

export interface MuralPost {
  id: string;
  community_id: string;
  user_id: string;
  type: string;
  title: string | null;
  content: string;
  verse_reference: string | null;
  verse_text: string | null;
  applications: string | null;
  reflection_questions: string | null;
  image_url?: string | null;
  pdf_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  youtube_url?: string | null;
  attachments?: { name: string; url: string }[] | null;
  is_pinned: boolean;
  created_at: string;
  profile?: { full_name: string; username: string; avatar_url: string | null };
  author_role?: string | null;
  amen_count: number;
  amened_by_me: boolean;
  comment_count: number;
}

interface MuralComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface CommunityMuralProps {
  communityId: string;
  userId: string;
  myRole: string | null;
}

const CommunityMural = ({ communityId, userId, myRole }: CommunityMuralProps) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSql, setNeedsSql] = useState(false);
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [newPostType, setNewPostType] = useState("announcement");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<MuralComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [wordSaved, setWordSaved] = useState(false);

  const shareWordOfWeek = async (post: MuralPost) => {
    const text = `✨ Palavra da Semana: ${post.title || ""}\n\n${post.verse_text ? `"${post.verse_text}" — ${post.verse_reference}\n\n` : ""}${post.content}`.slice(0, 500);
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title || "Palavra da Semana", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copiado! 📋", description: "Cole onde quiser compartilhar" });
      }
    } catch { /* usuário cancelou */ }
  };

  const saveWordOfWeek = async (post: MuralPost) => {
    try {
      const { error } = await sb.from("feed_favorites").upsert(
        { user_id: userId, item_type: "community_post", item_id: post.id },
        { onConflict: "user_id,item_type,item_id" }
      );
      if (error) throw error;
      setWordSaved(true);
      toast({ title: "Salvo nos favoritos! ⭐" });
    } catch {
      toast({ title: "Não foi possível salvar", variant: "destructive" });
    }
  };

  const loadPosts = useCallback(async () => {
    const { data, error } = await sb
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setNeedsSql(true);
      setLoading(false);
      return;
    }

    const list: any[] = data || [];
    const userIds = [...new Set(list.map(p => p.user_id))];

    const [profilesRes, amensRes, commentsRes, membersRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      list.length
        ? sb.from("community_post_amens").select("post_id, user_id").in("post_id", list.map(p => p.id))
        : Promise.resolve({ data: [] as any[] }),
      list.length
        ? sb.from("community_post_comments").select("post_id").in("post_id", list.map(p => p.id))
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? supabase.from("church_community_members").select("user_id, role")
            .eq("community_id", communityId).in("user_id", userIds).eq("is_active", true)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const roleMap = new Map((membersRes.data || []).map((m: any) => [m.user_id, m.role]));
    const amens: any[] = amensRes.data || [];
    const commentCounts = new Map<string, number>();
    (commentsRes.data || []).forEach((c: any) => {
      commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1);
    });

    setPosts(list.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id),
      author_role: roleMap.get(p.user_id) || null,
      amen_count: amens.filter(a => a.post_id === p.id).length,
      amened_by_me: amens.some(a => a.post_id === p.id && a.user_id === userId),
      comment_count: commentCounts.get(p.id) || 0,
    })));
    setLoading(false);
  }, [communityId, userId]);

  useEffect(() => {
    loadPosts();

    const channel = supabase
      .channel(`mural-${communityId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts", filter: `community_id=eq.${communityId}` },
        () => loadPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, loadPosts]);

  const publishPost = async () => {
    if (!newPostContent.trim()) return;
    setPublishing(true);

    const { error } = await sb.from("community_posts").insert({
      community_id: communityId,
      user_id: userId,
      type: newPostType,
      title: newPostTitle.trim() || null,
      content: newPostContent.trim(),
    });

    if (error) {
      toast({
        title: "Erro ao publicar",
        description: error.message?.includes("does not exist")
          ? "Aplique a atualização do banco (APLICAR_COMUNIDADE_SQL.sql)"
          : error.message,
        variant: "destructive",
      });
    } else {
      setNewPostTitle("");
      setNewPostContent("");
      toast({ title: "Publicado no mural! 📌" });
      loadPosts();
    }
    setPublishing(false);
  };

  const toggleAmen = async (post: MuralPost) => {
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, amened_by_me: !p.amened_by_me, amen_count: p.amen_count + (p.amened_by_me ? -1 : 1) }
      : p
    ));
    if (post.amened_by_me) {
      await sb.from("community_post_amens").delete().eq("post_id", post.id).eq("user_id", userId);
    } else {
      await sb.from("community_post_amens").insert({ post_id: post.id, user_id: userId });
    }
  };

  const deletePost = async (post: MuralPost) => {
    const { error } = await sb.from("community_posts").delete().eq("id", post.id);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      toast({ title: "Publicação removida" });
    }
  };

  const loadComments = async (postId: string) => {
    const { data } = await sb
      .from("community_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const list: any[] = data || [];
    if (list.length) {
      const ids = [...new Set(list.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles").select("id, full_name, avatar_url").in("id", ids);
      const map = new Map((profiles || []).map(p => [p.id, p]));
      list.forEach(c => { c.profile = map.get(c.user_id); });
    }
    setComments(list);
  };

  const toggleComments = async (postId: string) => {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    await loadComments(postId);
    setOpenComments(postId);
  };

  const submitComment = async (postId: string) => {
    const content = newComment.trim();
    if (!content) return;
    const { error } = await sb.from("community_post_comments").insert({
      post_id: postId, user_id: userId, content,
    });
    if (!error) {
      setNewComment("");
      await loadComments(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    }
  };

  if (needsSql) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Mural quase pronto!</h3>
          <p className="text-muted-foreground">
            Aplique o arquivo <strong>APLICAR_COMUNIDADE_SQL.sql</strong> no SQL Editor do Supabase para ativar o mural.
          </p>
        </CardContent>
      </Card>
    );
  }

  const wordOfWeek = posts.find(p => p.type === "word_of_week" && p.is_pinned);
  const regularPosts = posts.filter(p => p.id !== wordOfWeek?.id);

  return (
    <div className="space-y-4">
      {/* Palavra da Semana em destaque */}
      {wordOfWeek && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-amber-500/5 to-primary/5 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                ✨ Palavra da Semana
              </CardTitle>
              {canModerateMural(myRole) && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deletePost(wordOfWeek)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Por {wordOfWeek.profile?.full_name || "Liderança"} ({getRoleInfo(wordOfWeek.author_role).label}) ·{" "}
              {formatDistanceToNow(new Date(wordOfWeek.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {wordOfWeek.title && <h3 className="text-xl font-bold">{wordOfWeek.title}</h3>}
            {wordOfWeek.verse_text && (
              <blockquote className="border-l-4 border-primary pl-3 italic text-sm">
                "{wordOfWeek.verse_text}"
                {wordOfWeek.verse_reference && <span className="not-italic font-medium"> — {wordOfWeek.verse_reference}</span>}
              </blockquote>
            )}
            <p className="whitespace-pre-wrap text-sm">{wordOfWeek.content}</p>

            {wordOfWeek.image_url && (
              <img src={wordOfWeek.image_url} alt={wordOfWeek.title || "Estudo da semana"} className="rounded-lg w-full max-h-72 object-cover" />
            )}

            {wordOfWeek.youtube_url && getYoutubeEmbedUrl(wordOfWeek.youtube_url) && (
              <div className="rounded-lg overflow-hidden aspect-video">
                <iframe
                  title="Vídeo do estudo"
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(wordOfWeek.youtube_url) || undefined}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {wordOfWeek.video_url && (
              <video src={wordOfWeek.video_url} controls className="rounded-lg w-full max-h-72" />
            )}

            {wordOfWeek.audio_url && (
              <audio src={wordOfWeek.audio_url} controls className="w-full" />
            )}

            {(wordOfWeek.pdf_url || (wordOfWeek.attachments && wordOfWeek.attachments.length > 0)) && (
              <div className="flex flex-wrap gap-2">
                {wordOfWeek.pdf_url && (
                  <a href={wordOfWeek.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-background/60 hover:bg-background rounded-lg px-2.5 py-1.5 border">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Material em PDF <Download className="h-3 w-3" />
                  </a>
                )}
                {(wordOfWeek.attachments || []).map(a => (
                  <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-background/60 hover:bg-background rounded-lg px-2.5 py-1.5 border">
                    <Paperclip className="h-3.5 w-3.5" /> {a.name} <Download className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}

            {wordOfWeek.applications && (
              <div className="bg-background/60 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">🎯 Aplicações práticas</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{wordOfWeek.applications}</p>
              </div>
            )}
            {wordOfWeek.reflection_questions && (
              <div className="bg-background/60 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">💭 Para refletir</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{wordOfWeek.reflection_questions}</p>
              </div>
            )}
            <div className="flex items-center gap-1 pt-1 flex-wrap">
              <Button variant="ghost" size="sm" className={cn("gap-1.5", wordOfWeek.amened_by_me && "text-primary")}
                onClick={() => toggleAmen(wordOfWeek)}>
                🙏 Amém ({wordOfWeek.amen_count})
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toggleComments(wordOfWeek.id)}>
                <MessageCircle className="h-4 w-4" />
                {wordOfWeek.comment_count}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => shareWordOfWeek(wordOfWeek)}>
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button variant="ghost" size="sm" className={cn("gap-1.5", wordSaved && "text-yellow-500")}
                onClick={() => saveWordOfWeek(wordOfWeek)}>
                <Bookmark className={cn("h-4 w-4", wordSaved && "fill-current")} />
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            </div>
            {openComments === wordOfWeek.id && (
              <CommentsBlock
                comments={comments}
                newComment={newComment}
                setNewComment={setNewComment}
                onSubmit={() => submitComment(wordOfWeek.id)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Botão Palavra da Semana (líderes) */}
      {canPostWordOfWeek(myRole) && (
        <Button
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-2"
          onClick={() => setWordModalOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          {wordOfWeek ? "Publicar nova Palavra da Semana" : "Publicar Palavra da Semana"}
        </Button>
      )}

      {/* Composer do mural */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            <Select value={newPostType} onValueChange={setNewPostType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MURAL_POST_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2"><span>{t.emoji}</span>{t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Título (opcional)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              maxLength={100}
              className="flex-1"
            />
          </div>
          <Textarea
            placeholder="Compartilhe com a comunidade..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
            maxLength={1000}
            className="resize-none"
          />
          <Button onClick={publishPost} disabled={publishing || !newPostContent.trim()} className="w-full gap-2">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publicar no Mural
          </Button>
        </CardContent>
      </Card>

      {/* Lista do mural */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : regularPosts.length === 0 && !wordOfWeek ? (
        <Card className="text-center py-10">
          <CardContent>
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">O mural está vazio. Seja o primeiro a publicar!</p>
          </CardContent>
        </Card>
      ) : (
        regularPosts.map(post => {
          const typeMeta = POST_TYPE_BY_VALUE[post.type] || POST_TYPE_BY_VALUE.announcement;
          const canDelete = post.user_id === userId || canModerateMural(myRole);
          return (
            <Card key={post.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar src={post.profile?.avatar_url || undefined} fallback={post.profile?.full_name || "U"} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {post.profile?.full_name || "Membro"}
                        <span className="text-xs text-muted-foreground ml-1">
                          · {getRoleInfo(post.author_role).emoji} {getRoleInfo(post.author_role).label}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <span>{typeMeta.emoji}</span>
                      <span className="hidden sm:inline">{typeMeta.label}</span>
                    </Badge>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePost(post)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {post.title && <h4 className="font-semibold">{post.title}</h4>}
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                <div className="flex items-center gap-2 pt-1 border-t">
                  <Button variant="ghost" size="sm" className={cn("gap-1.5", post.amened_by_me && "text-primary")}
                    onClick={() => toggleAmen(post)}>
                    🙏 Amém ({post.amen_count})
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toggleComments(post.id)}>
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count}
                  </Button>
                </div>

                {openComments === post.id && (
                  <CommentsBlock
                    comments={comments}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    onSubmit={() => submitComment(post.id)}
                  />
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <WordOfWeekModal
        open={wordModalOpen}
        onOpenChange={setWordModalOpen}
        communityId={communityId}
        userId={userId}
        onSuccess={() => {
          setWordModalOpen(false);
          loadPosts();
        }}
      />
    </div>
  );
};

const CommentsBlock = ({
  comments, newComment, setNewComment, onSubmit,
}: {
  comments: MuralComment[];
  newComment: string;
  setNewComment: (v: string) => void;
  onSubmit: () => void;
}) => (
  <div className="space-y-2 pt-2 border-t">
    <div className="flex gap-2">
      <Textarea
        placeholder="Comentar..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="min-h-[50px] flex-1 resize-none text-sm"
        maxLength={300}
      />
      <Button size="icon" onClick={onSubmit} disabled={!newComment.trim()} className="self-end">
        <Send className="h-4 w-4" />
      </Button>
    </div>
    {comments.map(c => (
      <div key={c.id} className="flex gap-2 p-2 rounded-lg bg-muted/50">
        <UserAvatar src={c.profile?.avatar_url || undefined} fallback={c.profile?.full_name || "U"} size="xs" />
        <div className="min-w-0 flex-1">
          <span className="font-medium text-xs">{c.profile?.full_name || "Membro"}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          <p className="text-sm mt-0.5">{c.content}</p>
        </div>
      </div>
    ))}
  </div>
);

export default CommunityMural;
