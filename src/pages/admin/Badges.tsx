import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Crown, Search, Plus, Pencil, Copy, Eye, EyeOff, Archive, Gift, Upload, UserPlus, Loader2,
  ArrowUp, ArrowDown, Download, FileUp,
} from "lucide-react";
import KingdomBadge from "@/components/kingdom-badges/KingdomBadge";
import { ImageCropModal } from "@/components/ImageCropModal";

interface BadgeCategory {
  id: string;
  nome: string;
  icone: string | null;
}

interface BadgeRarity {
  id: string;
  nome: string;
  slug: string;
  cor_inicio: string;
  cor_fim: string;
}

interface BadgeRow {
  id: string;
  badge_key: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image_url: string | null;
  rarity: string;
  category: string;
  unlock_criteria: { type: string; action?: string; value?: number } | null;
  automatico: boolean;
  status: "active" | "hidden" | "archived";
  xp_reward: number;
  verse_reference: string | null;
  verse_text: string | null;
  unlock_story: string | null;
  ordem: number;
  created_at: string;
  users_count?: number;
}

interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
}

const UNLOCK_TYPES = [
  { value: "manual", label: "Manual (só admin concede)" },
  { value: "donation", label: "Doação" },
  { value: "first_donation", label: "Primeira doação" },
  { value: "action_count", label: "Quantidade de ações" },
  { value: "streak", label: "Sequência de dias" },
  { value: "streak_action", label: "Sequência de uma ação" },
  { value: "total_xp", label: "Quantidade de XP" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Outra" },
];

const emptyForm = {
  name: "",
  description: "",
  icon: "🏅",
  image_url: "" as string | null,
  rarity: "",
  category: "",
  unlock_type: "manual",
  unlock_action: "",
  unlock_value: "",
  automatico: false,
  status: "active" as BadgeRow["status"],
  xp_reward: "0",
  verse_reference: "",
  verse_text: "",
  unlock_story: "",
};

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminBadges() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [categories, setCategories] = useState<BadgeCategory[]>([]);
  const [rarities, setRarities] = useState<BadgeRarity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const [grantBadge, setGrantBadge] = useState<BadgeRow | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [grantObservacao, setGrantObservacao] = useState("");
  const [granting, setGranting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: badgeRows }, { data: cats }, { data: rars }, { data: userBadgeRows }] = await Promise.all([
      supabase.from("badges").select("*").order("ordem", { ascending: true }).order("created_at", { ascending: false }),
      supabase.from("badge_categories").select("*").order("ordem", { ascending: true }),
      supabase.from("badge_rarities").select("*").order("ordem", { ascending: true }),
      supabase.from("user_badges").select("badge_id"),
    ]);

    const counts = new Map<string, number>();
    (userBadgeRows || []).forEach((row: { badge_id: string }) => {
      counts.set(row.badge_id, (counts.get(row.badge_id) || 0) + 1);
    });

    setBadges((badgeRows || []).map((b) => ({ ...b, users_count: counts.get(b.id) || 0 })) as BadgeRow[]);
    setCategories(cats || []);
    setRarities(rars || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) loadAll();
  }, [isAdmin, adminLoading, navigate, loadAll]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, rarity: rarities[0]?.slug || "", category: categories[0]?.nome || "" });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (badge: BadgeRow) => {
    setEditingId(badge.id);
    setForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      image_url: badge.image_url,
      rarity: badge.rarity,
      category: badge.category,
      unlock_type: badge.unlock_criteria?.type || "manual",
      unlock_action: badge.unlock_criteria?.action || "",
      unlock_value: badge.unlock_criteria?.value != null ? String(badge.unlock_criteria.value) : "",
      automatico: badge.automatico,
      status: badge.status,
      xp_reward: String(badge.xp_reward ?? 0),
      verse_reference: badge.verse_reference || "",
      verse_text: badge.verse_text || "",
      unlock_story: badge.unlock_story || "",
    });
    setImageFile(null);
    setImagePreview(badge.image_url);
    setShowForm(true);
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    setShowCrop(true);
  };

  const handleCropComplete = (blob: Blob) => {
    const file = new File([blob], "selo.jpg", { type: "image/jpeg" });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(blob));
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { data, error } = await supabase
      .from("badge_categories")
      .insert({ nome: newCategoryName.trim(), ordem: categories.length + 1 })
      .select()
      .single();
    if (error) {
      toast({ title: "Erro ao criar categoria", description: error.message, variant: "destructive" });
      return;
    }
    setCategories((prev) => [...prev, data]);
    setForm((f) => ({ ...f, category: data.nome }));
    setNewCategoryName("");
    setShowNewCategory(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.rarity || !form.category) {
      toast({ title: "Preencha nome, raridade e categoria", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${slugify(form.name)}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("kingdom-badges").upload(path, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        image_url = supabase.storage.from("kingdom-badges").getPublicUrl(path).data.publicUrl;
      }

      const unlock_criteria: Record<string, unknown> = { type: form.unlock_type };
      if (form.unlock_action) unlock_criteria.action = form.unlock_action;
      if (form.unlock_value) unlock_criteria.value = Number(form.unlock_value);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon || "🏅",
        image_url,
        rarity: form.rarity,
        category: form.category,
        unlock_criteria,
        automatico: form.automatico,
        status: form.status,
        xp_reward: Number(form.xp_reward) || 0,
        verse_reference: form.verse_reference || null,
        verse_text: form.verse_text || null,
        unlock_story: form.unlock_story || null,
      };

      if (editingId) {
        const { error } = await supabase.from("badges").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Selo atualizado" });
      } else {
        const badge_key = `${slugify(form.name)}-${Date.now().toString(36)}`;
        const { error } = await supabase.from("badges").insert({ ...payload, badge_key, slug: slugify(form.name) });
        if (error) throw error;
        toast({ title: "Selo criado" });
      }

      setShowForm(false);
      loadAll();
    } catch (error) {
      toast({ title: "Erro ao salvar selo", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const duplicateBadge = async (badge: BadgeRow) => {
    const { id, badge_key, slug, users_count, created_at, ...rest } = badge;
    const newName = `${badge.name} (cópia)`;
    const { error } = await supabase.from("badges").insert({
      ...rest,
      name: newName,
      badge_key: `${slugify(newName)}-${Date.now().toString(36)}`,
      slug: slugify(newName),
      status: "hidden",
    });
    if (error) {
      toast({ title: "Erro ao duplicar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Selo duplicado", description: "Criado como oculto — edite e ative quando quiser." });
    loadAll();
  };

  const setStatus = async (badge: BadgeRow, status: BadgeRow["status"]) => {
    const { error } = await supabase.from("badges").update({ status }).eq("id", badge.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    loadAll();
  };

  const moveBadge = async (badge: BadgeRow, direction: "up" | "down") => {
    const sorted = [...badges].sort((a, b) => a.ordem - b.ordem);
    const index = sorted.findIndex((b) => b.id === badge.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const neighbor = sorted[swapIndex];

    await Promise.all([
      supabase.from("badges").update({ ordem: neighbor.ordem }).eq("id", badge.id),
      supabase.from("badges").update({ ordem: badge.ordem }).eq("id", neighbor.id),
    ]);
    loadAll();
  };

  const exportBadges = () => {
    const exportable = badges.map(({ id, users_count, created_at, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selos-kingdom-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBadges = async (file: File) => {
    try {
      const text = await file.text();
      const items = JSON.parse(text) as Partial<BadgeRow>[];
      if (!Array.isArray(items)) throw new Error("Arquivo precisa ser uma lista de selos.");

      let created = 0;
      for (const item of items) {
        if (!item.name) continue;
        const badge_key = `${slugify(item.name)}-${Date.now().toString(36)}-${created}`;
        const { error } = await supabase.from("badges").insert({
          badge_key,
          slug: slugify(item.name),
          name: item.name,
          description: item.description || "",
          icon: item.icon || "🏅",
          image_url: item.image_url || null,
          rarity: item.rarity || "common",
          category: item.category || categories[0]?.nome || "Especiais",
          unlock_criteria: item.unlock_criteria || { type: "manual" },
          automatico: item.automatico || false,
          status: item.status || "hidden",
          xp_reward: item.xp_reward || 0,
          verse_reference: item.verse_reference || null,
          verse_text: item.verse_text || null,
          unlock_story: item.unlock_story || null,
        });
        if (!error) created++;
      }
      toast({ title: `${created} selo(s) importado(s)`, description: created < items.length ? "Alguns itens foram ignorados (sem nome)." : undefined });
      loadAll();
    } catch (error) {
      toast({ title: "Erro ao importar", description: (error as Error).message, variant: "destructive" });
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserResults([]);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    setUserResults((data || []).map((u) => ({ id: u.id, email: u.email || "", full_name: u.full_name || "Sem nome" })));
  };

  const handleGrant = async () => {
    if (!grantBadge || !selectedUser) return;
    setGranting(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { error } = await supabase.from("user_badges").insert({
        user_id: selectedUser.id,
        badge_id: grantBadge.id,
        concedido_por: currentUser.user?.id,
        observacao: grantObservacao || null,
      });
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedUser.id,
        type: "admin_success",
        content: `Você recebeu o selo "${grantBadge.name}"! 👑`,
      });

      toast({ title: "Selo concedido", description: `${grantBadge.name} → ${selectedUser.full_name}` });
      setGrantBadge(null);
      setSelectedUser(null);
      setUserSearch("");
      setGrantObservacao("");
      loadAll();
    } catch (error) {
      toast({ title: "Erro ao conceder", description: (error as Error).message, variant: "destructive" });
    } finally {
      setGranting(false);
    }
  };

  const filtered = badges.filter((b) => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory !== "all" && b.category !== filterCategory) return false;
    if (filterRarity !== "all" && b.rarity !== filterRarity) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    return true;
  });

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
              <Crown className="h-6 w-6 text-amber-500" />
              Selos Kingdom
            </h1>
            <p className="text-sm text-muted-foreground">
              {badges.length} selo{badges.length !== 1 ? "s" : ""} cadastrado{badges.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportBadges}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => document.getElementById("import-badges-input")?.click()}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <input
              id="import-badges-input"
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importBadges(f); e.target.value = ""; }}
            />
            <Button onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Selo
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar selo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.nome}>{c.icone} {c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRarity} onValueChange={setFilterRarity}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Raridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as raridades</SelectItem>
              {rarities.map((r) => <SelectItem key={r.id} value={r.slug}>{r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="hidden">Oculto</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Raridade</TableHead>
                  <TableHead>Obtenção</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((badge) => (
                  <TableRow key={badge.id} className={badge.status !== "active" ? "opacity-60" : ""}>
                    <TableCell>
                      <KingdomBadge rarity={badge.rarity} imageUrl={badge.image_url} emoji={!badge.image_url ? badge.icon : undefined} size="sm" />
                    </TableCell>
                    <TableCell className="font-medium">{badge.name}</TableCell>
                    <TableCell>{badge.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rarities.find((r) => r.slug === badge.rarity)?.nome || badge.rarity}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {UNLOCK_TYPES.find((t) => t.value === badge.unlock_criteria?.type)?.label || "Manual"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.status === "active" ? "default" : "secondary"}>
                        {badge.status === "active" ? "Ativo" : badge.status === "hidden" ? "Oculto" : "Arquivado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{badge.users_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(badge.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => moveBadge(badge, "up")} title="Mover pra cima">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => moveBadge(badge, "down")} title="Mover pra baixo">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(badge)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setGrantBadge(badge)} title="Conceder manualmente">
                          <Gift className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicateBadge(badge)} title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </Button>
                        {badge.status === "active" ? (
                          <Button size="icon" variant="ghost" onClick={() => setStatus(badge, "hidden")} title="Ocultar">
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => setStatus(badge, "active")} title="Ativar">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setStatus(badge, "archived")} title="Arquivar">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">Nenhum selo encontrado.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal criar/editar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Selo" : "Novo Selo"}</DialogTitle>
            <DialogDescription>Preencha os dados do selo Kingdom.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Imagem do selo</label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 flex items-center justify-center rounded-full border border-dashed overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <Input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">PNG, SVG ou WEBP. Depois de escolher, você recorta a parte redonda antes de salvar. Sem imagem, usa o emoji abaixo.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome do selo</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Semeador da Palavra" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Emoji (se não enviar imagem)</label>
                <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🏅" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="O que esse selo representa" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Versículo relacionado</label>
                <Input value={form.verse_reference} onChange={(e) => setForm((f) => ({ ...f, verse_reference: e.target.value }))} placeholder="Ex: Mateus 28:19" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Texto do versículo (opcional)</label>
                <Input value={form.verse_text} onChange={(e) => setForm((f) => ({ ...f, verse_text: e.target.value }))} placeholder="Texto completo do versículo" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">História do selo (opcional)</label>
              <Textarea value={form.unlock_story} onChange={(e) => setForm((f) => ({ ...f, unlock_story: e.target.value }))} rows={2} placeholder="Um texto inspirador mostrado ao desbloquear" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.nome}>{c.icone} {c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!showNewCategory ? (
                  <button type="button" onClick={() => setShowNewCategory(true)} className="text-xs text-primary mt-1">
                    + Nova categoria
                  </button>
                ) : (
                  <div className="flex gap-1 mt-1">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nome da categoria" className="h-8 text-sm" />
                    <Button size="sm" className="h-8" onClick={createCategory}>Criar</Button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Raridade</label>
                <Select value={form.rarity} onValueChange={(v) => setForm((f) => ({ ...f, rarity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rarities.map((r) => <SelectItem key={r.id} value={r.slug}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Forma de obtenção</label>
                <Select value={form.unlock_type} onValueChange={(v) => setForm((f) => ({ ...f, unlock_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNLOCK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">XP concedido</label>
                <Input type="number" value={form.xp_reward} onChange={(e) => setForm((f) => ({ ...f, xp_reward: e.target.value }))} />
              </div>
            </div>

            {form.unlock_type !== "manual" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ação/critério (texto livre)</label>
                  <Input value={form.unlock_action} onChange={(e) => setForm((f) => ({ ...f, unlock_action: e.target.value }))} placeholder="Ex: daily_devotional" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor necessário</label>
                  <Input type="number" value={form.unlock_value} onChange={(e) => setForm((f) => ({ ...f, unlock_value: e.target.value }))} placeholder="Ex: 100" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Desbloqueio automático</p>
                <p className="text-xs text-muted-foreground">Se desligado, só um admin pode conceder este selo</p>
              </div>
              <Switch checked={form.automatico} onCheckedChange={(v) => setForm((f) => ({ ...f, automatico: v }))} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={form.status} onValueChange={(v: BadgeRow["status"]) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo (visível pra todos)</SelectItem>
                  <SelectItem value="hidden">Oculto (não aparece na coleção)</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? "Salvar alterações" : "Criar selo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal conceder manualmente */}
      <Dialog open={!!grantBadge} onOpenChange={(open) => !open && setGrantBadge(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              Conceder: {grantBadge?.name}
            </DialogTitle>
            <DialogDescription>Entregue este selo diretamente para um usuário.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar usuário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou e-mail..."
                  className="pl-9"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                />
              </div>
              {userResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-56 overflow-y-auto">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUserResults([]); setUserSearch(u.full_name); }}
                      className="w-full p-3 hover:bg-accent text-left flex flex-col transition-colors"
                    >
                      <span className="font-medium text-sm">{u.full_name}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{selectedUser.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Observação (opcional)</label>
              <Input value={grantObservacao} onChange={(e) => setGrantObservacao(e.target.value)} placeholder="Ex: prêmio da campanha de Natal" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantBadge(null)}>Cancelar</Button>
            <Button onClick={handleGrant} disabled={!selectedUser || granting}>
              {granting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
              Conceder selo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cropSrc && (
        <ImageCropModal
          open={showCrop}
          onOpenChange={setShowCrop}
          imageSrc={cropSrc}
          aspectRatio={1}
          round
          title="Recortar imagem do selo"
          onCropComplete={handleCropComplete}
        />
      )}
    </AdminLayout>
  );
}
