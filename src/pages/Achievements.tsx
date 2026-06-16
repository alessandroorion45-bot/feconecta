import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/AchievementBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, TrendingUp, Flame, Target } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  level: string;
  points: number;
  earned?: boolean;
  earnedAt?: string;
}

interface UserStats {
  level: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  bible_chapters_read: number;
  prayers_created: number;
  prayers_interceded: number;
  events_participated: number;
  testimonies_shared: number;
}

const Achievements = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (user) {
      loadData(user.id);
    }
  }, [user]);

  const loadData = async (userId: string) => {
    setLoading(true);

    // Load achievements
    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .order("points", { ascending: true });

    // Load user's earned achievements
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("user_id", userId);

    // Load user stats
    const { data: statsData } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (achievementsData) {
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const earnedMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || []
      );

      const enrichedAchievements = achievementsData.map(achievement => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earnedAt: earnedMap.get(achievement.id),
      }));

      setAchievements(enrichedAchievements);
    }

    if (statsData) {
      setStats(statsData);
    }

    setLoading(false);
  };

  const getNextLevelPoints = (currentLevel: number) => {
    if (currentLevel < 10) return (currentLevel + 1) * 100;
    if (currentLevel < 20) return 1000 + (currentLevel - 10) * 200;
    return 3000 + (currentLevel - 20) * 500;
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    const nextLevelPoints = getNextLevelPoints(stats.level);
    const currentLevelPoints = stats.level === 1 ? 0 : getNextLevelPoints(stats.level - 1);
    const pointsInLevel = stats.total_points - currentLevelPoints;
    const pointsNeeded = nextLevelPoints - currentLevelPoints;
    return (pointsInLevel / pointsNeeded) * 100;
  };

  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const earnedCount = achievements.filter(a => a.earned).length;
  const completionPercentage = (earnedCount / achievements.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <p className="text-center text-muted-foreground">Carregando conquistas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-divine">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="text-2xl font-bold">{stats?.level || 1}</p>
                </div>
              </div>
              <Progress value={getLevelProgress()} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.total_points || 0} pontos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-divine">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Streak Atual</p>
                  <p className="text-2xl font-bold">{stats?.current_streak || 0}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Recorde: {stats?.longest_streak || 0} dias
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-divine">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conquistas</p>
                  <p className="text-2xl font-bold">
                    {earnedCount}/{achievements.length}
                  </p>
                </div>
              </div>
              <Progress value={completionPercentage} className="mt-3" />
            </CardContent>
          </Card>

          <Card className="shadow-divine">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atividades</p>
                  <p className="text-2xl font-bold">
                    {(stats?.bible_chapters_read || 0) +
                      (stats?.prayers_created || 0) +
                      (stats?.events_participated || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Grid */}
        <Card className="shadow-divine">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Suas Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="bible">📖 Bíblia</TabsTrigger>
                <TabsTrigger value="prayer">🙏 Oração</TabsTrigger>
                <TabsTrigger value="event">🎉 Eventos</TabsTrigger>
                <TabsTrigger value="testimony">✝️ Testemunhos</TabsTrigger>
                <TabsTrigger value="social">📅 Social</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedCategory}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredAchievements.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      icon={achievement.icon}
                      name={achievement.name}
                      description={achievement.description}
                      level={achievement.level}
                      earned={achievement.earned}
                      earnedAt={achievement.earnedAt}
                      size="md"
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <Card className="shadow-divine">
          <CardHeader>
            <CardTitle>Estatísticas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">📖 Capítulos Lidos</span>
                <Badge variant="secondary">{stats?.bible_chapters_read || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">🙏 Orações Criadas</span>
                <Badge variant="secondary">{stats?.prayers_created || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">💫 Intercessões</span>
                <Badge variant="secondary">{stats?.prayers_interceded || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">🎉 Eventos Participados</span>
                <Badge variant="secondary">{stats?.events_participated || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">✝️ Testemunhos Compartilhados</span>
                <Badge variant="secondary">{stats?.testimonies_shared || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Achievements;
