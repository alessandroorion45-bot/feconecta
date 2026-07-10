import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Loader2, Save, Camera, X } from "lucide-react";
import { ImageCropModal } from "@/components/ImageCropModal";
import { EVENT_TYPES } from "@/lib/eventTypes";

const sb = supabase as any;

export interface EditableEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_at: string;
  end_at: string | null;
  location: string | null;
  maps_link: string | null;
  cover_image_url: string | null;
}

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  event?: EditableEvent | null;
  onSaved: () => void;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EventFormModal = ({ open, onOpenChange, communityId, userId, event, onSaved }: EventFormModalProps) => {
  const { toast } = useToast();
  const isEditing = !!event;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "culto", startAt: "", endAt: "", location: "", mapsLink: "",
  });
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setForm({
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        startAt: toLocalInput(event.start_at),
        endAt: toLocalInput(event.end_at),
        location: event.location || "",
        mapsLink: event.maps_link || "",
      });
      setCoverUrl(event.cover_image_url);
    } else {
      setForm({ title: "", description: "", event_type: "culto", startAt: "", endAt: "", location: "", mapsLink: "" });
      setCoverUrl(null);
    }
  }, [open, event]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropModalOpen(false);
    setSelectedImage(null);
    setUploading(true);
    try {
      const filePath = `community-events/event-${communityId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("community-photos").upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("community-photos").getPublicUrl(filePath);
      setCoverUrl(urlData.publicUrl);
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.startAt) {
      toast({ title: "Campos obrigatórios", description: "Título e data/hora de início.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_type: form.event_type,
      start_at: new Date(form.startAt).toISOString(),
      end_at: form.endAt ? new Date(form.endAt).toISOString() : null,
      location: form.location.trim() || null,
      maps_link: form.mapsLink.trim() || null,
      cover_image_url: coverUrl,
    };

    try {
      if (isEditing && event) {
        const { error } = await sb.from("community_events").update(payload).eq("id", event.id);
        if (error) throw error;
        toast({ title: "✅ Evento atualizado!" });
      } else {
        const { error } = await sb.from("community_events").insert({ community_id: communityId, created_by: userId, ...payload });
        if (error) throw error;
        toast({ title: "✅ Evento criado!" });
      }
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <CalendarPlus className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </div>
          <DialogDescription>Cultos, células, campanhas, batismos e mais — com RSVP dos membros.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-3">
          <div className="space-y-1.5">
            <Label>Capa (opcional)</Label>
            <div className="flex items-center gap-3">
              {coverUrl && (
                <div className="relative">
                  <img src={coverUrl} alt="Capa" className="h-16 w-28 object-cover rounded-lg" />
                  <button type="button" onClick={() => setCoverUrl(null)} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {coverUrl ? "Trocar" : "Adicionar"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder="Ex: Culto de Celebração" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} disabled={saving} />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.event_type} onValueChange={(v) => setForm(prev => ({ ...prev, event_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início *</Label>
              <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm(prev => ({ ...prev, startAt: e.target.value }))} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim (opcional)</Label>
              <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm(prev => ({ ...prev, endAt: e.target.value }))} disabled={saving} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Local</Label>
            <Input placeholder="Ex: Templo Sede, Salão 2" value={form.location} onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label>Link do Google Maps (opcional)</Label>
            <Input placeholder="https://maps.app.goo.gl/..." value={form.mapsLink} onChange={(e) => setForm(prev => ({ ...prev, mapsLink: e.target.value }))} disabled={saving} />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} disabled={saving} className="resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>

        {selectedImage && (
          <ImageCropModal
            open={cropModalOpen}
            onOpenChange={setCropModalOpen}
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
            aspectRatio={16 / 9}
            title="Recortar Capa do Evento"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventFormModal;
