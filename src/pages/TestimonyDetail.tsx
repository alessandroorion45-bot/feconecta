import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Sparkles, Share2, Volume2, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PostAuthorBadges } from "@/components/PostAuthorBadges";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@supabase/supabase-js";

interface TestimonyData {
  id: string;
  title: string;
  content: string;
  glory_count: number;
  likes_count: number;
  user_id: string;
  created_at: string;
  audio_url?: string | null;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    cover_image_url: string | null;
  } | null;
  user_liked?: boolean;
  user_gloried?: boolean;
  comments_count?: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const MAX_COMMENT_LENGTH = 300;

const TestimonyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [testimony, setTestimony] = useState<TestimonyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      loadTestimony();
    }
  }, [id, user]);

  const loadTestimony = async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("testimonies")
      .select(`
        *,
        profiles:user_id (username, full_name, avatar_url, cover_image_url)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Get counts
    const [likesRes, gloriesRes, commentsRes] = await Promise.all([
      supabase.from("testimony_likes").select("id").eq("testimony_id", id),
      supabase.from("testimony_glories").select("id").eq("testimony_id", id),
      supabase.from("testimony_comments").select("id").eq("testimony_id", id),
    ]);

    let testimonyData: TestimonyData = {
      ...data,
      likes_count: likesRes.data?.length || 0,
      glory_count: gloriesRes.data?.length || 0,
      comments_count: commentsRes.data?.length || 0,
    };

    // Check user interactions
    if (user) {
      const [userLike, userGlory] = await Promise.all([
        supabase.from("testimony_likes").select("id").eq("testimony_id", id).eq("user_id", user.id).single(),
        supabase.from("testimony_glories").select("id").eq("testimony_id", id).eq("user_id", user.id).single(),
      ]);

      testimonyData.user_liked = !!userLike.data;
      testimonyData.user_gloried = !!userGlory.data;
    }

    setTestimony(testimonyData);
    setLoading(false);
  };

  const handleLikeClick = async () => {
    if (!user || !testimony) {
      toast({
        title: "Faça login",
        description: "Entre para curtir testemunhos",
        variant: "destructive",
      });
      return;
    }

    setInteractionLoading((prev) => ({ ...prev, like: true }));

    try {
      if (testimony.user_liked) {
        await supabase
          .from("testimony_likes")
          .delete()
          .eq("testimony_id", testimony.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("testimony_likes")
          .insert([{ testimony_id: testimony.id, user_id: user.id }]);
      }

      setTestimony((prev) =>
        prev
          ? {
              ...prev,
              user_liked: !prev.user_liked,
              likes_count: prev.user_liked ? prev.likes_count - 1 : prev.likes_count + 1,
            }
          : null
      );
    } finally {
      setInteractionLoading((prev) => ({ ...prev, like: false }));
    }
  };

  const handleGloryClick = async () => {
    if (!user || !testimony) {
      toast({
        title: "Faça login",
        description: "Entre para glorificar testemunhos",
        variant: "destructive",
      });
      return;
    }

    setInteractionLoading((prev) => ({ ...prev, glory: true }));

    try {
      if (testimony.user_gloried) {
        await supabase
          .from("testimony_glories")
          .delete()
          .eq("testimony_id", testimony.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("testimony_glories")
          .insert([{ testimony_id: testimony.id, user_id: user.id }]);

        toast({
          title: "Glória a Deus! 🙌",
          description: "Você exaltou este testemunho",
        });
      }

      setTestimony((prev) =>
        prev
          ? {
              ...prev,
              user_gloried: !prev.user_gloried,
              glory_count: prev.user_gloried ? prev.glory_count - 1 : prev.glory_count + 1,
            }
          : null
      );
    } finally {
      setInteractionLoading((prev) => ({ ...prev, glory: false }));
    }
  };

  const handleShareClick = () => {
    if (!testimony) return;

    const shareUrl = `${window.location.origin}/testemunho/${testimony.id}`;
    const message = `✨ ${testimony.title}\n\n${testimony.content.substring(0, 150)}${testimony.content.length > 150 ? "..." : ""}\n\n📖 Veja o testemunho completo:\n${shareUrl}`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Abrindo WhatsApp",
      description: "Compartilhe o testemunho com seus amigos!",
    });
  };

  const loadComments = useCallback(async () => {
    if (!testimony) return;

    setLoadingComments(true);
    const { data } = await supabase
      .from("testimony_comments")
      .select("*")
      .eq("testimony_id", testimony.id)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const commentsWithProfiles = data.map((c) => ({
        ...c,
        profiles: profileMap.get(c.user_id),
      }));

      setComments(commentsWithProfiles as Comment[]);
    }
    setLoadingComments(false);
  }, [testimony]);

  const handleOpenComments = () => {
    setCommentsOpen(true);
    setNewComment("");
    loadComments();
  };

  const handleAddComment = async () => {
    if (!user || !testimony || !newComment.trim()) {
      if (!newComment.trim()) {
        toast({
          title: "Comentário vazio",
          description: "Escreva algo antes de enviar.",
          variant: "destructive",
        });
      }
      return;
    }

    if (newComment.length > MAX_COMMENT_LENGTH) {
      toast({
        title: "Comentário muito longo",
        description: `Máximo de ${MAX_COMMENT_LENGTH} caracteres.`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("testimony_comments").insert({
      testimony_id: testimony.id,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      loadComments();
      setTestimony((prev) =>
        prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : null
      );
      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    }
  };

  // Generate meta description
  const metaDescription = testimony
    ? testimony.audio_url
      ? `${testimony.title} — Testemunho em áudio de ${testimony.profiles?.full_name || "Usuário"}`
      : `${testimony.title} — ${testimony.content.substring(0, 150)}...`
    : "Testemunho na Aliança";

  const metaImage = testimony?.profiles?.cover_image_url || testimony?.profiles?.avatar_url || "/placeholder.svg";
  const authorName = testimony?.profiles?.full_name || "Usuário";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="container py-8 max-w-3xl">
          <Skeleton className="h-48 w-full mb-4 rounded-xl" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!testimony) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="container py-8 max-w-3xl text-center">
          <h1 className="text-2xl font-bold mb-4">Testemunho não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Este testemunho pode ter sido removido ou não existe.
          </p>
          <Link to="/testimonies">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Ver todos os testemunhos
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Helmet>
        <title>{testimony.title} — {authorName} | Aliança</title>
        <meta name="description" content={metaDescription} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${testimony.title} — Testemunho de ${authorName}`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content={`${window.location.origin}/testemunho/${testimony.id}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Aliança" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${testimony.title} — Testemunho de ${authorName}`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImage} />
      </Helmet>

      <Header />
      
      <main className="container py-8 max-w-3xl">
        {/* Back link */}
        <Link to="/testimonies" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos testemunhos
        </Link>

        <Card className="shadow-medium overflow-hidden">
          {/* Cover header */}
          <div className="relative">
            <div 
              className="h-32 sm:h-48 bg-gradient-to-br from-primary/20 to-secondary/20 bg-cover bg-center"
              style={testimony.profiles?.cover_image_url ? { backgroundImage: `url(${testimony.profiles.cover_image_url})` } : undefined}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>

            {/* Profile info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex items-end gap-4">
              <Link to={`/profile/${testimony.user_id}`}>
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-lg">
                  <AvatarImage 
                    src={testimony.profiles?.avatar_url || undefined} 
                    alt={`Foto de ${authorName}`}
                    className="object-cover"
                    style={{ filter: "contrast(1.05) brightness(1.02)" }}
                  />
                  <AvatarFallback className="text-xl">
                    {authorName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0 pb-1">
                <Link to={`/profile/${testimony.user_id}`} className="hover:underline">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate drop-shadow-md">
                    {authorName}
                  </h2>
                </Link>
                <p className="text-sm text-white/80 truncate drop-shadow">
                  @{testimony.profiles?.username}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-divine bg-clip-text text-transparent">
              {testimony.title}
            </h1>
            
            {/* Audio player for audio testimonies */}
            {testimony.audio_url ? (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Testemunho em Áudio</span>
                </div>
                <audio
                  controls
                  src={testimony.audio_url}
                  className="w-full h-12"
                  aria-label="Ouvir testemunho"
                >
                  Seu navegador não suporta áudio.
                </audio>
              </div>
            ) : (
              <p className="text-foreground/90 whitespace-pre-wrap text-lg leading-relaxed">
                {testimony.content}
              </p>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              {new Date(testimony.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardContent>

          <CardFooter className="flex gap-2 sm:gap-4 flex-wrap border-t pt-4">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 transition-colors ${
                testimony.user_liked
                  ? "text-red-500 hover:text-red-600"
                  : "hover:text-red-500"
              }`}
              onClick={handleLikeClick}
              disabled={interactionLoading.like}
              aria-label="Curtir este testemunho"
            >
              {interactionLoading.like ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${testimony.user_liked ? "fill-current" : ""}`}
                />
              )}
              <span aria-live="polite">Curtir ({testimony.likes_count})</span>
            </Button>

            {/* Glory Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 transition-colors ${
                testimony.user_gloried
                  ? "text-amber-500 hover:text-amber-600"
                  : "hover:text-amber-500"
              }`}
              onClick={handleGloryClick}
              disabled={interactionLoading.glory}
              aria-label="Marcar Glória a Deus"
            >
              {interactionLoading.glory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles
                  className={`h-4 w-4 ${testimony.user_gloried ? "fill-current" : ""}`}
                />
              )}
              <span aria-live="polite">Glória a Deus ({testimony.glory_count})</span>
            </Button>

            {/* Comments Button */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-primary"
              onClick={handleOpenComments}
              aria-label="Ver e adicionar comentários"
            >
              <MessageCircle className="h-4 w-4" />
              <span aria-live="polite">Comentar ({testimony.comments_count || 0})</span>
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleShareClick}
              aria-label="Compartilhar testemunho"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartilhar</span>
            </Button>
          </CardFooter>
        </Card>

        {/* Comments Dialog */}
        <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comentários ({testimony.comments_count || 0})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-80">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                <div className="space-y-4 pr-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback>
                          {comment.profiles?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-medium truncate">
                            {comment.profiles?.full_name || "Usuário"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            @{comment.profiles?.username}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 mt-0.5 break-words">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {user ? (
              <div className="space-y-2 mt-4 border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    maxLength={MAX_COMMENT_LENGTH}
                    aria-label="Campo de comentário"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Enviar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {newComment.length}/{MAX_COMMENT_LENGTH}
                </p>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground mt-4 border-t pt-4">
                <Link to="/auth" className="text-primary hover:underline">Faça login</Link> para comentar
              </p>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TestimonyDetail;
