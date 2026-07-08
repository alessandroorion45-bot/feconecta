import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
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
import { Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

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
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 30;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (searchTerm.trim().length >= 2) {
        query = query.or(
          `admin_email.ilike.%${searchTerm}%,action_type.ilike.%${searchTerm}%,action_description.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!isAdmin) {
      navigate("/");
      return;
    }

    loadLogs();
  }, [isAdmin, authLoading, adminLoading, navigate, loadLogs]);

  // Busca reseta pra primeira página, com debounce
  useEffect(() => {
    if (page !== 0) {
      setPage(0);
      return;
    }
    const timeout = setTimeout(loadLogs, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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
        <AdminPageHeader
          title="Logs Administrativos"
          description="Histórico completo de ações administrativas"
        />

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
                Últimas Ações ({totalCount})
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
                  {logs.map((log) => (
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

            {!loading && logs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado.
              </div>
            )}

            {totalCount > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Página {page + 1} de {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => (p + 1) * PAGE_SIZE < totalCount ? p + 1 : p)}
                    disabled={(page + 1) * PAGE_SIZE >= totalCount}
                  >
                    Próxima <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
