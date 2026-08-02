import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Handshake, Plus, Pencil, Eye, EyeOff, Archive, Loader2, Sparkles, ExternalLink, MousePointerClick,
  Trash2, Copy, Search, ArchiveRestore, ImagePlus, Film, X, GripVertical,
} from "lucide-react";
import { MediaCarousel, ytId, type MediaItem } from "@/components/affiliate/MediaCarousel";

interface AffiliateRow {
  id: string;
  nome: string;
  affiliate_url: string;
  recommend_reason: string | null;
  image_url: string | null;
  categoria: string;
  headline: string | null;
  descricao: string | null;
  cta_text: string;
  badge_label: string;
  status: "active" | "hidden" | "archived";
  ordem: number;
  click_count: number;
  media: MediaItem[] | null;
  aspect: string | null;
  created_at: string;
}

const CATEGORIAS = ["Livros", "Devocionais", "Cursos", "Acessórios", "Presentes", "Recomendados"];

const emptyForm = {
  nome: "",
  affiliate_url: "",
  recommend_reason: "",
  categoria: "Livros",
  headline: "",
  descricao: "",
  cta_text: "Ver oferta",
  badge_label: "Link de parceiro",
  status: "hidden" as AffiliateRow["status"],
  media: [] as MediaItem[],
  aspect: "9:16" as "9:16" | "16:9",
};

