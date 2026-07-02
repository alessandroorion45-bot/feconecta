import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, TrendingUp, Flame, Calendar, Crown, Medal } from "lucide-react";
import { formatLargeNumber, getTitleIcon } from "@/lib/gamification";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  score: number;
  level?: number;
  title?: string;
  streak?: number;
}

type LeaderboardType = 'xp' | 'streak' | 'weekly' | 'monthly';

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('xp');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, user]);

  const loadLeaderboard = async () => {
    setLoading(true);

    let query;

    switch (activeTab) {
      case 'xp':
        // Ranking por XP total
        const xpQuery = supabase.from('user_stats' as any);
        query = (xpQuery as any)
          .select('user_id, total_xp, level, title, profiles!user_stats_user_id_fkey(username, full_name, avatar_url)')
          .order('total_xp', { ascending: false })
          .limit(100);
        break;

      case 'streak':
        // Ranking por sequência atual
        const streakQuery = supabase.from('user_stats' as any);
        query = (streakQuery as any)
          .select('user_id, current_streak, profiles!user_stats_user_id_fkey(username, full_name, avatar_url)')
          .order('current_streak', { ascending: false })
          .limit(100);
        break;

      case 'weekly':
        // XP ganho esta semana
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        // Aggregar XP da semana por usuário
        query = (supabase.rpc as any)('get_weekly_leaderboard', { week_start: weekStart.toISOString() });
        break;

      case 'monthly':
        // XP ganho este mês
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        query = (supabase.rpc as any)('get_monthly_leaderboard', { month_start: monthStart.toISOString() });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Leaderboard] Erro ao carregar:', error);
      // Se RPC não existir, usar fallback
      if (error.code === '42883') {
        loadFallbackLeaderboard();
        return;
      }
      setLoading(false);
      return;
    }

    // Formatar dados
    const formattedData: LeaderboardEntry[] = data?.map((entry: any, index: number) => {
      const profile = entry.profiles || entry.profile || {};

      return {
        rank: index + 1,
        user_id: entry.user_id,
        username: profile.username || 'Usuário',
        full_name: profile.full_name || 'Anônimo',
        avatar_url: profile.avatar_url,
        score: activeTab === 'xp' ? entry.total_xp :
               activeTab === 'streak' ? entry.current_streak :
               entry.weekly_xp || entry.monthly_xp || 0,
        level: entry.level,
        title: entry.title,
        streak: entry.current_streak,
      };
    }) || [];

    setRankings(formattedData);

    // Encontrar posição do usuário atual
    if (user) {
      const myRank = formattedData.find(e => e.user_id === user.id);
      setUserRank(myRank || null);
    }

    setLoading(false);
  };

  const loadFallbackLeaderboard = async () => {
    // Fallback caso RPCs não existam
    const fallbackQuery = supabase.from('user_stats' as any);
    const { data } = await (fallbackQuery as any)
      .select('user_id, total_xp, level, title, current_streak, profiles!user_stats_user_id_fkey(username, full_name, avatar_url)')
      .order(activeTab === 'streak' ? 'current_streak' : 'total_xp', { ascending: false })
      .limit(100);

    const formattedData: LeaderboardEntry[] = data?.map((entry: any, index: number) => ({
      rank: index + 1,
      user_id: entry.user_id,
      username: entry.profiles?.username || 'Usuário',
      full_name: entry.profiles?.full_name || 'Anônimo',
      avatar_url: entry.profiles?.avatar_url,
      score: activeTab === 'streak' ? entry.current_streak : entry.total_xp,
      level: entry.level,
      title: entry.title,
      streak: entry.current_streak,
    })) || [];

    setRankings(formattedData);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400 fill-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600 fill-orange-600" />;
    return null;
  };

  const getScoreLabel = () => {
    switch (activeTab) {
      case 'xp': return 'XP Total';
      case 'streak': return 'Sequência';
      case 'weekly': return 'XP Semanal';
      case 'monthly': return 'XP Mensal';
    }
  };

  return (
    <Card className="shadow-divine">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          🏆 Rankings
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="xp" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Total</span>
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Streak</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Semana</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Mês</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {/* Posição do usuário */}
                {user && userRank && (
                  <div className="mb-4 p-4 bg-primary/10 rounded-lg border-2 border-primary">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        {getRankIcon(userRank.rank)}
                        <span className="font-bold text-lg">#{userRank.rank}</span>
                      </div>

                      <Avatar className="h-10 w-10 border-2 border-primary">
                        <AvatarImage src={userRank.avatar_url || undefined} />
                        <AvatarFallback>
                          {userRank.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">Você</p>
                        {userRank.title && (
                          <p className="text-xs text-muted-foreground">
                            {getTitleIcon(userRank.title)} {userRank.title}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {formatLargeNumber(userRank.score)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getScoreLabel()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Rankings */}
                <div className="space-y-2">
                  {rankings.map((entry) => {
                    const isCurrentUser = user && entry.user_id === user.id;

                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isCurrentUser
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex items-center gap-2 min-w-[50px]">
                          {getRankIcon(entry.rank)}
                          <span
                            className={`font-bold ${
                              entry.rank <= 3 ? 'text-lg' : 'text-base'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                        </div>

                        {/* Avatar */}
                        <Avatar
                          className={`h-10 w-10 ${
                            entry.rank === 1 ? 'border-2 border-yellow-500' :
                            entry.rank === 2 ? 'border-2 border-gray-400' :
                            entry.rank === 3 ? 'border-2 border-orange-600' : ''
                          }`}
                        >
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                            {isCurrentUser ? 'Você' : entry.full_name}
                          </p>
                          {entry.title && (
                            <p className="text-xs text-muted-foreground truncate">
                              {getTitleIcon(entry.title)} {entry.title}
                              {entry.level && ` • Nv ${entry.level}`}
                            </p>
                          )}
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatLargeNumber(entry.score)}
                          </p>
                          {activeTab === 'xp' && entry.level && (
                            <Badge variant="secondary" className="text-xs">
                              Nível {entry.level}
                            </Badge>
                          )}
                          {activeTab === 'streak' && entry.streak && entry.streak >= 7 && (
                            <span className="text-xs">
                              {entry.streak >= 365 ? '🏆' :
                               entry.streak >= 100 ? '👑' :
                               entry.streak >= 30 ? '🔥🔥🔥' : '🔥🔥'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {rankings.length === 0 && !loading && (
                    <div className="text-center py-10">
                      <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-bold mb-2">Nenhum ranking ainda</h3>
                      <p className="text-sm text-muted-foreground">
                        Seja o primeiro a ganhar XP e aparecer no ranking!
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
