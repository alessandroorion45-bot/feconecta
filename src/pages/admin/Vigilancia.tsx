import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Eye, ChevronLeft, ChevronRight, ShieldAlert, MapPin, Server, Check } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface Intrusion {
  id: string;
  ip: string | null;
  localizacao_aproximada: string | null;
  conta_alvo_id: string | null;
  conta_alvo_email: string | null;
  conta_alvo_nome: string | null;
  tipo_tentativa: string;
  user_agent: string | null;
  tentativas: number;
  resolvido: boolean;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  login_falho_repetido: "Login falho repetido",
  acesso_nao_autorizado: "Acesso não autorizado",
};

const typeLabel = (t: string) => TYPE_LABEL[t] || t;

export default function Vigilancia() {
  const [rows, setRows] = useState<Intrusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, ips: 0, contas: 0, ultimas24h: 0, ipSuspeito: null as string | null });
  const PAGE_SIZE = 25;

  const loadStats = useCallback(async () => {
    const { data } = await (supabase as any).from("admin_intrusion_attempts").select("ip, conta_alvo_email, created_at");
    if (!data) return;
    const since = Date.now() - 24 * 60 * 60 * 1000;
    // IP que atacou mais contas distintas = possível ataque em massa
    const byIp: Record<string, Set<string>> = {};
    data.forEach((r: any) => {
      if (!r.ip) return;
      (byIp[r.ip] ||= new Set()).add(r.conta_alvo_email || "?");
    });
    let ipSuspeito: string | null = null;
    let max = 1;
    Object.entries(byIp).forEach(([ip, contas]) => {
      if (contas.size > max) {
        max = contas.size;
        ipSuspeito = `${ip} (${contas.size} contas)`;
      }
    });
    setStats({
      total: data.length,
      ips: new Set(data.map((r: any) => r.ip).filter(Boolean)).size,
      contas: new Set(data.map((r: any) => r.conta_alvo_email).filter(Boolean)).size,
      ultimas24h: data.filter((r: any) => new Date(r.created_at).getTime() >= since).length,
      ipSuspeito,
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from("admin_intrusion_attempts")
        .select("*", { count: "exact" })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (search.trim().length >= 2) {
        query = query.or(
          `conta_alvo_email.ilike.%${search}%,conta_alvo_nome.ilike.%${search}%,ip.ilike.%${search}%,localizacao_aproximada.ilike.%${search}%`,
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

  const resolve = async (id: string) => {
    await (supabase as any).from("intrusion_attempts").update({ resolvido: true }).eq("id", id);
    load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Olho da Vigilância"
        description="Tentativas de acesso não autorizado a contas — IP, localização aproximada e conta-alvo"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Tentativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10">
              <Server className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ips}</p>
              <p className="text-xs text-muted-foreground">IPs distintos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/10">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.contas}</p>
              <p className="text-xs text-muted-foreground">Contas visadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10">
              <MapPin className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ultimas24h}</p>
              <p className="text-xs text-muted-foreground">Últimas 24h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.ipSuspeito && (
        <Card className="mb-6 border-red-500/40">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold text-red-600">Possível ataque em massa:</span> o IP{" "}
              <span className="font-mono">{stats.ipSuspeito}</span> tentou acessar várias contas diferentes.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por conta, e-mail, IP ou localização..."
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
                  <TableHead>Conta-alvo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Localização aprox.</TableHead>
                  <TableHead className="text-center">Tentativas</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma tentativa de invasão registrada. 🛡️
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} className={r.resolvido ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="font-medium">{r.conta_alvo_nome || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.conta_alvo_email || "conta inexistente"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{typeLabel(r.tipo_tentativa)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.ip || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] break-words">
                        {r.localizacao_aproximada || "não determinada"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.tentativas >= 10 ? "destructive" : "secondary"}>{r.tentativas}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {r.resolvido ? (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Resolvido
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => resolve(r.id)}>
                            Resolver
                          </Button>
                        )}
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
