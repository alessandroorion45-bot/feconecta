import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Star, Medal, Flame, Book, Target, HelpCircle, TrendingUp } from "lucide-react";
import { UserBadge } from "@/components/UserBadge";

interface RankedUser {
  user_id: string;
  total_points: number;
  level: number;
  current_streak: number;
  bible_chapters_read: number;
  testimonies_shared: number;
  prayers_created: number;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  badges: Array<{
    badge_name: string;
    badge_icon: string;
    badge_color: string;
  }>;
}

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#f43f5e",
};

const Ranking = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      loadRanking();
    };

    checkAuth();
  }, [navigate]);

  // Real-time subscription for score updates
  useEffect(() => {
    const channel = supabase
      .channel('ranking-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats'
        },
        () => {
          loadRanking();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_scores'
        },
        () => {
          loadRanking();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_challenge_completions'
        },
        () => {
          loadRanking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRanking = async () => {
    setLoading(true);

    // Buscar todos os perfis e depois enriquecer com stats
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url");

    if (profilesError) {
      console.error("Error loading profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Buscar stats de todos usuários
    const { data: stats } = await supabase
      .from("user_stats")
      .select("*");

    // Buscar pontos do quiz
    const { data: quizScores } = await supabase
      .from("quiz_scores")
      .select("user_id, total_points");

    // Buscar completudes de desafios diários
    const { data: challengeCompletions } = await supabase
      .from("daily_challenge_completions")
      .select("user_id, points_earned");

    // Criar mapa de stats por usuário
    const statsMap = new Map(stats?.map(s => [s.user_id, s]) || []);
    
    // Criar mapa de pontos do quiz por usuário
    const quizPointsMap = new Map(quizScores?.map(q => [q.user_id, q.total_points]) || []);
    
    // Agregar pontos de desafios diários por usuário
    const challengePointsMap = new Map<string, number>();
    challengeCompletions?.forEach(c => {
      const current = challengePointsMap.get(c.user_id) || 0;
      challengePointsMap.set(c.user_id, current + c.points_earned);
    });

    // Combinar todos os dados para cada perfil
    const rankedUsers: RankedUser[] = (profiles || []).map(profile => {
      const userStats = statsMap.get(profile.id);
      const statsPoints = userStats?.total_points || 0;
      
      return {
        user_id: profile.id,
        total_points: statsPoints, // user_stats já agrega todos os pontos
        level: userStats?.level || 1,
        current_streak: userStats?.current_streak || 0,
        bible_chapters_read: userStats?.bible_chapters_read || 0,
        testimonies_shared: userStats?.testimonies_shared || 0,
        prayers_created: userStats?.prayers_created || 0,
        profiles: {
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        },
        badges: []
      };
    });

    // Ordenar por pontos (decrescente)
    rankedUsers.sort((a, b) => b.total_points - a.total_points);

    // Buscar badges para todos os usuários no ranking
    if (rankedUsers.length > 0) {
      const userIds = rankedUsers.map(u => u.user_id);
      const { data: allBadges } = await (supabase.from("user_badges" as any) as any)
        .select("user_id, unlocked_at, badges(name, icon, rarity)")
        .in("user_id", userIds)
        .order("unlocked_at", { ascending: false });

      // Agrupar badges por usuário
      const badgesByUser = new Map<string, any[]>();
      allBadges?.forEach((badge: any) => {
        if (!badgesByUser.has(badge.user_id)) {
          badgesByUser.set(badge.user_id, []);
        }
        badgesByUser.get(badge.user_id)!.push({
          badge_name: badge.badges?.name || "",
          badge_icon: badge.badges?.icon || "🏅",
          badge_color: RARITY_COLOR[badge.badges?.rarity] || RARITY_COLOR.common,
        });
      });

      // Adicionar badges aos usuários
      rankedUsers.forEach(user => {
        user.badges = (badgesByUser.get(user.user_id) || []).slice(0, 3) as any;
      });
    }

    setUsers(rankedUsers);
    setLoading(false);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">{position}º</span>;
    }
  };

  const getRankStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 border-yellow-500/30 ring-2 ring-yellow-500/20";
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-orange-500/10 border-amber-600/30";
      default:
        return "bg-card hover:bg-muted/50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <p className="text-center text-muted-foreground">Carregando ranking...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 space-y-6">
        {/* Header Card */}
        <Card className="shadow-divine overflow-hidden">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl leading-tight pt-1">
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
              Ranking da Comunidade
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Compete com outros irmãos em atividades espirituais
            </p>
          </CardHeader>
          <CardContent className="pb-4">
            {/* Points Legend */}
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full">
                <Book className="h-3 w-3 text-blue-500" />
                <span>Leitura Bíblica</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full">
                <Target className="h-3 w-3 text-green-500" />
                <span>Desafios</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full">
                <HelpCircle className="h-3 w-3 text-purple-500" />
                <span>Quiz</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full">
                <TrendingUp className="h-3 w-3 text-orange-500" />
                <span>Atividades</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking List */}
        <div className="space-y-3">
          {users.length > 0 ? (
            users.map((user, index) => {
              const position = index + 1;
              const isCurrentUser = user.user_id === currentUserId;

              return (
                <Card
                  key={user.user_id}
                  className={`shadow-sm transition-all duration-300 ${getRankStyle(position)} ${
                    isCurrentUser ? "ring-2 ring-primary/50" : ""
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Position */}
                      <div className="flex items-center justify-center w-8 h-8 shrink-0">
                        {getRankIcon(position)}
                      </div>

                      {/* Avatar */}
                      <Link to={`/user/${user.user_id}`} className="shrink-0">
                        <UserAvatar
                          src={user.profiles.avatar_url}
                          fallback={user.profiles.full_name || "U"}
                          size="md"
                        />
                      </Link>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            to={`/user/${user.user_id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {user.profiles.full_name}
                          </Link>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Você
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.profiles.username}
                        </p>
                        
                        {/* Badges - show only on larger screens or for top 3 */}
                        {user.badges.length > 0 && (position <= 3 || window.innerWidth >= 640) && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {user.badges.map((badge, i) => (
                              <UserBadge
                                key={i}
                                icon={badge.badge_icon}
                                name={badge.badge_name}
                                color={badge.badge_color}
                                size="xs"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-lg sm:text-xl font-bold">
                            {user.total_points.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                          <span className="hidden sm:inline">Nível {user.level}</span>
                          {user.current_streak > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {user.current_streak}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded stats for top 3 */}
                    {position <= 3 && (
                      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{user.bible_chapters_read || 0}</p>
                          <p className="text-muted-foreground">Capítulos</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{user.testimonies_shared || 0}</p>
                          <p className="text-muted-foreground">Testemunhos</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{user.prayers_created || 0}</p>
                          <p className="text-muted-foreground">Orações</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="shadow-divine">
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum usuário no ranking ainda
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Complete atividades espirituais para aparecer no ranking!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Footer */}
        <Card className="shadow-sm bg-muted/30">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              🔄 Ranking atualizado em tempo real
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ganhe pontos: Leitura (+10), Desafios (+10-30), Quiz (+pontos/questão), Testemunhos (+20)
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ranking;
