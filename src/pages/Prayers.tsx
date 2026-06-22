import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Plus, 
  Church, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause,
  Search,
  Clock,
  Flame,
  Volume2,
  Sparkles,
  CheckCircle2,
  Filter,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useGamification } from "@/hooks/useGamification";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostAuthorBadges } from "@/components/PostAuthorBadges";
import UserAvatar from "@/components/UserAvatar";
import { PrayerAudioRecorder } from "@/components/PrayerAudioRecorder";
import PrayerGroups from "@/components/PrayerGroups";
import AnsweredPrayerModal from "@/components/AnsweredPrayerModal";
import type { User } from "@supabase/supabase-js";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const categories = ["Saúde", "Família", "Trabalho", "Finanças", "Espiritual", "Esperança", "Outros"];

interface PrayerComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Prayer {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  user_id: string;
  intercessor_count: number;
  audio_url: string | null;
  is_answered: boolean;
  answered_at: string | null;
  answer_testimony: string | null;
  group_id: string | null;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

const PrayerAudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-primary" />
        ) : (
          <Play className="h-5 w-5 text-primary ml-0.5" />
        )}
      </Button>
      <div className="flex-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Oração em áudio</span>
        </div>
      </div>
    </div>
  );
};

const Prayers = () => {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [userIntercessors, setUserIntercessors] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, PrayerComment[]>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [loadingIntercede, setLoadingIntercede] = useState<Set<string>>(new Set());
  const [loadingComment, setLoadingComment] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recentes");
  const [animatedPrayers, setAnimatedPrayers] = useState<Set<string>>(new Set());
  const [showGroups, setShowGroups] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAnswered, setShowAnswered] = useState(false);
  const [answeredModalOpen, setAnsweredModalOpen] = useState(false);
  const [selectedPrayerForAnswer, setSelectedPrayerForAnswer] = useState<Prayer | null>(null);
  const { toast } = useToast();
  const { trackActivity } = useActivityTracking();
  const { awardXP } = useGamification(user?.id);
  const [newPrayer, setNewPrayer] = useState({ title: "", description: "", category: "Espiritual" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if coming from challenge or with invite code
  useEffect(() => {
    const fromChallenge = searchParams.get('from');
    const joinCode = searchParams.get('join');
    
    if (fromChallenge === 'challenge') {
      setDialogOpen(true);
      navigate('/prayers', { replace: true });
    }
    
    if (joinCode) {
      // Open groups and show join dialog
      setShowGroups(true);
      toast({
        title: "Código de convite detectado",
        description: `Use o código ${joinCode} para entrar no grupo`,
      });
      navigate('/prayers', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    if (user) {
      loadUserIntercessors(user.id);
    }
    loadPrayers();

    // Set up realtime subscription
    const channel = supabase
      .channel('prayers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_intercessors' },
        () => {
          loadPrayers();
          if (user) {
            loadUserIntercessors(user.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_comments' },
        () => {
          loadCommentCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadPrayers = async () => {
    const { data, error } = await supabase
      .from("prayers")
      .select(`
        *,
        profiles:user_id (username, full_name, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPrayers(data as Prayer[]);
      loadCommentCounts();
    }
  };

  const loadUserIntercessors = async (userId: string) => {
    const { data } = await supabase
      .from("prayer_intercessors")
      .select("prayer_id")
      .eq("user_id", userId);

    if (data) {
      setUserIntercessors(new Set(data.map(i => i.prayer_id)));
    }
  };

  const loadCommentCounts = async () => {
    const { data } = await supabase
      .from("prayer_comments")
      .select("prayer_id");

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(c => {
        if (c.prayer_id) {
          counts[c.prayer_id] = (counts[c.prayer_id] || 0) + 1;
        }
      });
      setCommentCounts(counts);
    }
  };

  const loadComments = async (prayerId: string) => {
    const { data, error } = await supabase
      .from("prayer_comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles:user_id (username, full_name, avatar_url)
      `)
      .eq("prayer_id", prayerId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(prev => ({ ...prev, [prayerId]: data as unknown as PrayerComment[] }));
    }
  };

  const handleCreatePrayer = async () => {
    if (!user || !newPrayer.title.trim() || (!newPrayer.description.trim() && !audioBlob)) {
      toast({
        title: "Preencha os campos",
        description: "Adicione um título e uma oração (texto ou áudio)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let audioUrl = null;

      // Upload audio if exists
      if (audioBlob) {
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('testimonies-audio')
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('testimonies-audio')
          .getPublicUrl(fileName);

        audioUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("prayers")
        .insert([
          {
            user_id: user.id,
            title: newPrayer.title.trim(),
            description: newPrayer.description.trim() || "Oração em áudio 🙏",
            category: newPrayer.category,
            audio_url: audioUrl,
          },
        ]);

      if (error) throw error;

      trackActivity("prayer_created");

      // Conceder XP por criar oração
      await awardXP('prayer_created');

      toast({
        title: "Oração publicada! 🙏",
        description: "A comunidade estará orando com você",
      });
      setNewPrayer({ title: "", description: "", category: "Espiritual" });
      setAudioBlob(null);
      setDialogOpen(false);
      loadPrayers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível publicar a oração",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleIntercede = async (prayerId: string) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para orar por este pedido",
        variant: "destructive",
      });
      return;
    }

    setLoadingIntercede(prev => new Set(prev).add(prayerId));

    const isAlreadyPraying = userIntercessors.has(prayerId);

    try {
      if (isAlreadyPraying) {
        const { error } = await supabase
          .from("prayer_intercessors")
          .delete()
          .eq("prayer_id", prayerId)
          .eq("user_id", user.id);

        if (error) throw error;

        await supabase
          .from("prayers")
          .update({ intercessor_count: Math.max(0, (prayers.find(p => p.id === prayerId)?.intercessor_count || 1) - 1) })
          .eq("id", prayerId);

        setUserIntercessors(prev => {
          const next = new Set(prev);
          next.delete(prayerId);
          return next;
        });
        
        setPrayers(prev => prev.map(p => 
          p.id === prayerId ? { ...p, intercessor_count: Math.max(0, p.intercessor_count - 1) } : p
        ));
      } else {
        const { error } = await supabase
          .from("prayer_intercessors")
          .insert([{ prayer_id: prayerId, user_id: user.id }]);

        if (error && error.code !== "23505") throw error;

        await supabase
          .from("prayers")
          .update({ intercessor_count: (prayers.find(p => p.id === prayerId)?.intercessor_count || 0) + 1 })
          .eq("id", prayerId);

        trackActivity("prayer_interceded");

        // Conceder XP por interceder
        await awardXP('prayer_interceded');

        // Animate prayer
        setAnimatedPrayers(prev => new Set(prev).add(prayerId));
        setTimeout(() => {
          setAnimatedPrayers(prev => {
            const next = new Set(prev);
            next.delete(prayerId);
            return next;
          });
        }, 1000);

        toast({
          title: "Amém! 🙏",
          description: "Você marcou que está orando por este pedido",
        });
        setUserIntercessors(prev => new Set(prev).add(prayerId));
        
        setPrayers(prev => prev.map(p => 
          p.id === prayerId ? { ...p, intercessor_count: p.intercessor_count + 1 } : p
        ));
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua ação",
        variant: "destructive",
      });
    }

    setLoadingIntercede(prev => {
      const next = new Set(prev);
      next.delete(prayerId);
      return next;
    });
  };

  const toggleComments = async (prayerId: string) => {
    if (expandedComments.has(prayerId)) {
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(prayerId);
        return next;
      });
    } else {
      if (!comments[prayerId]) {
        await loadComments(prayerId);
      }
      setExpandedComments(prev => new Set(prev).add(prayerId));
    }
  };

  const handleSubmitComment = async (prayerId: string) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comentar",
        variant: "destructive",
      });
      return;
    }

    const content = newComments[prayerId]?.trim();
    if (!content) return;

    if (content.length > 300) {
      toast({
        title: "Erro",
        description: "O comentário deve ter no máximo 300 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoadingComment(prev => new Set(prev).add(prayerId));

    const { error } = await supabase
      .from("prayer_comments")
      .insert([{
        prayer_id: prayerId,
        user_id: user.id,
        content: content,
      }]);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comentário",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Comentário enviado! 💬",
        description: "Sua mensagem de apoio foi publicada",
      });
      setNewComments(prev => ({ ...prev, [prayerId]: "" }));
      await loadComments(prayerId);
      setCommentCounts(prev => ({ ...prev, [prayerId]: (prev[prayerId] || 0) + 1 }));
    }

    setLoadingComment(prev => {
      const next = new Set(prev);
      next.delete(prayerId);
      return next;
    });
  };

  // Filter and sort prayers
  const filteredPrayers = prayers
    .filter(prayer => {
      // Filter by group
      if (selectedGroupId && prayer.group_id !== selectedGroupId) return false;
      
      // Filter by answered status
      if (showAnswered && !prayer.is_answered) return false;
      if (!showAnswered && prayer.is_answered) return false;
      
      // Filter by search query
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        prayer.title.toLowerCase().includes(query) ||
        prayer.description.toLowerCase().includes(query) ||
        prayer.category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (activeTab === "populares") {
        return b.intercessor_count - a.intercessor_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'saúde': return '❤️‍🩹';
      case 'família': return '👨‍👩‍👧‍👦';
      case 'trabalho': return '💼';
      case 'finanças': return '💰';
      case 'espiritual': return '✨';
      case 'esperança': return '🌟';
      default: return '🙏';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-divine bg-clip-text text-transparent flex items-center gap-2 leading-tight pt-1">
                <Sparkles className="h-8 w-8 text-primary shrink-0" />
                Orações
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Compartilhe seus pedidos e ore pelos irmãos na fé
              </p>
            </div>

            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary text-primary-foreground shadow-glow gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Oração
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Church className="h-5 w-5 text-primary" />
                      Compartilhar Pedido de Oração
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Título do pedido"
                      value={newPrayer.title}
                      onChange={(e) => setNewPrayer({ ...newPrayer, title: e.target.value })}
                      maxLength={100}
                    />
                    <Select
                      value={newPrayer.category}
                      onValueChange={(v) => setNewPrayer({ ...newPrayer, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            <span className="flex items-center gap-2">
                              <span>{getCategoryIcon(cat)}</span>
                              {cat}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Textarea
                        placeholder="Descreva seu pedido de oração..."
                        value={newPrayer.description}
                        onChange={(e) => setNewPrayer({ ...newPrayer, description: e.target.value })}
                        rows={5}
                        maxLength={1000}
                        className="resize-none"
                      />
                      <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {newPrayer.description.length}/1000
                      </span>
                    </div>

                    {/* Audio Recorder */}
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Ou grave sua oração em áudio:
                      </p>
                      <PrayerAudioRecorder
                        onAudioReady={setAudioBlob}
                        onClear={() => setAudioBlob(null)}
                      />
                    </div>

                    <Button 
                      onClick={handleCreatePrayer} 
                      className="w-full bg-gradient-primary gap-2"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Church className="h-4 w-4" />
                          Publicar Oração
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Prayer Groups */}
        <Collapsible open={showGroups} onOpenChange={setShowGroups} className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2 mb-3">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Grupos de Oração
                {selectedGroupId && <Badge variant="secondary" className="ml-2">Filtrado</Badge>}
              </span>
              {showGroups ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-4 mb-4">
              <PrayerGroups 
                user={user} 
                onSelectGroup={setSelectedGroupId}
                selectedGroupId={selectedGroupId}
              />
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tema (ex: família, saúde, esperança...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recentes" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Recentes
                </TabsTrigger>
                <TabsTrigger value="populares" className="gap-2">
                  <Flame className="h-4 w-4" />
                  Mais Orações
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant={showAnswered ? "default" : "outline"}
              size="sm"
              className={cn("gap-2", showAnswered && "bg-green-600 hover:bg-green-700")}
              onClick={() => setShowAnswered(!showAnswered)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {showAnswered ? "Respondidas" : "Ver Respondidas"}
            </Button>
          </div>

          {selectedGroupId && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                Filtrando por grupo
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => setSelectedGroupId(null)}
              >
                Limpar filtro
              </Button>
            </div>
          )}
        </div>

        {/* Prayer Cards */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPrayers.map((prayer, index) => {
              const isPraying = userIntercessors.has(prayer.id);
              const isExpanded = expandedComments.has(prayer.id);
              const prayerComments = comments[prayer.id] || [];
              const commentCount = commentCounts[prayer.id] || 0;
              const isAnimated = animatedPrayers.has(prayer.id);
              const isOwner = user?.id === prayer.user_id;

              return (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card className={cn(
                    "shadow-medium transition-all duration-300 overflow-hidden",
                    isPraying && "ring-2 ring-primary/30 bg-primary/5",
                    isAnimated && "animate-pulse ring-2 ring-primary",
                    prayer.is_answered && "ring-2 ring-green-500/30 bg-green-500/5"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <PostAuthorBadges
                          userId={prayer.user_id}
                          username={prayer.profiles?.username}
                          fullName={prayer.profiles?.full_name}
                          avatarUrl={prayer.profiles?.avatar_url}
                        />
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            {prayer.is_answered && (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Respondida
                              </Badge>
                            )}
                            <Badge variant="secondary" className="gap-1.5">
                              <span>{getCategoryIcon(prayer.category)}</span>
                              {prayer.category}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(prayer.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <h3 className="text-lg font-semibold">{prayer.title}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                        {prayer.description}
                      </p>
                      
                      {/* Answered testimony */}
                      {prayer.is_answered && prayer.answer_testimony && (
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-400">Testemunho</span>
                          </div>
                          <p className="text-sm">{prayer.answer_testimony}</p>
                          {prayer.answered_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Respondida em {format(new Date(prayer.answered_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Audio Player */}
                      {prayer.audio_url && (
                        <PrayerAudioPlayer audioUrl={prayer.audio_url} />
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-0">
                      <div className="flex gap-2 w-full flex-wrap">
                        <Button
                          variant={isPraying ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "gap-2 flex-1 transition-all",
                            isPraying && "bg-gradient-primary text-primary-foreground"
                          )}
                          onClick={() => handleIntercede(prayer.id)}
                          disabled={loadingIntercede.has(prayer.id) || prayer.is_answered}
                        >
                          <motion.div
                            animate={isAnimated ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            🙏
                          </motion.div>
                          {isPraying ? "Orando" : "Orar"} ({prayer.intercessor_count})
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => toggleComments(prayer.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {commentCount}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {/* Mark as answered button - only for owner */}
                        {isOwner && !prayer.is_answered && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-green-600 border-green-600/30 hover:bg-green-600/10"
                            onClick={() => {
                              setSelectedPrayerForAnswer(prayer);
                              setAnsweredModalOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Respondida
                          </Button>
                        )}
                      </div>

                      {/* Comments Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full space-y-3 pt-3 border-t overflow-hidden"
                          >
                            {/* Comment Input */}
                            {user && (
                              <div className="flex gap-2">
                                <Textarea
                                  placeholder="Deixe uma mensagem de apoio..."
                                  value={newComments[prayer.id] || ""}
                                  onChange={(e) => setNewComments(prev => ({ ...prev, [prayer.id]: e.target.value }))}
                                  className="min-h-[60px] flex-1 resize-none"
                                  maxLength={300}
                                />
                                <Button
                                  size="icon"
                                  onClick={() => handleSubmitComment(prayer.id)}
                                  disabled={loadingComment.has(prayer.id) || !newComments[prayer.id]?.trim()}
                                  className="self-end"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            {/* Comments List */}
                            {prayerComments.length > 0 ? (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {prayerComments.map((comment) => (
                                  <div key={comment.id} className="flex gap-2 p-2 rounded-lg bg-muted/50">
                                    <UserAvatar
                                      src={comment.profiles?.avatar_url}
                                      fallback={comment.profiles?.full_name || "U"}
                                      size="xs"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm">
                                          {comment.profiles?.full_name || "Usuário"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                      </div>
                                      <p className="text-sm mt-0.5">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-3">
                                Seja o primeiro a deixar uma mensagem de apoio! 💙
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredPrayers.length === 0 && (
            <Card className="p-8 text-center">
              <Church className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Nenhuma oração encontrada com esse termo." 
                  : "Nenhuma oração publicada ainda. Seja o primeiro!"
                }
              </p>
            </Card>
          )}
        </div>

        {/* Answered Prayer Modal */}
        {selectedPrayerForAnswer && (
          <AnsweredPrayerModal
            open={answeredModalOpen}
            onOpenChange={setAnsweredModalOpen}
            prayerId={selectedPrayerForAnswer.id}
            prayerTitle={selectedPrayerForAnswer.title}
            onSuccess={() => {
              loadPrayers();
              setSelectedPrayerForAnswer(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Prayers;
