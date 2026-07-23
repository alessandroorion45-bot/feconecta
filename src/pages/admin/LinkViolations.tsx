import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, LinkIcon, ChevronLeft, ChevronRight, ShieldAlert, Users, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ModerationActions } from "@/components/admin/ModerationActions";

interface Violation {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  content_original: string;
  content_type: string;
  created_at: string;
  total_violacoes_usuario: number;
}

const TYPE_LABEL: Record<string, string> = {
  post: "Publicação",
  comentario: "Comentário",
  comentario_versiculo: "Comentário (versículo)",
  mensagem: "Mensagem",
};

const typeLabel = (t: string) => TYPE_LABEL[t] || t;

export default function LinkViolations() {
  const [rows, setRows] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, usuarios: 0, ultimas24h: 0 });
  const PAGE_SIZE = 25;

  const loadStats = useCallback(async () => {
    const { data } = await (supabase as any).from("admin_link_violations").select("user_id, created_at");
    if (!data) return;
    const since = Date.now() - 24 * 60 * 60 * 1000;
    setStats({
      total: data.length,
      usuarios: new Set(data.map((r: any) => r.user_id)).size,
      ultimas24h: data.filter((r: any) => new Date(r.created_at).getTime() >= since).length,
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from("admin_link_violations")
        .select("*", { count: "exact" })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (search.trim().length >= 2) {
        query = query.or(
          `user_email.ilike.%${search}%,user_name.ilike.%${search}%,content_original.ilike.%${search}%`,
        );
      }

      const { data, count } = await query;
      setRows(data || []);
      setTotal(count || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Violações de Link"
        description="Tentativas bloqueadas de compartilhar links externos em posts, comentários e mensagens"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10">
              <ShieldAlert className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de tentativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.usuarios}</p>
              <p className="text-xs text-muted-foreground">Usuários distintos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ultimas24h}</p>
              <p className="text-xs text-muted-foreground">Últimas 24h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, e-mail ou conteúdo..."
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Conteúdo tentado</TableHead>
                  <TableHead className="text-center">Tentativas</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma violação registrada. 🙏
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.user_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.user_email || r.user_id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabel(r.content_type)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground line-clamp-2 break-words">
                          {r.content_original}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.total_violacoes_usuario >= 3 ? "destructive" : "secondary"}>
                          {r.total_violacoes_usuario}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ModerationActions
                          userId={r.user_id}
                          userName={r.user_name || r.user_email || r.user_id}
                          defaultReason={`Compartilhamento reincidente de links externos (${r.total_violacoes_usuario} tentativas)`}
                          onDone={load}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages} · {total} registros
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-2 rounded-md border disabled:opacity-40 hover:bg-accent/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-md border disabled:opacity-40 hover:bg-accent/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
