import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Crown,
  AlertTriangle,
  Ban,
  Clock,
  Shield,
  User,
  Calendar,
  Award,
  Palette,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  level: number;
  total_xp: number;
  is_vip: boolean;
  vip_tier: string;
  current_theme: string;
  total_posts: number;
  total_comments: number;
  total_achievements: number;
  total_warnings: number;
  total_suspensions: number;
  is_banned: boolean;
  registered_at: string;
  last_sign_in_at: string;
  risk_score: number;
  risk_level: "baixo" | "medio" | "alto" | "critico";
}

const RISK_CONFIG: Record<UserProfile["risk_level"], { label: string; emoji: string; className: string }> = {
  baixo: { label: "Baixo risco", emoji: "🟢", className: "text-green-700 dark:text-green-400 border-green-300 dark:border-green-800" },
  medio: { label: "Médio risco", emoji: "🟡", className: "text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800" },
  alto: { label: "Alto risco", emoji: "🟠", className: "text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800" },
  critico: { label: "Crítico", emoji: "🔴", className: "text-red-700 dark:text-red-400 border-red-300 dark:border-red-800" },
};

export default function AdminUsersEnhanced() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"warn" | "suspend" | "ban" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("7");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, adminLoading, navigate, filter]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from("admin_user_profile")
        .select("*")
        .order("registered_at", { ascending: false })
        .limit(100);

      if (filter === "vip") {
        query = query.eq("is_vip", true);
      } else if (filter === "banned") {
        query = query.eq("is_banned", true);
      } else if (filter === "warned") {
        query = query.gt("total_warnings", 0);
      } else if (filter === "risk") {
        query = query.in("risk_level", ["alto", "critico"]);
      }

      const { data, error } = await query;

      if (error) throw error;

      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType || !actionReason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o motivo da ação.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Usuário não autenticado");

      let rpcName: "warn_user" | "suspend_user" | "ban_user" = "warn_user";
      let params: any = {
        p_user_id: selectedUser.id,
        p_admin_id: currentUser.user.id,
        p_reason: actionReason,
      };

      if (actionType === "warn") {
        rpcName = "warn_user";
      } else if (actionType === "suspend") {
        rpcName = "suspend_user";
        params.p_duration_days = parseInt(suspensionDays);
      } else if (actionType === "ban") {
        rpcName = "ban_user";
      }

      const { error } = await supabase.rpc(rpcName, params);

      if (error) throw error;

      toast({
        title: "Ação Aplicada",
        description: `Usuário ${actionType === "warn" ? "advertido" : actionType === "suspend" ? "suspenso" : "banido"} com sucesso.`,
      });

      // Reset
      setShowActionDialog(false);
      setSelectedUser(null);
      setActionType(null);
      setActionReason("");
      setSuspensionDays("7");

      // Reload
      loadUsers();
    } catch (error: any) {
      console.error("Erro ao aplicar ação:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível aplicar ação.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestão Avançada de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Perfis completos, punições e gerenciamento
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vip">Apenas VIP</SelectItem>
                  <SelectItem value="warned">Com Advertências</SelectItem>
                  <SelectItem value="banned">Banidos</SelectItem>
                  <SelectItem value="risk">Alto Risco / Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || "Sem nome"}</p>
                          <div className="flex gap-1 mt-1">
                            {user.is_vip && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1 text-yellow-600" />
                                VIP
                              </Badge>
                            )}
                            {user.total_warnings > 0 && (
                              <Badge variant="outline" className="text-xs text-orange-600">
                                {user.total_warnings} ⚠️
                              </Badge>
                            )}
                            {user.is_banned && (
                              <Badge variant="destructive" className="text-xs">
                                Banido
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="font-bold">Nv.{user.level || 0}</span>
                        <span className="text-xs text-muted-foreground">
                          ({user.total_xp} XP)
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {user.total_posts} posts
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.total_achievements} conquistas
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${RISK_CONFIG[user.risk_level]?.className || ""}`}
                        title={`Pontuação: ${user.risk_score}/100 — advertências, suspensões, denúncias aprovadas e idade da conta. A decisão final é sempre do administrador.`}
                      >
                        {RISK_CONFIG[user.risk_level]?.emoji} {RISK_CONFIG[user.risk_level]?.label || "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("warn");
                            setShowActionDialog(true);
                          }}
                          disabled={!hasPermission("users.warn") || user.is_banned}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("suspend");
                            setShowActionDialog(true);
                          }}
                          disabled={!hasPermission("users.suspend") || user.is_banned}
                        >
                          <Clock className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("ban");
                            setShowActionDialog(true);
                          }}
                          disabled={!hasPermission("users.ban") || user.is_banned}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "warn" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              {actionType === "suspend" && <Clock className="h-5 w-5 text-orange-600" />}
              {actionType === "ban" && <Ban className="h-5 w-5 text-red-600" />}
              {actionType === "warn" && "Advertir Usuário"}
              {actionType === "suspend" && "Suspender Usuário"}
              {actionType === "ban" && "Banir Usuário"}
            </DialogTitle>
            <DialogDescription>
              Usuário: <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "suspend" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Duração</label>
                <Select value={suspensionDays} onValueChange={setSuspensionDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Motivo *</label>
              <Textarea
                placeholder="Descreva o motivo da ação..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>

            {actionType === "ban" && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300">
                  ⚠️ <strong>ATENÇÃO:</strong> O banimento é permanente e remove completamente o acesso do usuário à plataforma.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false);
                setSelectedUser(null);
                setActionType(null);
                setActionReason("");
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={!actionReason || processing}
              variant={actionType === "ban" ? "destructive" : "default"}
            >
              {processing ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
