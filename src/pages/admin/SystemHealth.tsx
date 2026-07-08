import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, HardDrive, Users, MessageSquare, Image, Flag, FileText, RefreshCw, ShieldAlert, TrendingUp, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserProfileDialog } from "@/components/admin/UserProfileDialog";

interface SignupBurst {
  hour: string;
  count: number;
}

interface RiskyAccount {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  hours_old: number;
  reports_count: number;
  punishments_count: number;
}

interface DuplicateName {
  full_name: string;
  count: number;
}

interface FraudSignals {
  signup_bursts: SignupBurst[];
  young_risky_accounts: RiskyAccount[];
  duplicate_names: DuplicateName[];
}

interface SystemHealth {
  total_users: number;
  total_posts: number;
  total_photos: number;
  total_reports: number;
  total_admin_logs: number;
  total_activity_logs: number;
  total_comments: number;
  total_prayers: number;
  database_size_bytes: number;
  active_connections: number;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function AdminSystemHealth() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dbLatencyMs, setDbLatencyMs] = useState<number | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"checking" | "ok" | "fail">("checking");
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [fraud, setFraud] = useState<FraudSignals | null>(null);
  const [profileDialogUserId, setProfileDialogUserId] = useState<string | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const checkFraudSignals = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_admin_fraud_signals");
      if (error) throw error;
      setFraud(data as unknown as FraudSignals);
    } catch (error) {
      console.error("Erro ao verificar sinais de fraude:", error);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const start = performance.now();
      const { data, error } = await supabase.rpc("get_admin_system_health");
      const latency = performance.now() - start;
      setDbLatencyMs(Math.round(latency));

      if (error) throw error;
      setHealth((data?.[0] as SystemHealth) || null);
      setLastChecked(new Date());
    } catch (error) {
      console.error("Erro ao verificar saúde do sistema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a saúde do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkRealtime = useCallback(() => {
    setRealtimeStatus("checking");
    const channel = supabase
      .channel(`health-check-${Date.now()}`)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("ok");
          setTimeout(() => supabase.removeChannel(channel), 500);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("fail");
        }
      });
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      checkHealth();
      checkRealtime();
      checkFraudSignals();

      const interval = setInterval(checkHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, adminLoading, navigate, checkHealth, checkRealtime, checkFraudSignals]);

  const latencyStatus = dbLatencyMs === null ? "checking" : dbLatencyMs < 300 ? "ok" : dbLatencyMs < 1000 ? "warn" : "fail";

  const statusBadge = (status: "checking" | "ok" | "warn" | "fail") => {
    if (status === "checking") return <Badge variant="outline">Verificando...</Badge>;
    if (status === "ok") return <Badge className="bg-green-600 text-white">Saudável</Badge>;
    if (status === "warn") return <Badge className="bg-yellow-600 text-white">Lento</Badge>;
    return <Badge variant="destructive">Falha</Badge>;
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Verificando saúde do sistema...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Saúde do Sistema
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento em tempo real de banco, conexões e tamanho da plataforma
            </p>
          </div>
          <button
            onClick={() => { checkHealth(); checkRealtime(); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" /> Banco de Dados
                  </p>
                  <p className="text-2xl font-bold mt-2">{dbLatencyMs ?? "—"} ms</p>
                  <p className="text-xs text-muted-foreground mt-1">Tempo de resposta</p>
                </div>
                {statusBadge(latencyStatus)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Realtime / WebSocket
                  </p>
                  <p className="text-2xl font-bold mt-2 capitalize">
                    {realtimeStatus === "ok" ? "Conectado" : realtimeStatus === "fail" ? "Falhou" : "..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Canal de tempo real</p>
                </div>
                {statusBadge(realtimeStatus === "checking" ? "checking" : realtimeStatus === "ok" ? "ok" : "fail")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <HardDrive className="h-4 w-4" /> Conexões Ativas
                  </p>
                  <p className="text-2xl font-bold mt-2">{health?.active_connections ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {health ? formatBytes(health.database_size_bytes) : "—"} usados
                  </p>
                </div>
                {statusBadge("ok")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume de dados */}
        <Card>
          <CardHeader>
            <CardTitle>Volume de Dados</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Usuários", value: health?.total_users },
              { icon: MessageSquare, label: "Posts", value: health?.total_posts },
              { icon: Image, label: "Fotos", value: health?.total_photos },
              { icon: Flag, label: "Denúncias", value: health?.total_reports },
              { icon: FileText, label: "Logs Admin", value: health?.total_admin_logs },
              { icon: Activity, label: "Logs de Atividade", value: health?.total_activity_logs },
              { icon: MessageSquare, label: "Comentários", value: health?.total_comments },
              { icon: MessageSquare, label: "Orações", value: health?.total_prayers },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 border rounded-lg">
                <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-lg font-bold">{(item.value ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Antifraude */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Sinais de Fraude
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Baseado em padrões de comportamento (o app não rastreia IP/dispositivo hoje) — picos de cadastro, contas novas já denunciadas/punidas, e nomes duplicados.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Picos de cadastro (7 dias, 5+ contas/hora)
              </p>
              {!fraud || fraud.signup_bursts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pico detectado.</p>
              ) : (
                <div className="space-y-1">
                  {fraud.signup_bursts.map((b) => (
                    <div key={b.hour} className="flex items-center justify-between text-sm border rounded-lg p-2">
                      <span>{new Date(b.hour).toLocaleString("pt-BR")}</span>
                      <Badge variant="destructive">{b.count} cadastros</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Contas novas (&lt;48h) já denunciadas ou punidas
              </p>
              {!fraud || fraud.young_risky_accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conta suspeita.</p>
              ) : (
                <div className="space-y-1">
                  {fraud.young_risky_accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => { setProfileDialogUserId(acc.id); setShowProfileDialog(true); }}
                      className="w-full flex items-center justify-between text-sm border rounded-lg p-2 hover:bg-accent transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium underline decoration-dotted underline-offset-2">{acc.full_name || acc.email}</p>
                        <p className="text-xs text-muted-foreground">Cadastrada há {acc.hours_old}h</p>
                      </div>
                      <div className="flex gap-2">
                        {acc.reports_count > 0 && <Badge variant="outline" className="text-xs">{acc.reports_count} denúncia(s)</Badge>}
                        {acc.punishments_count > 0 && <Badge variant="destructive" className="text-xs">{acc.punishments_count} punição(ões)</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Copy className="h-4 w-4" /> Nomes duplicados
              </p>
              {!fraud || fraud.duplicate_names.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum nome duplicado.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {fraud.duplicate_names.map((d) => (
                    <Badge key={d.full_name} variant="outline" className="text-xs">
                      {d.full_name} ({d.count}x)
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {lastChecked && (
          <p className="text-xs text-muted-foreground text-center">
            Última verificação: {lastChecked.toLocaleTimeString("pt-BR")} — atualiza automaticamente a cada 30s
          </p>
        )}
      </div>

      <UserProfileDialog
        userId={profileDialogUserId}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </AdminLayout>
  );
}
