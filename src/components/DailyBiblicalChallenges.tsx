import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  CheckCircle, 
  BookOpen, 
  Heart, 
  Share2, 
  Zap,
  Trophy,
  Calendar,
  Flame,
  History,
  Award,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pickChallengeForDate, COMPLETION_MESSAGES, CATEGORY_LINKS } from "@/lib/challengeBank";

interface DailyChallenge {
  id: string;
  challenge_text: string;
  motivational_quote: string;
  category: string;
  difficulty_level: string;
  points_reward: number;
  challenge_date: string;
}

interface ChallengeCompletion {
  challenge_id: string;
  completed_at: string;
  points_earned: number;
}

interface StreakBadge {
  days: number;
  badgeKey: string;
  name: string;
  icon: string;
  color: string;
}

interface DailyBiblicalChallengesProps {
  userId: string;
}

const STREAK_BADGES: StreakBadge[] = [
  { days: 7, badgeKey: "daily_streak_7", name: "Discípulo Fiel", icon: "🌟", color: "from-blue-500 to-cyan-500" },
  { days: 21, badgeKey: "daily_streak_21", name: "Guerreiro da Fé", icon: "⚔️", color: "from-purple-500 to-pink-500" },
  { days: 40, badgeKey: "daily_streak_40", name: "Peregrino Consagrado", icon: "👑", color: "from-yellow-500 to-orange-500" },
];

