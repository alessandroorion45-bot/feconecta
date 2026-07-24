import { useCallback, useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UploadCloud, Loader2, Trash2, Eye, EyeOff, ImageIcon } from "lucide-react";

interface VerseBackground {
  id: string;
  name: string | null;
  image_url: string;
  storage_path: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const sb = supabase as any;
const BUCKET = "verse-backgrounds";

export default function VerseBackgrounds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<VerseBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("verse_backgrounds").select("*").order("sort_order").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    let ok = 0;
    try {
      for (const file of list) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) {
          console.error(upErr);
          continue;
        }
        const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const { error: insErr } = await sb.from("verse_backgrounds").insert({
          name: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
          image_url: url,
          storage_path: path,
          created_by: user?.id ?? null,
          sort_order: items.length + ok,
        });
        if (!insErr) ok++;
      }
      toast({ title: ok > 0 ? `✅ ${ok} fundo(s) enviado(s)` : "Nada enviado", description: ok > 0 ? "Já aparecem no compartilhamento." : "Verifique o formato das imagens." });
      load();
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (item: VerseBackground) => {
    await sb.from("verse_backgrounds").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  };

  const remove = async (item: VerseBackground) => {
    if (!confirm("Remover este fundo? Essa ação não pode ser desfeita.")) return;
    await supabase.storage.from(BUCKET).remove([item.storage_path]);
    await sb.from("verse_backgrounds").delete().eq("id", item.id);
    toast({ title: "Fundo removido" });
    load();
  };

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Fundos de Versículo"
        description="Imagens 9:16 usadas no compartilhamento de versículos. O que você sobe aqui aparece na hora, sem deploy."
      />

      {/* Área de upload (drag & drop) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 mb-6 cursor-pointer transition-all ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        <div className="text-center">
          <p className="font-semibold">{uploading ? "Enviando..." : "Arraste imagens aqui ou clique para enviar"}</p>
          <p className="text-xs text-muted-foreground mt-1">Formato 9:16 (ex.: 1080×1920) · JPG, PNG ou WEBP · até 8 MB · pode enviar várias</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {items.length} fundo(s) · <span className="text-emerald-600 font-medium">{activeCount} ativo(s)</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
            <p>Nenhum fundo ainda. Suba suas imagens 9:16 acima.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative rounded-xl overflow-hidden border shadow-sm transition-all ${item.is_active ? "border-emerald-400/50" : "border-border opacity-60"}`}
              style={{ aspectRatio: "9 / 16" }}
            >
              <img src={item.image_url} alt={item.name || ""} className="h-full w-full object-cover" loading="lazy" />
              {/* overlay de ações */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => toggleActive(item)}
                    title={item.is_active ? "Desativar" : "Ativar"}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-white shadow"
                  >
                    {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => remove(item)}
                    title="Remover"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-600 shadow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.name && <p className="text-[11px] text-white truncate">{item.name}</p>}
              </div>
              {/* selo de status */}
              {!item.is_active && (
                <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">inativo</span>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
