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
  Handshake, Plus, Pencil, Eye, EyeOff, Archive, Loader2, Sparkles, ExternalLink, Upload, MousePointerClick,
} from "lucide-react";

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
  created_at: string;
}

const CATEGORIAS = ["Livros", "Devocionais", "Cursos", "Acessórios", "Presentes", "Recomendados"];

const emptyForm = {
  nome: "",
  affiliate_url: "",
  recommend_reason: "",
  image_url: "" as string | null,
  categoria: "Livros",
  headline: "",
  descricao: "",
  cta_text: "Ver oferta",
  badge_label: "Link de parceiro",
  status: "hidden" as AffiliateRow["status"],
};

export default function AffiliateProducts() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (r: AffiliateRow) => {
    setEditingId(r.id);
    setForm({
      nome: r.nome,
      affiliate_url: r.affiliate_url,
      recommend_reason: r.recommend_reason || "",
      image_url: r.image_url,
      categoria: r.categoria,
      headline: r.headline || "",
      descricao: r.descricao || "",
      cta_text: r.cta_text || "Ver oferta",
      badge_label: r.badge_label || "Link de parceiro",
      status: r.status,
    });
    setImageFile(null);
    setImagePreview(r.image_url);
    setShowForm(true);
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

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
    toast({ title: "✨ Apresentação gerada", description: "Revise e ajuste antes de publicar." });
  };

  const handleSave = async () => {
    if (!form.affiliate_url.trim() || !form.nome.trim()) {
      toast({ title: "Link de afiliado e nome são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `affiliate/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("kingdom-badges").upload(path, imageFile, { upsert: true });
        if (upErr) throw upErr;
        image_url = supabase.storage.from("kingdom-badges").getPublicUrl(path).data.publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        nome: form.nome.trim(),
        affiliate_url: form.affiliate_url.trim(),
        recommend_reason: form.recommend_reason || null,
        image_url,
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

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Produtos Recomendados"
        description="Cole um link de afiliado — o app gera uma apresentação magnética. Só administradores cadastram. Todo produto mostra que é link de parceiro."
      />

      <div className="flex justify-end mb-3">
        <Button onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Novo Recomendado
        </Button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Handshake className="h-12 w-12 mx-auto mb-3 opacity-40" />
          Nenhum produto recomendado ainda. Clique em "Novo Recomendado".
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
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
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  {r.status === "active" ? (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r, "hidden")} title="Ocultar"><EyeOff className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r, "active")} title="Publicar"><Eye className="h-4 w-4" /></Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => setStatus(r, "archived")} title="Arquivar"><Archive className="h-4 w-4" /></Button>
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
            <DialogTitle>{editingId ? "Editar Recomendado" : "Novo Recomendado"}</DialogTitle>
            <DialogDescription>Preencha o essencial e deixe a IA montar a apresentação. Você revisa antes de publicar.</DialogDescription>
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

            <div>
              <label className="text-sm font-medium mb-1.5 block">Imagem do produto</label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-dashed flex items-center justify-center overflow-hidden shrink-0 bg-muted/30">
                  {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 space-y-2">
                  <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} />
                  <Input value={form.image_url || ""} onChange={(e) => { setForm((f) => ({ ...f, image_url: e.target.value })); setImagePreview(e.target.value || null); }}
                    placeholder="...ou cole a URL de uma imagem" className="text-xs" />
                </div>
              </div>
            </div>

            {/* Geração da apresentação */}
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Apresentação magnética
                </span>
                <Button size="sm" variant="outline" onClick={generateCopy} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                  Gerar com IA
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