const DailyBiblicalChallenges = ({ userId }: DailyBiblicalChallengesProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge | null>(null);
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
  const [recentChallenges, setRecentChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState<StreakBadge | null>(null);

  // Check if challenge is a prayer challenge
  const isPrayerChallenge = (challenge: DailyChallenge | null) => {
    if (!challenge) return false;
    const text = challenge.challenge_text.toLowerCase();
    return challenge.category === 'oracao' || 
           text.includes('ore') || 
           text.includes('orar') ||
           text.includes('oração');
  };

  const handlePrayerChallengeClick = () => {
    navigate('/prayers?from=challenge');
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const calculateStreak = (completionsData: ChallengeCompletion[]) => {
    if (completionsData.length === 0) return 0;
    
    // Sort by date descending
    const sorted = [...completionsData].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) {
      const completionDate = new Date(sorted[i].completed_at);
      completionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      // Allow for same day or previous day
      const diffDays = Math.floor((expectedDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1 && diffDays >= 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const loadData = async () => {
    setLoading(true);
    
    const today = new Date().toISOString().split('T')[0];

    // Carregar desafio de hoje (maybeSingle: sem 406 quando não existe)
    let { data: todayData } = await supabase
      .from("daily_biblical_challenges")
      .select("*")
      .eq("challenge_date", today)
      .limit(1)
      .maybeSingle();

    // Fallback: banco sem desafio para hoje → gera do banco local e
    // registra no servidor (todos os usuários verão o mesmo desafio)
    if (!todayData) {
      const generated = pickChallengeForDate(today);
      const { data: inserted } = await supabase
        .from("daily_biblical_challenges")
        .insert({ ...generated, challenge_date: today })
        .select()
        .maybeSingle();

      if (inserted) {
        todayData = inserted;
      } else {
        // Corrida com outro usuário ou INSERT bloqueado: relê
        const { data: retry } = await supabase
          .from("daily_biblical_challenges")
          .select("*")
          .eq("challenge_date", today)
          .limit(1)
          .maybeSingle();
        todayData = retry;
      }
    }

    if (todayData) {
      setTodayChallenge(todayData);
    }

    // Carregar completudes do usuário
    const { data: completionsData } = await supabase
      .from("daily_challenge_completions")
      .select("challenge_id, completed_at, points_earned")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (completionsData) {
      setCompletions(completionsData);
      const streak = calculateStreak(completionsData);
      setCurrentStreak(streak);
    }

    // Carregar desafios recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentData } = await supabase
      .from("daily_biblical_challenges")
      .select("*")
      .gte("challenge_date", sevenDaysAgo.toISOString().split('T')[0])
      .lte("challenge_date", today)
      .order("challenge_date", { ascending: false });

    if (recentData) {
      setRecentChallenges(recentData);
    }

    // Carregar badges do usuário
    const { data: badgesData } = await (supabase.from("user_badges" as any) as any)
      .select("badges!inner(badge_key, name)")
      .eq("user_id", userId)
      .in("badges.badge_key", ["daily_streak_7", "daily_streak_21", "daily_streak_40"]);

    if (badgesData) {
      setEarnedBadges(badgesData.map((b: any) => b.badges?.name).filter(Boolean));
    }

    setLoading(false);
  };

  const checkAndAwardStreakBadge = async (newStreak: number) => {
    for (const badge of STREAK_BADGES) {
      if (newStreak >= badge.days && !earnedBadges.includes(badge.name)) {
        // Award badge (busca o id no catálogo e vincula ao usuário)
        const { data: badgeRow } = await (supabase.from("badges" as any) as any)
          .select("id")
          .eq("badge_key", badge.badgeKey)
          .maybeSingle();

        const { error } = badgeRow
          ? await (supabase.from("user_badges" as any) as any).insert({
              user_id: userId,
              badge_id: badgeRow.id,
            })
          : { error: new Error("Badge não encontrado no catálogo") };

        if (!error) {
          setNewBadge(badge);
          setEarnedBadges(prev => [...prev, badge.name]);
          
          // Add bonus points
          const bonusPoints = badge.days * 5;
          const { data: stats } = await supabase
            .from("user_stats")
            .select("total_points")
            .eq("user_id", userId)
            .single();

          if (stats) {
            await supabase
              .from("user_stats")
              .update({ total_points: stats.total_points + bonusPoints })
              .eq("user_id", userId);
          }

          toast({
            title: `Nova Insígnia Desbloqueada! ${badge.icon}`,
            description: `Você conquistou "${badge.name}" por ${badge.days} dias consecutivos! +${bonusPoints} pontos bônus!`,
          });
        }
        break; // Only award one badge at a time
      }
    }
  };

  const completeChallenge = async () => {
    if (!todayChallenge || completing) return;

    setCompleting(true);

    try {
      // Inserir completude
      const { error: insertError } = await supabase
        .from("daily_challenge_completions")
        .insert({
          user_id: userId,
          challenge_id: todayChallenge.id,
          points_earned: todayChallenge.points_reward
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: "Desafio já completado",
            description: "Você já completou este desafio hoje!",
            variant: "default",
          });
        } else {
          throw insertError;
        }
        setCompleting(false);
        return;
      }

      // Atualizar pontos no user_stats
      const { data: currentStats } = await supabase
        .from("user_stats")
        .select("total_points")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentStats) {
        await supabase
          .from("user_stats")
          .update({ 
            total_points: currentStats.total_points + todayChallenge.points_reward,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("user_stats")
          .insert({ 
            user_id: userId,
            total_points: todayChallenge.points_reward
          });
      }

      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);

      // XP da gamificação (não bloqueia se falhar)
      void (supabase.rpc as any)('award_xp', {
        p_user_id: userId,
        p_action_key: 'challenge_completed',
        p_metadata: null,
      });

      // Mensagem de incentivo diferente a cada conclusão
      const message = COMPLETION_MESSAGES[completions.length % COMPLETION_MESSAGES.length];
      toast({
        title: "Desafio completado! 🎉",
        description: `+${todayChallenge.points_reward} pontos · ${message}`,
      });

      // Check for streak badges
      await checkAndAwardStreakBadge(newStreak);

      // Recarregar dados
      loadData();
    } catch (error) {
      console.error("Erro ao completar desafio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar o desafio. Tente novamente.",
        variant: "destructive",
      });
    }

    setCompleting(false);
  };

  const shareChallenge = () => {
    if (!todayChallenge) return;

    const message = `✝️ *Desafio Bíblico do Dia* ✝️

📖 ${todayChallenge.challenge_text}

💬 "${todayChallenge.motivational_quote}"

🏆 Completei este desafio na Aliança!

🔥 Minha sequência: ${currentStreak} dias consecutivos!

Venha fortalecer sua fé também! 🙏`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isChallengeCompleted = (challengeId: string) => {
    return completions.some(c => c.challenge_id === challengeId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'leitura': return <BookOpen className="h-5 w-5" />;
      case 'oracao': return <Heart className="h-5 w-5" />;
      case 'compartilhar': return <Share2 className="h-5 w-5" />;
      case 'acao': return <Zap className="h-5 w-5" />;
      case 'quiz': return <Trophy className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'leitura': return 'Leitura';
      case 'oracao': return 'Oração';
      case 'compartilhar': return 'Compartilhar';
      case 'acao': return 'Ação';
      case 'quiz': return 'Quiz Bíblico';
      case 'caca_palavras': return 'Caça-Palavras';
      case 'estudo': return 'Estudo';
      case 'comunidade': return 'Comunidade';
      case 'gratidao': return 'Gratidão';
      case 'evangelismo': return 'Evangelismo';
      case 'igreja': return 'Igreja';
      default: return 'Geral';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'facil': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'medio': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'dificil': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Médio';
      case 'dificil': return 'Difícil';
      default: return level;
    }
  };

  const totalPointsEarned = completions.reduce((sum, c) => sum + c.points_earned, 0);

  const getNextBadge = () => {
    for (const badge of STREAK_BADGES) {
      if (currentStreak < badge.days) {
        return badge;
      }
    }
    return null;
  };

  const nextBadge = getNextBadge();

  if (loading) {
    return (
      <Card className="shadow-divine animate-pulse">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground">Carregando desafio...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Trophy className="h-4 w-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold">{totalPointsEarned}</p>
            <p className="text-xs text-muted-foreground">Pontos</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="h-4 w-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Sequência</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
              <CheckCircle className="h-4 w-4" />
            </div>
            <p className="text-lg sm:text-xl font-bold">{completions.length}</p>
            <p className="text-xs text-muted-foreground">Completos</p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso para próxima insígnia */}
      {nextBadge && (
        <Card className="shadow-sm bg-gradient-to-r from-muted/50 to-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{nextBadge.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Próxima insígnia: {nextBadge.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${nextBadge.color} transition-all`}
                      style={{ width: `${(currentStreak / nextBadge.days) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {currentStreak}/{nextBadge.days} dias
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insígnias conquistadas */}
      {earnedBadges.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-primary" />
              Insígnias de Sequência
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex gap-2 flex-wrap">
              {STREAK_BADGES.filter(b => earnedBadges.includes(b.name)).map((badge) => (
                <Badge 
                  key={badge.days}
                  className={`bg-gradient-to-r ${badge.color} text-white border-0 gap-1`}
                >
                  <span>{badge.icon}</span>
                  {badge.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desafio de Hoje */}
      {todayChallenge ? (
        <Card className={`shadow-divine border-2 transition-all ${
          isChallengeCompleted(todayChallenge.id) 
            ? 'border-green-500/50 bg-green-500/5' 
            : 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5'
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Desafio de Hoje
              </CardTitle>
              <Badge variant="outline" className={getDifficultyColor(todayChallenge.difficulty_level)}>
                {getDifficultyLabel(todayChallenge.difficulty_level)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                {getCategoryIcon(todayChallenge.category)}
              </div>
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2 text-xs">
                  {getCategoryLabel(todayChallenge.category)}
                </Badge>
                <p className="text-base sm:text-lg font-medium">
                  {todayChallenge.challenge_text}
                </p>
              </div>
            </div>

            {/* Frase motivacional */}
            <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
              <p className="text-sm italic text-muted-foreground">
                "{todayChallenge.motivational_quote}"
              </p>
            </div>

            {/* Recompensa e Ação */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  +{todayChallenge.points_reward} pontos
                </Badge>

                {isChallengeCompleted(todayChallenge.id) && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Completado! 🎉</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {!isChallengeCompleted(todayChallenge.id) ? (
                  <>
                    {isPrayerChallenge(todayChallenge) ? (
                      <Button
                        onClick={handlePrayerChallengeClick}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ir para Orações
                      </Button>
                    ) : CATEGORY_LINKS[todayChallenge.category] && (
                      <Button
                        onClick={() => navigate(CATEGORY_LINKS[todayChallenge.category].path)}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {CATEGORY_LINKS[todayChallenge.category].label}
                      </Button>
                    )}
                    <Button 
                      onClick={completeChallenge}
                      disabled={completing}
                      className="bg-gradient-primary text-primary-foreground shadow-glow flex-1"
                    >
                      {completing ? (
                        <Sparkles className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Marcar como Concluído
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={shareChallenge}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Compartilhar no WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-divine">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum desafio disponível para hoje. Volte amanhã!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card className="shadow-divine">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-muted-foreground" />
              Desafios Recentes
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Ocultar' : 'Ver mais'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`space-y-2 ${showHistory ? '' : 'max-h-32 overflow-hidden'}`}>
            {recentChallenges.slice(0, showHistory ? undefined : 3).map((challenge) => {
              const isCompleted = isChallengeCompleted(challenge.id);
              const isToday = challenge.challenge_date === new Date().toISOString().split('T')[0];
              
              return (
                <div 
                  key={challenge.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCompleted ? 'bg-green-500/10' : 'bg-muted/30'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {isCompleted ? <CheckCircle className="h-3 w-3" /> : getCategoryIcon(challenge.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{challenge.challenge_text}</p>
                    <p className="text-xs text-muted-foreground">
                      {isToday 
                        ? 'Hoje' 
                        : format(new Date(challenge.challenge_date), "dd 'de' MMMM", { locale: ptBR })
                      }
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    +{challenge.points_reward}
                  </Badge>
                </div>
              );
            })}
          </div>

          {recentChallenges.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum desafio disponível ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyBiblicalChallenges;
