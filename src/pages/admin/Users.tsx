import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useAdminActions } from "@/hooks/useAdminActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, AlertTriangle, Clock, Ban, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  registered_at: string;
  last_sign_in_at: string | null;
  total_warnings: number;
}

type PunishmentType = 'warning' | 'suspend' | 'ban';

export default function AdminUsers() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getUserProfiles, warnUser, suspendUser, banUser } = useAdminActions();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [showPunishDialog, setShowPunishDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [punishmentType, setPunishmentType] = useState<PunishmentType>('warning');
  const [reason, setReason] = useState("");
  const [suspendDays, setSuspendDays] = useState(7);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!isAdmin) {
      navigate("/");
      return;
    }

    loadUsers();
  }, [isAdmin, authLoading, adminLoading, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUserProfiles();
      setUsers(data);
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

  const openPunishDialog = (user: UserProfile, type: PunishmentType) => {
    setSelectedUser(user);
    setPunishmentType(type);
    setReason("");
    setShowPunishDialog(true);
  };

  const handlePunish = async () => {
    if (!selectedUser || !reason.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o motivo da punição.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      let success = false;

      switch (punishmentType) {
        case 'warning':
          success = await warnUser(selectedUser.id, reason);
          break;
        case 'suspend':
          success = await suspendUser(selectedUser.id, reason, suspendDays);
          break;
        case 'ban':
          success = await banUser(selectedUser.id, reason);
          break;
      }

      if (success) {
        const messages = {
          warning: "Usuário advertido com sucesso!",
          suspend: `Usuário suspenso por ${suspendDays} dias!`,
          ban: "Usuário banido permanentemente!",
        };

        toast({
          title: "Sucesso!",
          description: messages[punishmentType],
        });

        setShowPunishDialog(false);
        loadUsers();
      } else {
        throw new Error("Falha ao aplicar punição");
      }
    } catch (error: any) {
      console.error("Erro ao punir usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível aplicar a punição.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
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
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar usuários, advertências e punições
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
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
                  <TableHead>Email</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Advertências</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.registered_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      {user.total_warnings > 0 ? (
                        <Badge variant="destructive">
                          {user.total_warnings} {user.total_warnings === 1 ? 'advertência' : 'advertências'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Nenhuma</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPunishDialog(user, 'warning')}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Advertir
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPunishDialog(user, 'suspend')}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Suspender
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openPunishDialog(user, 'ban')}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Banir
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

      {/* Punishment Dialog */}
      <Dialog open={showPunishDialog} onOpenChange={setShowPunishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {punishmentType === 'warning' && 'Advertir Usuário'}
              {punishmentType === 'suspend' && 'Suspender Usuário'}
              {punishmentType === 'ban' && 'Banir Usuário'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {punishmentType === 'suspend' && (
              <div className="space-y-2">
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(parseInt(e.target.value) || 7)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                placeholder="Descreva o motivo da punição..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>

            {punishmentType === 'ban' && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive font-semibold">
                  ⚠️ ATENÇÃO: Esta ação é PERMANENTE!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O usuário será banido permanentemente e não poderá mais acessar a plataforma.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPunishDialog(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button
              variant={punishmentType === 'ban' ? 'destructive' : 'default'}
              onClick={handlePunish}
              disabled={processing || !reason.trim()}
            >
              {processing ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
