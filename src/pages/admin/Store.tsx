import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Plus, Pencil, Eye, EyeOff, Archive, Loader2, Search, Target } from "lucide-react";

interface StoreProductRow {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  mensagem: string | null;
  verse_reference: string | null;
  verse_text: string | null;
  tipo: string;
  badge_id: string | null;
  cosmetic_key: string | null;
  image_url: string | null;
  preco: number;
  categoria: string;
  status: "active" | "hidden" | "archived";
  giftable: boolean;
  limitado: boolean;
  estoque: number | null;
  ordem: number;
  created_at: string;
  vendas?: number;
}

interface BadgeOption {
  id: string;
  name: string;
}

const TIPOS = [
  { value: "selo", label: "Selo (concede um Selo Kingdom)" },
  { value: "moldura", label: "Moldura de avatar" },
  { value: "fundo", label: "Fundo de perfil" },
  { value: "efeito", label: "Efeito visual" },
  { value: "outro", label: "Outro" },
];

const emptyForm = {
  nome: "",
  descricao: "",
  mensagem: "",
  verse_reference: "",
  verse_text: "",
  tipo: "selo",
  badge_id: "",
  cosmetic_key: "",
  preco: "10",
  categoria: "",
  status: "active" as StoreProductRow["status"],
  giftable: true,
  limitado: false,
  estoque: "",
};

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminStore() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<StoreProductRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);
  const [badgeOptions, setBadgeOptions] = useState<BadgeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [metaMensal, setMetaMensal] = useState("");
  const [metaAtiva, setMetaAtiva] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: badges }, { data: settings }, { data: purchases }] = await Promise.all([
      supabase.from("store_products").select("*").order("categoria").order("ordem"),
      supabase.from("store_categories").select("id, nome").order("ordem"),
      supabase.from("badges").select("id, name").order("name"),
      supabase.from("store_settings").select("meta_mensal, meta_ativa").eq("id", 1).maybeSingle(),
      supabase.from("store_purchases").select("product_id").eq("status", "approved"),
    ]);

    const salesCount = new Map<string, number>();
    (purchases || []).forEach((p: { product_id: string }) => {
      salesCount.set(p.product_id, (salesCount.get(p.product_id) || 0) + 1);
    });

    setProducts(((prods || []) as StoreProductRow[]).map((p) => ({ ...p, vendas: salesCount.get(p.id) || 0 })));
    setCategories(cats || []);
    setBadgeOptions(badges || []);
    if (settings) {
      setMetaMensal(String(settings.meta_mensal ?? 0));
      setMetaAtiva(!!settings.meta_ativa);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) loadAll();
  }, [isAdmin, adminLoading, navigate, loadAll]);

  const saveMeta = async () => {
    setSavingMeta(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ meta_mensal: Number(metaMensal) || 0, meta_ativa: metaAtiva, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingMeta(false);
    if (error) {
      toast({ title: "Erro ao salvar meta", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Meta atualizada" });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoria: categories[0]?.nome || "" });
    setShowForm(true);
  };

  const openEdit = (p: StoreProductRow) => {
    setEditingId(p.id);
    setForm({
      nome: p.nome,
      descricao: p.descricao || "",
      mensagem: p.mensagem || "",
      verse_reference: p.verse_reference || "",
      verse_text: p.verse_text || "",
      tipo: p.tipo,
      badge_id: p.badge_id || "",
      cosmetic_key: p.cosmetic_key || "",
      preco: String(p.preco),
      categoria: p.categoria,
      status: p.status,
      giftable: p.giftable,
      limitado: p.limitado,
      estoque: p.estoque != null ? String(p.estoque) : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.categoria || !Number(form.preco)) {
      toast({ title: "Preencha nome, categoria e preço", variant: "destructive" });
      return;
    }
    if (form.tipo === "selo" && !form.badge_id) {
      toast({ title: "Produto do tipo Selo precisa de um Selo Kingdom vinculado", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao || null,
        mensagem: form.mensagem || null,
        verse_reference: form.verse_reference || null,
        verse_text: form.verse_text || null,
        tipo: form.tipo,
        badge_id: form.tipo === "selo" ? form.badge_id : null,
        cosmetic_key: form.tipo !== "selo" && form.tipo !== "outro" ? (form.cosmetic_key || slugify(form.nome)) : null,
        preco: Number(form.preco),
        categoria: form.categoria,
        status: form.status,
        giftable: form.giftable,
        limitado: form.limitado,
        estoque: form.limitado && form.estoque ? Number(form.estoque) : null,
      };

      if (editingId) {
        const { error } = await supabase.from("store_products").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Produto atualizado" });
      } else {
        const { error } = await supabase.from("store_products").insert({ ...payload, slug: `${slugify(form.nome)}-${Date.now().toString(36)}` });
        if (error) throw error;
        toast({ title: "Produto criado" });
      }
      setShowForm(false);
      loadAll();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (p: StoreProductRow, status: StoreProductRow["status"]) => {
    const { error } = await supabase.from("store_products").update({ status }).eq("id", p.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    loadAll();
  };

  const filtered = products.filter((p) => !searchTerm || p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-amber-500" />
              Kingdom Store
            </h1>
            <p className="text-sm text-muted-foreground">{products.length} produto{products.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        </div>

        {/* Meta do mês */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" /> Meta do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Input
              type="number"
              value={metaMensal}
              onChange={(e) => setMetaMensal(e.target.value)}
              placeholder="Ex: 5000"
              className="w-40"
            />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={metaAtiva} onCheckedChange={setMetaAtiva} />
              Mostrar barra de progresso na loja
            </label>
            <Button size="sm" onClick={saveMeta} disabled={savingMeta}>
              {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar meta"}
            </Button>
          </CardContent>
        </Card>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className={p.status !== "active" ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {TIPOS.find((t) => t.value === p.tipo)?.label.split(" (")[0] || p.tipo}
                    </TableCell>
                    <TableCell className="text-xs">{p.categoria}</TableCell>
                    <TableCell>R$ {Number(p.preco).toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell>{p.vendas}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status === "active" ? "Ativo" : p.status === "hidden" ? "Oculto" : "Arquivado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {p.status === "active" ? (
                          <Button size="icon" variant="ghost" onClick={() => setStatus(p, "hidden")} title="Ocultar">
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => setStatus(p, "active")} title="Ativar">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setStatus(p, "archived")} title="Arquivar">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground">Nenhum produto.</div>}
          </CardContent>
        </Card>
      </div>

      {/* Modal criar/editar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>Itens cosméticos e colecionáveis da Kingdom Store.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome</label>
                <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Preço (R$)</label>
                <Input type="number" value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea rows={2} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.tipo === "selo" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Selo Kingdom concedido na compra</label>
                <Select value={form.badge_id} onValueChange={(v) => setForm((f) => ({ ...f, badge_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Escolha o selo" /></SelectTrigger>
                  <SelectContent>
                    {badgeOptions.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Versículo (opcional)</label>
                <Input value={form.verse_reference} onChange={(e) => setForm((f) => ({ ...f, verse_reference: e.target.value }))} placeholder="Ex: Provérbios 11:25" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Texto do versículo (opcional)</label>
                <Input value={form.verse_text} onChange={(e) => setForm((f) => ({ ...f, verse_text: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem de agradecimento (opcional)</label>
              <Input value={form.mensagem} onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))} placeholder='Ex: "Sua generosidade ajuda a manter esta missão viva."' />
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.giftable} onCheckedChange={(v) => setForm((f) => ({ ...f, giftable: v }))} />
                Pode ser presenteado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.limitado} onCheckedChange={(v) => setForm((f) => ({ ...f, limitado: v }))} />
                Edição limitada
              </label>
              {form.limitado && (
                <Input
                  type="number"
                  className="w-28"
                  placeholder="Estoque"
                  value={form.estoque}
                  onChange={(e) => setForm((f) => ({ ...f, estoque: e.target.value }))}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={form.status} onValueChange={(v: StoreProductRow["status"]) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? "Salvar alterações" : "Criar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
