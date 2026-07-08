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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const CHART_COLORS = ["#a855f7", "#8b5cf6", "#6366f1", "#3b82f6", "#0ea5e9"];

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
  total_users?: number;
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
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Usuários (Últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                {userGrowth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados de crescimento ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={[...userGrowth].reverse()}>
                      <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(d) => new Date(d as string).toLocaleDateString("pt-BR")}
                        formatter={(value: number) => [value, "Novos usuários"]}
                      />
                      <Area type="monotone" dataKey="new_users" stroke="#a855f7" fill="url(#growthGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
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
              <CardContent>
                {topThemes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados de temas ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topThemes} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                      <XAxis type="number" fontSize={12} allowDecimals={false} />
                      <YAxis type="category" dataKey="theme_name" fontSize={12} width={140} />
                      <Tooltip formatter={(value: number) => [value, "Usuários"]} />
                      <Bar dataKey="users_using" radius={[0, 6, 6, 0]}>
                        {topThemes.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
              <CardContent>
                {topAchievements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem conquistas desbloqueadas ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topAchievements} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                      <XAxis type="number" fontSize={12} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" fontSize={12} width={160} />
                      <Tooltip formatter={(value: number) => [value, "Desbloqueios"]} />
                      <Bar dataKey="unlock_count" radius={[0, 6, 6, 0]}>
                        {topAchievements.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
