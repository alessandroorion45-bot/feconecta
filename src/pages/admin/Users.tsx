import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Crown, Shield, Ban, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  full_name: string;
  email: string;
  total_xp: number;
  created_at: string;
  user_id_number: number;
}

export default function AdminUsers() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [vipFilter, setVipFilter] = useState<string>("all");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from("users")
        .select("id, full_name, email, total_xp, created_at, user_id_number")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data || []);
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

  const handleGrantVIP = async (userId: string) => {
    if (!hasPermission("users.grant_vip")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para conceder VIP.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc("grant_vip", {
        p_user_id: userId,
        p_vip_tier: "standard",
        p_duration_days: null,
        p_grant_reason: "Concedido via admin panel",
      });

      if (error) throw error;

      toast({
        title: "VIP Concedido!",
        description: "O usuário agora tem acesso VIP.",
      });

      loadUsers();
    } catch (error: any) {
      console.error("Erro ao conceder VIP:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível conceder VIP.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `ID-${String(user.user_id_number).padStart(6, "0")}`.includes(searchTerm);

    return matchesSearch;
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
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar usuários, permissões e status VIP
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={vipFilter} onValueChange={setVipFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar VIP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vip">Apenas VIP</SelectItem>
                <SelectItem value="non-vip">Não VIP</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      ID-{String(user.user_id_number).padStart(6, "0")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.full_name || "Sem nome"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.total_xp?.toLocaleString() || 0} XP
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <Check className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGrantVIP(user.id)}
                          disabled={!hasPermission("users.grant_vip")}
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          VIP
                        </Button>

                        <Button size="sm" variant="outline" disabled>
                          <Shield className="h-3 w-3 mr-1" />
                          Roles
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!hasPermission("users.ban")}
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
    </AdminLayout>
  );
}
