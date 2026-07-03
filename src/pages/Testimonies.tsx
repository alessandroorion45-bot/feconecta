import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Sparkles, Share2, Loader2, Mic, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PostAuthorBadges } from "@/components/PostAuthorBadges";
import UserAvatar from "@/components/UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import AudioRecorder from "@/components/AudioRecorder";

interface Testimony {
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
    avatar_url: string;
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

const Testimonies = () => {
  const { user } = useAuth(); // Usar hook centralizado
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const { toast } = useToast();
  const { trackActivity } = useActivityTracking();
  const { awardXP } = useGamification(user?.id);
  const [newTestimony, setNewTestimony] = useState({ title: "", content: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState<Record<string, boolean>>({});
  const [submittingTestimony, setSubmittingTestimony] = useState(false);

  useEffect(() => {
    if (user) {
      loadTestimonies(user.id);
    } else {
      loadTestimonies();
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("testimonies-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "testimonies" },
        async (payload) => {
          // Novo testemunho adicionado (de qualquer usuário)
          console.log('[Testimonies] 🔔 Novo testemunho via Realtime:', payload);

          // Recarregar lista completa para pegar todos os dados
          if (user) {
            await loadTestimonies(user.id);
          } else {
            await loadTestimonies();
          }

          // Toast de notificação
          toast({
            title: "Novo testemunho! 🙌",
            description: "Alguém compartilhou uma história de fé",
            duration: 3000,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimony_likes" },
        () => {
          if (user) loadTestimonies(user.id);
          else loadTestimonies();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimony_glories" },
        () => {
          if (user) loadTestimonies(user.id);
          else loadTestimonies();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimony_comments" },
        (payload) => {
          // Update comments count in real-time
          if (user) loadTestimonies(user.id);
          else loadTestimonies();

          // If viewing comments for this testimony, reload them
          if (commentsOpen && payload.new && (payload.new as any).testimony_id === commentsOpen) {
            loadComments(commentsOpen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, commentsOpen]);

  const loadTestimonies = async (userId?: string) => {
    console.log('[Testimonies] Carregando testemunhos...');

    try {
      console.log('[Testimonies] 🔍 Iniciando RPC call (bypassa RLS)...');
      const startTime = performance.now();

      // RPC CALL - MUITO mais rápida que query com RLS!
      const queryPromise = supabase.rpc('get_testimonies_fast');

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
          console.error(`[Testimonies] ⏰ TIMEOUT após ${elapsed}s`);
          reject(new Error('TESTIMONIES_QUERY_TIMEOUT'));
        }, 60000) // 60 segundos
      );

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as Awaited<ReturnType<typeof queryPromise>>;

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Testimonies] ⏱️ Query levou ${elapsed}s`);

      if (error) {
        console.error('[Testimonies] ❌ ERRO ao carregar:', error);
        toast({
          title: "Erro ao carregar testemunhos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('[Testimonies] ✅ Testemunhos carregados:', data?.length || 0);

    if (data) {
      // Get counts for each testimony
      const testimonyIds = data.map((t) => t.id);

      // Get likes counts
      const { data: likesData } = await supabase
        .from("testimony_likes")
        .select("testimony_id")
        .in("testimony_id", testimonyIds);

      // Get glories counts
      const { data: gloriesData } = await supabase
        .from("testimony_glories")
        .select("testimony_id")
        .in("testimony_id", testimonyIds);

      // Get comments counts
      const { data: commentsData } = await supabase
        .from("testimony_comments")
        .select("testimony_id")
        .in("testimony_id", testimonyIds);

      // Count occurrences
      const likesCount: Record<string, number> = {};
      const gloriesCount: Record<string, number> = {};
      const commentsCount: Record<string, number> = {};

      likesData?.forEach((l) => {
        likesCount[l.testimony_id] = (likesCount[l.testimony_id] || 0) + 1;
      });
      gloriesData?.forEach((g) => {
        gloriesCount[g.testimony_id] = (gloriesCount[g.testimony_id] || 0) + 1;
      });
      commentsData?.forEach((c) => {
        commentsCount[c.testimony_id] = (commentsCount[c.testimony_id] || 0) + 1;
      });

      let testimoniesWithStatus = data.map((t) => ({
        ...t,
        likes_count: likesCount[t.id] || 0,
        glory_count: gloriesCount[t.id] || 0,
        comments_count: commentsCount[t.id] || 0,
      }));

      if (userId) {
        // Check user interactions
        const { data: userLikes } = await supabase
          .from("testimony_likes")
          .select("testimony_id")
          .eq("user_id", userId);

        const { data: userGlories } = await supabase
          .from("testimony_glories")
          .select("testimony_id")
          .eq("user_id", userId);

        const likedIds = new Set(userLikes?.map((l) => l.testimony_id) || []);
        const gloriedIds = new Set(userGlories?.map((g) => g.testimony_id) || []);

        testimoniesWithStatus = testimoniesWithStatus.map((t) => ({
          ...t,
          user_liked: likedIds.has(t.id),
          user_gloried: gloriedIds.has(t.id),
        }));
      }

      setTestimonies(testimoniesWithStatus);
    }
    } catch (error: any) {
      console.error('[Testimonies] ❌ EXCEÇÃO ao carregar:', error);

      if (error?.message === 'TESTIMONIES_QUERY_TIMEOUT') {
        toast({
          title: "⏰ Timeout ao carregar",
          description: "A conexão está muito lenta. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro inesperado",
          description: error?.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateTestimony = async () => {
    if (!user || !newTestimony.title.trim() || !newTestimony.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o conteúdo do testemunho.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingTestimony(true);

    try {
      // Verificar sessão atual COM TIMEOUT
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SESSION_TIMEOUT')), 3000)
      );

      let currentSession;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        currentSession = (result as any).data.session;
      } catch (err: any) {
        if (err?.message === 'SESSION_TIMEOUT') {
          console.warn('[Testimonies] Session timeout - usando user.id do contexto');
          // Se timeout, usar diretamente o user do contexto
          if (!user?.id) {
            toast({
              title: "Erro de autenticação",
              description: "Faça login novamente.",
              variant: "destructive",
            });
            return;
          }
        } else {
          throw err;
        }
      }

      // Se não conseguiu pegar session mas tem user no contexto, usar ele
      if (!currentSession && user?.id) {
        console.log('[Testimonies] Usando user.id do contexto:', user.id);
      } else if (!currentSession || !currentSession.user) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // IMPORTANTE: Usar session.user.id (ou user.id se session timeout)
      const userId = currentSession?.user?.id || user.id;

      console.log('[Testimonies] Tentando inserir testemunho:', {
        user_id: userId,
        session_user: currentSession?.user?.id,
        state_user: user.id,
        session_valid: !!currentSession,
        title: newTestimony.title.trim(),
        content_length: newTestimony.content.trim().length
      });

      // Usar session.user.id diretamente para garantir match com RLS
      const { data, error } = await supabase
        .from("testimonies")
        .insert({
          user_id: userId, // session.user.id
          title: newTestimony.title.trim(),
          content: newTestimony.content.trim(),
        });

      if (error) {
        console.error('[Testimonies] ❌ ERRO AO INSERIR:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          user_id: user.id,
          session_user: currentSession?.user?.id,
          match: currentSession?.user?.id === user.id
        });

        let errorMessage = "Não foi possível publicar o depoimento";

        if (error.code === '23503') {
          errorMessage = "Erro: Perfil não encontrado no banco de dados";
        } else if (error.code === '42501') {
          errorMessage = "Erro de permissão. Tente fazer logout e login novamente.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Erro ao publicar",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('[Testimonies] ✅ Testemunho inserido com sucesso:', data);
        trackActivity("testimony_shared");

        // Conceder XP por compartilhar testemunho
        await awardXP('testimony_shared');

        toast({
          title: "Glória a Deus! 🙌",
          description: "Seu testemunho foi compartilhado e já está visível para todos!",
        });
        setNewTestimony({ title: "", content: "" });
        setDialogOpen(false);

        // Recarregar TODOS os testemunhos (incluindo o que acabou de postar)
        if (user) {
          await loadTestimonies(user.id);
        } else {
          await loadTestimonies();
        }
      }
    } finally {
      setSubmittingTestimony(false);
    }
  };

  const handleLikeClick = async (testimonyId: string, userLiked: boolean) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Entre para curtir testemunhos",
        variant: "destructive",
      });
      return;
    }

    setInteractionLoading((prev) => ({ ...prev, [`like-${testimonyId}`]: true }));

    try {
      if (userLiked) {
        await supabase
          .from("testimony_likes")
          .delete()
          .eq("testimony_id", testimonyId)
          .eq("user_id", user.id);
      } else {
        const { error } = await supabase
          .from("testimony_likes")
          .insert([{ testimony_id: testimonyId, user_id: user.id }]);

        if (error && error.code === "23505") return;
      }

      // Optimistic update
      setTestimonies((prev) =>
        prev.map((t) =>
          t.id === testimonyId
            ? {
                ...t,
                user_liked: !userLiked,
                likes_count: userLiked ? t.likes_count - 1 : t.likes_count + 1,
              }
            : t
        )
      );
    } finally {
      setInteractionLoading((prev) => ({ ...prev, [`like-${testimonyId}`]: false }));
    }
  };

  const handleGloryClick = async (testimonyId: string, userGloried: boolean) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Entre para glorificar testemunhos",
        variant: "destructive",
      });
      return;
    }

    setInteractionLoading((prev) => ({ ...prev, [`glory-${testimonyId}`]: true }));

    try {
      if (userGloried) {
        await supabase
          .from("testimony_glories")
          .delete()
          .eq("testimony_id", testimonyId)
          .eq("user_id", user.id);
      } else {
        const { error } = await supabase
          .from("testimony_glories")
          .insert([{ testimony_id: testimonyId, user_id: user.id }]);

        if (error && error.code === "23505") return;

        toast({
          title: "Glória a Deus! 🙌",
          description: "Você exaltou este testemunho",
        });
      }

      // Optimistic update
      setTestimonies((prev) =>
        prev.map((t) =>
          t.id === testimonyId
            ? {
                ...t,
                user_gloried: !userGloried,
                glory_count: userGloried ? t.glory_count - 1 : t.glory_count + 1,
              }
            : t
        )
      );
    } finally {
      setInteractionLoading((prev) => ({ ...prev, [`glory-${testimonyId}`]: false }));
    }
  };

  const handleShareClick = (testimony: Testimony) => {
    const shareUrl = `${window.location.origin}/testemunho/${testimony.id}`;
    const message = `✨ ${testimony.title}\n\n${testimony.audio_url ? "🎙️ Testemunho em áudio" : testimony.content.substring(0, 150)}${testimony.content.length > 150 ? "..." : ""}\n\n📖 Veja o testemunho completo:\n${shareUrl}`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Abrindo WhatsApp",
      description: "Compartilhe o testemunho com seus amigos!",
    });
  };

  const loadComments = useCallback(async (testimonyId: string) => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("testimony_comments")
      .select("*")
      .eq("testimony_id", testimonyId)
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
  }, []);

  const handleOpenComments = (testimonyId: string) => {
    setCommentsOpen(testimonyId);
    setNewComment("");
    loadComments(testimonyId);
  };

  const handleAddComment = async () => {
    if (!user || !commentsOpen || !newComment.trim()) {
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
      testimony_id: commentsOpen,
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
      loadComments(commentsOpen);

      // Conceder XP por comentar
      await awardXP('comment_posted');

      // Update comments count optimistically
      setTestimonies((prev) =>
        prev.map((t) =>
          t.id === commentsOpen
            ? { ...t, comments_count: (t.comments_count || 0) + 1 }
            : t
        )
      );

      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    }
  };

  const handleAudioSuccess = () => {
    setAudioDialogOpen(false);
    if (user) {
      trackActivity("testimony_shared");
      loadTestimonies(user.id);
    }
  };

  const currentTestimony = testimonies.find((t) => t.id === commentsOpen);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        {/* Hero Section Magnético */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/30 p-6 sm:p-8 mb-6 border-2 border-amber-200/50 dark:border-amber-800/30 shadow-xl">
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-400/10 to-yellow-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg animate-pulse">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-700 bg-clip-text text-transparent leading-tight">
                  Testemunhos
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Glória a Deus
                  </span>
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg text-amber-900 dark:text-amber-100 leading-relaxed font-medium mb-3">
              ✨ Compartilhe como <span className="font-bold text-orange-700 dark:text-orange-400">Deus tem agido</span> em sua vida!
            </p>

            <p className="text-sm sm:text-base text-amber-800 dark:text-amber-200 leading-relaxed">
              Seu testemunho pode <span className="font-semibold underline decoration-wavy decoration-orange-500">inspirar milhares</span> de pessoas!
              Conte como Deus transformou, curou, libertou ou abençoou você.
              Cada história é um <span className="font-bold text-orange-700 dark:text-orange-400">milagre vivo</span> que glorifica ao Senhor! 🙌
            </p>
          </div>
        </div>

        {/* Botões de Ação - SEMPRE VISÍVEIS */}
        <div className="mb-6 flex justify-center">
          <div className="flex gap-3 sm:gap-4">
            {user && (
              <Dialog open={audioDialogOpen} onOpenChange={setAudioDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2 border-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300 group">
                    <Mic className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline font-semibold">Gravar Áudio</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Gravar Testemunho em Áudio
                    </DialogTitle>
                  </DialogHeader>
                  <AudioRecorder
                    userId={user.id}
                    onClose={() => setAudioDialogOpen(false)}
                    onSuccess={handleAudioSuccess}
                  />
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white shadow-xl hover:shadow-2xl gap-2 font-bold transition-all duration-300 transform hover:scale-105">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="hidden sm:inline">Compartilhar Testemunho</span>
                  <span className="sm:hidden">Publicar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartilhar Testemunho</DialogTitle>
                </DialogHeader>
                {!user ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      Você precisa estar logado para compartilhar seu testemunho
                    </p>
                    <Button onClick={() => window.location.href = '/auth'} className="bg-gradient-primary">
                      Fazer Login
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      placeholder="Título do testemunho"
                      value={newTestimony.title}
                      onChange={(e) =>
                        setNewTestimony({ ...newTestimony, title: e.target.value })
                      }
                    />
                    <Textarea
                      placeholder="Conte como Deus agiu em sua vida..."
                      value={newTestimony.content}
                      onChange={(e) =>
                        setNewTestimony({ ...newTestimony, content: e.target.value })
                      }
                      rows={6}
                    />
                    <Button
                      onClick={handleCreateTestimony}
                      className="w-full bg-gradient-primary"
                      disabled={submittingTestimony}
                    >
                      {submittingTestimony ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Publicando...
                        </>
                      ) : (
                        "Publicar"
                      )}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          {testimonies.map((testimony) => (
            <Card key={testimony.id} className="relative overflow-hidden shadow-xl border-2 border-amber-200/50 dark:border-amber-800/30 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
              {/* Faixa decorativa dourada */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 animate-pulse" />

              {/* Elementos decorativos de fundo */}
              <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-tr from-yellow-400/10 to-amber-400/10 rounded-full blur-2xl" />

              <CardHeader className="relative z-10">
                <PostAuthorBadges
                  userId={testimony.user_id}
                  username={testimony.profiles?.username || "Usuário"}
                  fullName={testimony.profiles?.full_name || "Membro da Comunidade"}
                  avatarUrl={testimony.profiles?.avatar_url || null}
                />
              </CardHeader>

              <CardContent className="relative z-10">
                {/* Título com destaque GLORIOSO */}
                <div className="mb-4 relative">
                  <div className="absolute -left-3 top-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-700 bg-clip-text text-transparent leading-tight pl-3">
                    {testimony.title}
                  </h3>
                </div>

                {/* Audio player ESTILIZADO */}
                {testimony.audio_url ? (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-xl p-5 mb-4 border-2 border-amber-200/50 dark:border-amber-800/30 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
                        <Volume2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-amber-700 dark:text-amber-400">
                          🎙️ Testemunho em Áudio
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-500">
                          Ouça como Deus agiu!
                        </span>
                      </div>
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
                  <div className="relative">
                    <p className="text-foreground/90 text-base leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-amber-300 dark:border-amber-700/50">
                      {testimony.content}
                    </p>
                  </div>
                )}

                {/* Badge "Glória a Deus" */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full border border-amber-300 dark:border-amber-700">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Glória a Deus!
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(testimony.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 sm:gap-4 flex-wrap">
                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 transition-colors ${
                    testimony.user_liked
                      ? "text-red-500 hover:text-red-600"
                      : "hover:text-red-500"
                  }`}
                  onClick={() =>
                    handleLikeClick(testimony.id, testimony.user_liked || false)
                  }
                  disabled={interactionLoading[`like-${testimony.id}`]}
                  aria-label="Curtir este testemunho"
                >
                  {interactionLoading[`like-${testimony.id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-4 w-4 ${
                        testimony.user_liked ? "fill-current" : ""
                      }`}
                    />
                  )}
                  <span aria-live="polite">
                    Curtir ({testimony.likes_count})
                  </span>
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
                  onClick={() =>
                    handleGloryClick(testimony.id, testimony.user_gloried || false)
                  }
                  disabled={interactionLoading[`glory-${testimony.id}`]}
                  aria-label="Marcar Glória a Deus"
                >
                  {interactionLoading[`glory-${testimony.id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles
                      className={`h-4 w-4 ${
                        testimony.user_gloried ? "fill-current" : ""
                      }`}
                    />
                  )}
                  <span aria-live="polite">
                    Glória a Deus ({testimony.glory_count})
                  </span>
                </Button>

                {/* Comments Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:text-primary"
                  onClick={() => handleOpenComments(testimony.id)}
                  aria-label="Ver e adicionar comentários"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span aria-live="polite">
                    Comentar ({testimony.comments_count || 0})
                  </span>
                </Button>

                {/* Share Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShareClick(testimony)}
                  aria-label="Compartilhar testemunho"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </Button>
              </CardFooter>
            </Card>
          ))}

          {testimonies.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                <Sparkles className="relative h-20 w-20 text-amber-500 animate-bounce" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400 mb-3">
                Seja o Primeiro! ✨
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                Ainda não há testemunhos aqui. <span className="font-semibold text-amber-700 dark:text-amber-400">Compartilhe sua história</span> e inspire outras pessoas com o que Deus fez em sua vida! 🙌
              </p>
              {user && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white shadow-xl gap-2 font-bold animate-pulse">
                      <Sparkles className="h-5 w-5" />
                      Publicar Primeiro Testemunho
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Comments Dialog - removed duplicate X button */}
        <Dialog
          open={!!commentsOpen}
          onOpenChange={(open) => !open && setCommentsOpen(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comentários ({currentTestimony?.comments_count || 0})
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
                      <UserAvatar
                        src={comment.profiles?.avatar_url}
                        fallback={comment.profiles?.full_name || "U"}
                        size="xs"
                      />
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
                Faça login para comentar
              </p>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Testimonies;
