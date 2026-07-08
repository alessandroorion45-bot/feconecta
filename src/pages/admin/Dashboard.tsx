import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MetricsCard } from "@/components/admin/MetricsCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Users, Crown, Palette, Trophy, Flag, Activity, BarChart, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  usersToday: number;
  usersWeek: number;
  totalLogs: number;
  activePunishments: number;
  pendingReports: number;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    usersToday: 0,
    usersWeek: 0,
    totalLogs: 0,
    activePunishments: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aguardar verificação de autenticação e permissões
    if (authLoading || adminLoading) return;

    // Se não for admin, redirecionar
    if (!isAdmin) {
      navigate("/");
      return;
    }

    // Carregar estatísticas
    loadStats();
  }, [isAdmin, authLoading, adminLoading, navigate]);

  const loadStats = async () => {
    console.log('[Dashboard] loadStats started');
    try {
      // Buscar estatísticas REAIS da view otimizada
      console.log('[Dashboard] Fetching REAL stats from database');

      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) {
        console.error('[Dashboard] Error fetching stats:', error);
        throw error;
      }

      console.log('[Dashboard] Stats fetched successfully:', data);

      setStats({
        totalUsers: data?.total_users || 0,
        usersToday: data?.users_today || 0,
        usersWeek: data?.users_week || 0,
        totalLogs: data?.total_logs || 0,
        activePunishments: data?.active_punishments || 0,
        pendingReports: data?.pending_reports || 0,
      });

      console.log('[Dashboard] Stats loaded successfully (REAL DATA)');
    } catch (error) {
      console.error("[Dashboard] Erro ao carregar estatísticas:", error);
      // Fallback: mostrar zeros em vez de dados falsos
      setStats({
        totalUsers: 0,
        usersToday: 0,
        usersWeek: 0,
        totalLogs: 0,
        activePunishments: 0,
        pendingReports: 0,
      });
    } finally {
      setLoading(false);
      console.log('[Dashboard] Loading finished');
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    console.log('[Dashboard] Rendering null - not admin');
    return null;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da plataforma FeConecta Premium
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricsCard
            title="Total de Usuários"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            description="Usuários registrados na plataforma"
          />

          <MetricsCard
            title="Novos Hoje"
            value={stats.usersToday.toLocaleString()}
            icon={Activity}
            description="Usuários registrados hoje"
            className="border-green-200 dark:border-green-900"
          />

          <MetricsCard
            title="Novos esta Semana"
            value={stats.usersWeek.toLocaleString()}
            icon={BarChart}
            description="Usuários registrados nos últimos 7 dias"
          />

          <MetricsCard
            title="Ações Administrativas"
            value={stats.totalLogs.toLocaleString()}
            icon={Settings}
            description="Total de logs do sistema"
          />

          <MetricsCard
            title="Punições Ativas"
            value={stats.activePunishments.toLocaleString()}
            icon={Flag}
            description="Advertências/suspensões ativas"
            className={
              stats.activePunishments > 0
                ? "border-red-200 dark:border-red-900"
                : ""
            }
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/admin/users")}
              className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Users className="h-6 w-6 mb-2 text-blue-600" />
              <h3 className="font-semibold">Gerenciar Usuários</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ver, editar e moderar usuários
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/reports")}
              className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Flag className="h-6 w-6 mb-2 text-red-600" />
              <h3 className="font-semibold">Denúncias</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingReports} pendentes
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/analytics")}
              className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <BarChart className="h-6 w-6 mb-2 text-purple-600" />
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Métricas e relatórios
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/automation")}
              className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Settings className="h-6 w-6 mb-2 text-muted-foreground" />
              <h3 className="font-semibold">Automação</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Palavras proibidas e regras de moderação
              </p>
            </button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sistema de logs em tempo real será implementado aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
