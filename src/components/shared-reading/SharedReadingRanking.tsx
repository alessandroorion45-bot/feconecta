import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAvatar from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, Star, BookOpen, Brain, Users, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface SharedReadingStat {
  user_id: string;
  total_sessions: number;
  total_chapters_completed: number;
  total_correct_answers: number;
  total_wrong_answers: number;
  current_streak: number;
  longest_streak: number;
  sessions_hosted: number;
  profile?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface SharedReadingAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  points: number;
  earned_at?: string;
}

interface SharedReadingRankingProps {
  userId?: string;
  compact?: boolean;
}

export const SharedReadingRanking = ({ userId, compact = false }: SharedReadingRankingProps) => {
  const [ranking, setRanking] = useState<SharedReadingStat[]>([]);
  const [userStats, setUserStats] = useState<SharedReadingStat | null>(null);
  const [userAchievements, setUserAchievements] = useState<SharedReadingAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<SharedReadingAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const uid = userId || user?.id;
      setCurrentUserId(uid || null);

      // Load ranking
      const { data: rankingData } = await supabase
        .from('shared_reading_stats')
        .select('*')
        .order('total_chapters_completed', { ascending: false })
        .limit(50);

      if (rankingData && rankingData.length > 0) {
        // Fetch profiles for all users
        const userIds = rankingData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const enrichedRanking = rankingData.map(stat => ({
          ...stat,
          profile: profileMap.get(stat.user_id)
        }));
        
        setRanking(enrichedRanking as SharedReadingStat[]);

        // Find current user stats
        if (uid) {
          const currentUserStat = enrichedRanking.find(r => r.user_id === uid);
          setUserStats(currentUserStat as SharedReadingStat || null);
        }
      }

      // Load shared reading achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('category', 'shared_reading');

      if (achievementsData) {
        setAllAchievements(achievementsData as SharedReadingAchievement[]);
      }

      // Load user's earned achievements
      if (uid) {
        const { data: userAchData } = await supabase
          .from('user_achievements')
          .select(`
            earned_at,
            achievements (*)
          `)
          .eq('user_id', uid);

        if (userAchData) {
          const earnedAchievements = userAchData
            .filter((ua: any) => ua.achievements?.category === 'shared_reading')
            .map((ua: any) => ({
              ...ua.achievements,
              earned_at: ua.earned_at
            }));
          setUserAchievements(earnedAchievements);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [userId]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const userRankIndex = ranking.findIndex(r => r.user_id === currentUserId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Carregando ranking...</div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact version for sidebar/widget
    return (
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-violet-500" />
            Ranking Leitura em Grupo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranking.slice(0, 5).map((stat, index) => (
            <motion.div
              key={stat.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                stat.user_id === currentUserId ? 'bg-primary/10 border border-primary/30' : ''
              }`}
            >
              {getRankIcon(index)}
              <UserAvatar
                src={stat.profile?.avatar_url}
                fallback={stat.profile?.full_name?.[0] || '?'}
                size="xs"
              />
              <span className="flex-1 truncate text-sm">
                {stat.profile?.full_name || 'Usuário'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {stat.total_chapters_completed} cap.
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      {userStats && (
        <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Suas Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-background/50">
                <BookOpen className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                <div className="text-2xl font-bold">{userStats.total_chapters_completed}</div>
                <div className="text-xs text-muted-foreground">Capítulos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <Brain className="h-6 w-6 mx-auto text-violet-500 mb-2" />
                <div className="text-2xl font-bold">{userStats.total_correct_answers}</div>
                <div className="text-xs text-muted-foreground">Acertos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{userStats.total_sessions}</div>
                <div className="text-xs text-muted-foreground">Sessões</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <Flame className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                <div className="text-2xl font-bold">{userStats.current_streak}</div>
                <div className="text-xs text-muted-foreground">Sequência</div>
              </div>
            </div>

            {userRankIndex >= 0 && (
              <div className="mt-4 text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {userRankIndex === 0 ? '🏆 ' : ''}
                  Posição #{userRankIndex + 1} no Ranking
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="medals" className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Medalhas
          </TabsTrigger>
        </TabsList>

        {/* Ranking Tab */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking de Leitura Compartilhada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma sessão de leitura compartilhada ainda</p>
                  <p className="text-sm">Seja o primeiro a começar!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ranking.map((stat, index) => {
                    const isCurrentUser = stat.user_id === currentUserId;
                    const accuracy = stat.total_correct_answers + stat.total_wrong_answers > 0
                      ? Math.round((stat.total_correct_answers / (stat.total_correct_answers + stat.total_wrong_answers)) * 100)
                      : 0;

                    return (
                      <motion.div
                        key={stat.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-primary/10 border border-primary/30' 
                            : index < 3 
                              ? 'bg-gradient-to-r from-muted/50 to-transparent' 
                              : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Rank */}
                        <div className="w-8 flex justify-center">
                          {getRankIcon(index)}
                        </div>

                        {/* Avatar */}
                        <UserAvatar
                          src={stat.profile?.avatar_url}
                          fallback={stat.profile?.full_name?.[0] || '?'}
                          size="md"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {stat.profile?.full_name || 'Usuário'}
                            {isCurrentUser && <span className="text-primary ml-2">(você)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{stat.profile?.username || 'user'}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center hidden sm:block">
                            <div className="font-bold text-emerald-500">{stat.total_chapters_completed}</div>
                            <div className="text-xs text-muted-foreground">Capítulos</div>
                          </div>
                          <div className="text-center hidden md:block">
                            <div className="font-bold text-violet-500">{accuracy}%</div>
                            <div className="text-xs text-muted-foreground">Precisão</div>
                          </div>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            {stat.total_chapters_completed} cap.
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medals Tab */}
        <TabsContent value="medals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" />
                Medalhas de Leitura Compartilhada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAchievements.map((achievement) => {
                  const earned = userAchievements.find(ua => ua.id === achievement.id);
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative p-4 rounded-xl border-2 ${
                        earned 
                          ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10' 
                          : 'border-muted opacity-60 grayscale'
                      }`}
                    >
                      {/* Badge Icon */}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl ${
                        earned 
                          ? `bg-gradient-to-br ${getLevelColor(achievement.level)} shadow-lg` 
                          : 'bg-muted'
                      }`}>
                        {achievement.icon}
                      </div>

                      {/* Info */}
                      <h4 className="font-semibold text-center mb-1">
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-center text-muted-foreground mb-2">
                        {achievement.description}
                      </p>

                      {/* Level & Points */}
                      <div className="flex justify-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {achievement.level}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.points} pts
                        </Badge>
                      </div>

                      {/* Earned indicator */}
                      {earned && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {allAchievements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Medal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Medalhas serão exibidas aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
