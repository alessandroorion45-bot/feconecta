import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminActions } from "@/hooks/useAdminActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";

interface AdminLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action_type: string;
  action_description: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
}

export default function AdminLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getAdminLogs } = useAdminActions();

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // HARDCODED: Verificar se é admin
  const isAdmin = user?.email === 'alessandroibama40@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    loadLogs();
  }, [isAdmin, navigate]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminLogs(200); // Buscar últimos 200 logs
      setLogs(data);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadgeVariant = (actionType: string) => {
    if (actionType.includes('ban') || actionType.includes('delete')) {
      return 'destructive';
    }
    if (actionType.includes('warn') || actionType.includes('suspend')) {
      return 'secondary';
    }
    if (actionType.includes('grant') || actionType.includes('create')) {
      return 'default';
    }
    return 'outline';
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Logs Administrativos</h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de ações administrativas
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por admin, ação ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                <FileText className="h-5 w-5 inline mr-2" />
                Últimas Ações ({filteredLogs.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando logs...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Alvo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.admin_email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                        {log.action_description}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.target_type && (
                          <span>
                            {log.target_type}
                            {log.target_id && (
                              <span className="font-mono ml-1">
                                ({log.target_id.slice(0, 8)}...)
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