export default function AffiliateProducts() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden" | "archived">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("affiliate_products")
      .select("*")
      .order("status")
      .order("ordem");
    setRows((data as AffiliateRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setVideoUrl("");
    setShowForm(true);
  };

  const openEdit = (r: AffiliateRow) => {
    setEditingId(r.id);
    // compat: se não tem media[] mas tem image_url antiga, converte
    const media: MediaItem[] = r.media?.length
      ? r.media
      : r.image_url
      ? [{ type: "image", url: r.image_url }]
      : [];
    setForm({
      nome: r.nome,
      affiliate_url: r.affiliate_url,
      recommend_reason: r.recommend_reason || "",
      categoria: r.categoria,
      headline: r.headline || "",
      descricao: r.descricao || "",
      cta_text: r.cta_text || "Ver oferta",
      badge_label: r.badge_label || "Link de parceiro",
      status: r.status,
      media,
      aspect: (r.aspect === "16:9" ? "16:9" : "9:16"),
    });
    setVideoUrl("");
    setShowForm(true);
  };

  // Sobe imagem(ns) pro storage e adiciona ao carrossel
  const addImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImg(true);
    try {
      const novos: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `affiliate/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from("kingdom-badges").upload(path, file, { upsert: true });
        if (error) throw error;
        const url = supabase.storage.from("kingdom-badges").getPublicUrl(path).data.publicUrl;
        novos.push({ type: "image", url });
      }
      setForm((f) => ({ ...f, media: [...f.media, ...novos] }));
    } catch (e) {
      toast({ title: "Erro ao enviar imagem", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploadingImg(false);
    }
  };

  const addImageUrl = (url: string) => {
    const u = url.trim();
    if (!u) return;
    setForm((f) => ({ ...f, media: [...f.media, { type: "image", url: u }] }));
  };

  const addVideo = () => {
    const u = videoUrl.trim();
    if (!u) return;
    setForm((f) => ({ ...f, media: [...f.media, { type: "video", url: u }] }));
    setVideoUrl("");
  };

  const removeMedia = (idx: number) =>
    setForm((f) => ({ ...f, media: f.media.filter((_, i) => i !== idx) }));

  const moveMedia = (idx: number, dir: -1 | 1) =>
    setForm((f) => {
      const arr = [...f.media];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...f, media: arr };
    });

  const generateCopy = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Preencha o nome do produto primeiro", variant: "destructive" });
      return;
    }
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-affiliate-copy", {
      body: { nome: form.nome, reason: form.recommend_reason, categoria: form.categoria },
    });
    setGenerating(false);
    if (error || !data || (data as any).error) {
      let msg = (data as any)?.error || error?.message || "Tente novamente.";
      // supabase.functions.invoke esconde o erro real no context
      try {
        const ctx = await (error as any)?.context?.json?.();
        if (ctx?.error) msg = ctx.error;
      } catch { /* ignore */ }
      toast({ title: "Não foi possível gerar agora", description: msg, variant: "destructive" });
      return;
    }
    setForm((f) => ({
      ...f,
      headline: (data as any).headline || f.headline,
      descricao: (data as any).descricao || f.descricao,
      cta_text: (data as any).cta || f.cta_text,
    }));
    toast({
      title: "✨ Apresentação montada",
      description: "Montei a partir do que você escreveu. Revise e ajuste antes de publicar.",
    });
  };

  const handleSave = async () => {
    if (!form.affiliate_url.trim() || !form.nome.trim()) {
      toast({ title: "Link de afiliado e nome são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // image_url = 1ª imagem do carrossel (compat com a vitrine/teaser e o thumbnail)
      const firstImg = form.media.find((m) => m.type === "image")?.url || null;

      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        nome: form.nome.trim(),
        affiliate_url: form.affiliate_url.trim(),
        recommend_reason: form.recommend_reason || null,
        image_url: firstImg,
        media: form.media,
        aspect: form.aspect,
        categoria: form.categoria,
        headline: form.headline || null,
        descricao: form.descricao || null,
        cta_text: form.cta_text || "Ver oferta",
        badge_label: form.badge_label || "Link de parceiro",
        status: form.status,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from("affiliate_products").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Produto atualizado" });
      } else {
        const { error } = await supabase
          .from("affiliate_products")
          .insert({ ...payload, created_by: userData.user?.id });
        if (error) throw error;
        toast({ title: "Produto criado", description: "Está oculto — publique quando revisar." });
      }
      setShowForm(false);
      load();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (r: AffiliateRow, status: AffiliateRow["status"]) => {
    const { error } = await supabase.from("affiliate_products").update({ status }).eq("id", r.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const duplicate = async (r: AffiliateRow) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("affiliate_products").insert({
      nome: `${r.nome} (cópia)`,
      affiliate_url: r.affiliate_url,
      recommend_reason: r.recommend_reason,
      image_url: r.image_url,
      media: r.media ?? [],
      aspect: r.aspect ?? "9:16",
      categoria: r.categoria,
      headline: r.headline,
      descricao: r.descricao,
      cta_text: r.cta_text,
      badge_label: r.badge_label,
      status: "hidden",
      created_by: userData.user?.id,
    });
    if (error) { toast({ title: "Erro ao duplicar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Achado duplicado", description: "Criado como oculto — edite e publique." });
    load();
  };

  const remove = async (r: AffiliateRow) => {
    if (!window.confirm(`Excluir DEFINITIVAMENTE "${r.headline || r.nome}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("affiliate_products").delete().eq("id", r.id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "🗑️ Achado excluído" });
    load();
  };

  const filtered = rows.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (!search || (r.nome + " " + (r.headline || "")).toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Achados da Aliança"
        description="Cole um link de afiliado — o app gera uma apresentação magnética. Só administradores cadastram. Todo produto mostra que é link de parceiro."
      />

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card><CardContent className="py-3 text-center">
          <div className="text-2xl font-bold">{rows.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{rows.filter((r) => r.status === "active").length}</div>
          <div className="text-xs text-muted-foreground">Publicados</div>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{rows.reduce((s, r) => s + r.click_count, 0)}</div>
          <div className="text-xs text-muted-foreground">Cliques totais</div>
        </CardContent></Card>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar achado..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">Todos os status</option>
          <option value="active">Publicados</option>
          <option value="hidden">Ocultos</option>
          <option value="archived">Arquivados</option>
        </select>
        <Button onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Novo Achado
        </Button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Handshake className="h-12 w-12 mx-auto mb-3 opacity-40" />
          {rows.length === 0 ? 'Nenhum achado ainda. Clique em "Novo Achado".' : "Nenhum achado com esse filtro."}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className={r.status !== "active" ? "opacity-70" : ""}>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : "🎁"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.headline || r.nome}</span>
                    <Badge variant="secondary" className="text-[10px]">{r.categoria}</Badge>
                    <Badge variant={r.status === "active" ? "default" : "outline"} className="text-[10px]">
                      {r.status === "active" ? "Publicado" : r.status === "hidden" ? "Oculto" : "Arquivado"}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MousePointerClick className="h-3.5 w-3.5" /> {r.click_count} cliques
                    </span>
                  </div>
                  <a href={r.affiliate_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary inline-flex items-center gap-1 mt-0.5 truncate max-w-full">
                    <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{r.affiliate_url}</span>
                  </a>
                  {r.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.descricao}</p>}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  {r.status === "active" ? (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r, "hidden")} title="Ocultar"><EyeOff className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r, "active")} title="Publicar"><Eye className="h-4 w-4 text-emerald-600" /></Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => duplicate(r)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                  {r.status === "archived" ? (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r, "hidden")} title="Restaurar"><ArchiveRestore className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r, "archived")} title="Arquivar"><Archive className="h-4 w-4" /></Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => remove(r)} title="Excluir de vez"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Achado" : "Novo Achado"}</DialogTitle>
            <DialogDescription>Preencha o essencial e deixe o sistema montar a apresentação. Você revisa antes de publicar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Link de afiliado *</label>
              <Input value={form.affiliate_url} onChange={(e) => setForm((f) => ({ ...f, affiliate_url: e.target.value }))}
                placeholder="https://... (com seu código de afiliado intacto)" />
              <p className="text-xs text-muted-foreground mt-1">Cole o link original do programa (não use encurtador que remova o rastreio).</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome do produto *</label>
                <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Bíblia de Estudo" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Categoria</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Por que você recomenda? (opcional, ajuda a IA)</label>
              <Input value={form.recommend_reason} onChange={(e) => setForm((f) => ({ ...f, recommend_reason: e.target.value }))}
                placeholder="Ex: uma Bíblia linda com notas que aprofundam a leitura" />
            </div>

            {/* Mídias (carrossel de imagens + vídeo) */}
            <div className="rounded-lg border border-border/70 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-sm font-medium">Mídias (imagens e vídeo)</label>
                {/* Formato do card */}
                <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, aspect: "9:16" }))}
                    className={`px-3 py-1.5 ${form.aspect === "9:16" ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                    9:16 vertical
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, aspect: "16:9" }))}
                    className={`px-3 py-1.5 ${form.aspect === "16:9" ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                    16:9 horizontal
                  </button>
                </div>
              </div>

              {/* Prévia real do carrossel (do jeito que o usuário vai ver) */}
              {form.media.length > 0 && (
                <div className="mx-auto max-w-[220px] rounded-xl overflow-hidden border">
                  <MediaCarousel media={form.media} aspect={form.aspect} />
                </div>
              )}

              {/* Lista de mídias com reordenar/remover */}
              {form.media.length > 0 && (
                <div className="space-y-1.5">
                  {form.media.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {m.type === "image" ? <ImagePlus className="h-4 w-4 text-sky-500 shrink-0" /> : <Film className="h-4 w-4 text-fuchsia-500 shrink-0" />}
                      <span className="truncate flex-1">{m.type === "video" && ytId(m.url) ? "YouTube · " : ""}{m.url}</span>
                      <button type="button" onClick={() => moveMedia(idx, -1)} disabled={idx === 0} className="px-1 disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveMedia(idx, 1)} disabled={idx === form.media.length - 1} className="px-1 disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => removeMedia(idx)} className="text-red-500 px-1"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar */}
              <div className="grid sm:grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed h-10 text-sm cursor-pointer hover:bg-muted/40">
                  {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Adicionar imagem
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                </label>
                <div className="flex gap-1">
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Link do vídeo (YouTube ou .mp4)" className="text-xs h-10" />
                  <Button type="button" variant="outline" className="h-10 shrink-0" onClick={addVideo}><Film className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                A imagem/vídeo aparece <strong>inteira</strong> no card (sem corte), com fundo desfocado. Arraste com ↑↓ pra ordenar — a 1ª é a capa.
              </p>
            </div>

            {/* Geração da apresentação */}
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Apresentação magnética
                </span>
                <Button size="sm" variant="outline" onClick={generateCopy} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                  Gerar apresentação
                </Button>
              </div>
              <div className="space-y-2">
                <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="Headline (chamativa, focada no benefício)" />
                <Textarea rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descrição persuasiva (2-4 frases)" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} placeholder="Texto do botão (ex: Ver oferta)" />
                  <Input value={form.badge_label} onChange={(e) => setForm((f) => ({ ...f, badge_label: e.target.value }))} placeholder="Selo de transparência" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AffiliateRow["status"] }))}>
                <option value="hidden">Oculto (rascunho)</option>
                <option value="active">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
