import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Library, Loader2, Plus, Trash2, ExternalLink, Upload, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LIBRARY_RESOURCE_TYPES, getLibraryTypeInfo } from "@/lib/libraryTypes";

const sb = supabase as any;

interface LibraryItem {
  id: string;
  added_by: string;
  resource_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  external_link: string | null;
  created_at: string;
}

interface CellLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellId: string;
  communityId: string;
  userId: string;
  canCurate: boolean;
}

const CellLibraryModal = ({ open, onOpenChange, cellId, communityId, userId, canCurate }: CellLibraryModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ resource_type: "pdf", title: "", description: "", external_link: "" });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await sb.from("community_cell_library_items").select("*").eq("cell_id", cellId).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cellId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const filePath = `community-cell-library/${cellId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("community-photos").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("community-photos").getPublicUrl(filePath);
      setFileUrl(urlData.publicUrl);
      if (!form.title.trim()) setForm(prev => ({ ...prev, title: file.name }));
    } catch (error: any) {
      toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setForm({ resource_type: "pdf", title: "", description: "", external_link: "" });
    setFileUrl(null);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Dê um título ao material", variant: "destructive" });
      return;
    }
    if (!fileUrl && !form.external_link.trim()) {
      toast({ title: "Envie um arquivo ou cole um link", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await sb.from("community_cell_library_items").insert({
        cell_id: cellId,
        community_id: communityId,
        added_by: userId,
        resource_type: form.resource_type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        file_url: fileUrl,
        external_link: form.external_link.trim() || null,
      });
      if (error) throw error;
      toast({ title: "✅ Material adicionado à biblioteca!" });
      resetForm();
      setShowForm(false);
      load();
    } catch (error: any) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: LibraryItem) => {
    if (!confirm(`Remover "${item.title}" da biblioteca?`)) return;
    const { error } = await sb.from("community_cell_library_items").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const filtered = useMemo(() => (filter === "all" ? items : items.filter(i => i.resource_type === filter)), [items, filter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Library className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>Biblioteca da Célula</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📁 Todos</SelectItem>
              {LIBRARY_RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {canCurate && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          )}
        </div>

        {showForm && (
          <div className="rounded-lg border border-dashed p-3 space-y-2">
            <Select value={form.resource_type} onValueChange={(v) => setForm(prev => ({ ...prev, resource_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIBRARY_RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
            <Textarea placeholder="Descrição (opcional)" rows={2} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className="resize-none" />
            <Input placeholder="Link externo (YouTube, Google Drive, etc.)" value={form.external_link} onChange={(e) => setForm(prev => ({ ...prev, external_link: e.target.value }))} />
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {fileUrl ? "Arquivo enviado ✓" : "Ou enviar arquivo"}
              </Button>
              {fileUrl && (
                <button type="button" onClick={() => setFileUrl(null)}><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum material aqui ainda.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => {
              const info = getLibraryTypeInfo(item.resource_type);
              const url = item.file_url || item.external_link || "#";
              return (
                <a
                  key={item.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xl shrink-0">{info.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {(canCurate || item.added_by === userId) && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(item); }}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CellLibraryModal;
