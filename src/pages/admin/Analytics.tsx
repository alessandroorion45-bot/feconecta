import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Crown,
  Trophy,
  Palette,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsSummary {
  total_users: number;
  new_users_week: number;
  new_users_month: number;
  active_today: number;
  active_week: number;
  posts_week: number;
  comments_week: number;
  likes_week: number;
  vip_total: number;
  vip_standard: number;
  vip_gold: number;
  vip_platinum: number;
  avg_xp: number;
  avg_level: number;
  total_achievements_unlocked: number;
  pending_reports: number;
  reports_week: number;
}

interface UserGrowth {
  date: string;
  new_users: number;
  total_users: number;
}

interface TopTheme {
  theme_name: string;
  users_using: number;
}

interface TopAchievement {
  name: string;
  unlock_count: number;
}

export default function AdminAnalytics() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [topThemes, setTopThemes] = useState<TopTheme[]>([]);
  const [topAchievements, setTopAchievements] = useState<TopAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadAnalytics = async () => {
    try {
      // Summary
      const { data: summaryData, error: summaryError } = await supabase
        .from("admin_analytics_summary")
        .select("*")
        .single();

      if (summaryError) throw summaryError;
      setSummary(summaryData);

      // User growth
      const { data: growthData, error: growthError } = await supabase
        .from("admin_analytics_user_growth")
        .select("*")
        .limit(30);

      if (!growthError) setUserGrowth(growthData || []);

      // Top themes
      const { data: themesData, error: themesError } = await supabase
        .from("admin_analytics_top_themes")
        .select("*")
        .limit(5);

      if (!themesError) setTopThemes(themesData || []);

      // Top achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("admin_analytics_top_achievements")
        .select("*")
        .limit(5);

      if (!achievementsError) setTopAchievements(achievementsData || []);
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar analytics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin || !summary) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Analytics & Métricas
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada de crescimento e engajamento
            </p>
          </div>

          <Badge variant="outline" className="text-lg px-4 py-2">
            <BarChart3 className="h-4 w-4 mr-2" />
            Tempo Real
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Usuários
                  </p>
                  <p className="text-3xl font-bold mt-2">{summary.total_users}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{summary.new_users_week} esta semana
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Usuários Ativos
                  </p>
                  <p className="text-3xl font-bold mt-2">{summary.active_week}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.active_today} hoje
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">VIP Ativos</p>
                  <p className="text-3xl font-bold mt-2">{summary.vip_total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.vip_gold} Gold, {summary.vip_platinum} Platinum
                  </p>
                </div>
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Posts Semana
                  </p>
                  <p className="text-3xl font-bold mt-2">{summary.posts_week}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.comments_week} comentários
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList>
            <TabsTrigger value="growth">
              <TrendingUp className="h-4 w-4 mr-2" />
              Crescimento
            </TabsTrigger>
            <TabsTrigger value="engagement">
              <Activity className="h-4 w-4 mr-2" />
              Engajamento
            </TabsTrigger>
            <TabsTrigger value="gamification">
              <Trophy className="h-4 w-4 mr-2" />
              Gamificação
            </TabsTrigger>
          </TabsList>

          {/* TAB: Crescimento */}
          <TabsContent value="growth" className="space-y-6">
            {/* User Growth Chart (Simple Bars) */}
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Usuários (Últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userGrowth.slice(0, 10).map((item) => (
                    <div key={item.date} className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground w-24">
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-blue-500 h-6 rounded transition-all"
                            style={{
                              width: `${Math.min(
                                (item.new_users / Math.max(...userGrowth.map((u) => u.new_users))) * 100,
                                100
                              )}%`,
                            }}
                          />
                          <span className="text-sm font-medium">{item.new_users}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Novos Esta Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-600">
                    +{summary.new_users_week}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Novos Este Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-600">
                    +{summary.new_users_month}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Taxa de Crescimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-600">
                    {summary.total_users > 0
                      ? ((summary.new_users_week / summary.total_users) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Semanal</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Engajamento */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Posts Esta Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{summary.posts_week}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Comentários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{summary.comments_week}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Curtidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{summary.likes_week}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Temas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Top 5 Temas Mais Usados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topThemes.map((theme, index) => (
                  <div key={theme.theme_name} className="flex items-center gap-4">
                    <Badge className="w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{theme.theme_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (theme.users_using / Math.max(...topThemes.map((t) => t.users_using))) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {theme.users_using} usuários
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Gamificação */}
          <TabsContent value="gamification" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">XP Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-yellow-600">
                    {Math.round(summary.avg_xp || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Por usuário</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nível Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-600">
                    {Math.round(summary.avg_level || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Por usuário</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conquistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-600">
                    {summary.total_achievements_unlocked}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Desbloqueadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Conquistas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top 5 Conquistas Mais Desbloqueadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topAchievements.map((achievement, index) => (
                  <div key={achievement.name} className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{achievement.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (achievement.unlock_count /
                                  Math.max(...topAchievements.map((a) => a.unlock_count))) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {achievement.unlock_count} desbloques
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
