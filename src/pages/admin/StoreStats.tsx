import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Award, Gift, Palette, Frame, ShoppingBag, TrendingUp, Coins, Loader2, Trophy } from "lucide-react";

interface TypeStat {
  tipo: string;
  produtos_no_catalogo: number;
  vendas: number;
  receita: number;
  presenteados: number;
  pendentes: number;
}

interface ProductStat {
  id: string;
  nome: string;
  tipo: string;
  raridade: string | null;
  preco: number;
  image_url: string | null;
  icone: string | null;
  vendas: number;
  receita: number;
  presenteados: number;
  compras_proprias: number;
  ultima_venda: string | null;
}

const TYPE_META: Record<string, { label: string; icon: typeof Award; color: string }> = {
  selo: { label: "Selos", icon: Award, color: "#f59e0b" },
  presente: { label: "Presentes", icon: Gift, color: "#ec4899" },
  tema: { label: "Temas", icon: Palette, color: "#8b5cf6" },
  moldura: { label: "Molduras", icon: Frame, color: "#06b6d4" },
  fundo: { label: "Fundos", icon: Palette, color: "#10b981" },
  efeito: { label: "Efeitos", icon: Palette, color: "#f43f5e" },
};

const typeMeta = (t: string) => TYPE_META[t] || { label: t, icon: ShoppingBag, color: "#6b7280" };
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function StoreStats() {
  const [byType, setByType] = useState<TypeStat[]>([]);
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        (supabase as any).from("admin_store_stats_by_type").select("*"),
        (supabase as any).from("admin_store_product_stats").select("*"),
      ]);
      setByType((t.data || []).map((r: any) => ({ ...r, receita: Number(r.receita) })));
      setProducts((p.data || []).map((r: any) => ({ ...r, receita: Number(r.receita), preco: Number(r.preco) })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalReceita = byType.reduce((s, r) => s + r.receita, 0);
  const totalVendas = byType.reduce((s, r) => s + r.vendas, 0);
  const totalPresentes = byType.reduce((s, r) => s + r.presenteados, 0);
  const totalCatalogo = byType.reduce((s, r) => s + r.produtos_no_catalogo, 0);
  const maisVendido = products.find((p) => p.vendas > 0) || null;

  const chartData = byType.map((r) => ({ ...typeMeta(r.tipo), vendas: r.vendas, receita: r.receita }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Estatísticas da Loja"
        description="Vendas reais de selos, presentes, temas e cosméticos da Kingdom Store"
      />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-green-600" />
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10">
              <Coins className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{brl(totalReceita)}</p>
              <p className="text-xs text-muted-foreground">Receita total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-600" />
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalVendas}</p>
              <p className="text-xs text-muted-foreground">Vendas aprovadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-400 to-rose-600" />
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-pink-500/10">
              <Gift className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPresentes}</p>
              <p className="text-xs text-muted-foreground">Presentes enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-600" />
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10">
              <ShoppingBag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCatalogo}</p>
              <p className="text-xs text-muted-foreground">Produtos no catálogo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produto campeão */}
      {maisVendido && (
        <Card className="mb-6 border-amber-400/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
          <CardContent className="flex items-center gap-4 p-5 relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            {maisVendido.image_url ? (
              <img src={maisVendido.image_url} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">
                {maisVendido.icone || "🎁"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Campeão de vendas</p>
              <p className="text-lg font-bold truncate">{maisVendido.nome}</p>
              <p className="text-sm text-muted-foreground">
                {maisVendido.vendas} {maisVendido.vendas === 1 ? "venda" : "vendas"} · {brl(maisVendido.receita)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cards por tipo */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Desempenho por categoria</h3>
            <div className="space-y-3">
              {byType.map((r) => {
                const m = typeMeta(r.tipo);
                const Icon = m.icon;
                const maxVendas = Math.max(1, ...byType.map((x) => x.vendas));
                return (
                  <div key={r.tipo} className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                      style={{ background: `${m.color}1a` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-muted-foreground">
                          {r.vendas} {r.vendas === 1 ? "venda" : "vendas"} · {brl(r.receita)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(r.vendas / maxVendas) * 100}%`, background: m.color }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {r.produtos_no_catalogo} no catálogo · {r.presenteados} presenteados
                        {r.pendentes > 0 && ` · ${r.pendentes} pendente(s)`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de vendas por tipo */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Vendas por categoria</h3>
            {totalVendas === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-center text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Ainda não há vendas aprovadas.</p>
                <p className="text-xs">Os números aparecem aqui assim que a primeira compra for aprovada.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number, name: string) => (name === "vendas" ? [v, "Vendas"] : [brl(v), "Receita"])}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="vendas" radius={[0, 6, 6, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de produtos */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Todos os produtos</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-center">Presenteados</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, i) => {
                  const m = typeMeta(p.tipo);
                  return (
                    <TableRow key={p.id} className={p.vendas === 0 ? "opacity-60" : ""}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                          ) : (
                            <span className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm shrink-0">
                              {p.icone || "🎁"}
                            </span>
                          )}
                          <span className="font-medium">{p.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: `${m.color}66`, color: m.color }}>
                          {m.label.replace(/s$/, "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{brl(p.preco)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={p.vendas > 0 ? "default" : "secondary"}>{p.vendas}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{p.presenteados}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{brl(p.receita)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
