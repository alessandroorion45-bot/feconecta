import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MetricsCard } from "@/components/admin/MetricsCard";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Crown, Palette, Trophy, Flag, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  vipUsers: number;
  activeThemes: number;
  totalAchievements: number;
  pendingReports: number;
  onlineUsers: number;
}

export default function AdminDashboard() {
  const { isAdmin, isSuperAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    vipUsers: 0,
    activeThemes: 0,
    totalAchievements: 0,
    pendingReports: 0,
    onlineUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadStats = async () => {
    try {
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // VIPs ativos
      const { count: vipUsers } = await supabase
        .from("vip_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Temas ativos únicos
      const { count: activeThemes } = await supabase
        .from("user_themes")
        .select("theme_id", { count: "exact", head: true })
        .eq("is_active", true);

      // Total de conquistas
      const { count: totalAchievements } = await supabase
        .from("achievements")
        .select("*", { count: "exact", head: true });

      // Denúncias pendentes
      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        totalUsers: totalUsers || 0,
        vipUsers: vipUsers || 0,
        activeThemes: activeThemes || 0,
        totalAchievements: totalAchievements || 0,
        pendingReports: pendingReports || 0,
        onlineUsers: 0, // Implementar com realtime depois
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
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
            title="Usuários VIP"
            value={stats.vipUsers.toLocaleString()}
            icon={Crown}
            description="Assinaturas VIP ativas"
            className="border-yellow-200 dark:border-yellow-900"
          />

          <MetricsCard
            title="Temas Ativos"
            value={stats.activeThemes.toLocaleString()}
            icon={Palette}
            description="Usuários com temas personalizados"
          />

          <MetricsCard
            title="Conquistas Disponíveis"
            value={stats.totalAchievements.toLocaleString()}
            icon={Trophy}
            description="Total de conquistas no sistema"
          />

          <MetricsCard
            title="Denúncias Pendentes"
            value={stats.pendingReports.toLocaleString()}
            icon={Flag}
            description="Aguardando moderação"
            className={
              stats.pendingReports > 0
                ? "border-red-200 dark:border-red-900"
                : ""
            }
          />

          <MetricsCard
            title="Usuários Online"
            value={stats.onlineUsers.toLocaleString()}
            icon={Activity}
            description="Ativos nos últimos 5 minutos"
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
              <BarChart3 className="h-6 w-6 mb-2 text-purple-600" />
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Métricas e relatórios
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/settings")}
              className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Settings className="h-6 w-6 mb-2 text-gray-600" />
              <h3 className="font-semibold">Configurações</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ajustes da plataforma
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
