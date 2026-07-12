import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Home, Loader2, Save, Camera, X } from "lucide-react";
import { ImageCropModal } from "@/components/ImageCropModal";
import LocationPicker, { type LocationData } from "./LocationPicker";
import MemberPicker, { type CommunityMemberOption } from "./MemberPicker";

const sb = supabase as any;

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export interface EditableCell {
  id: string;
  name: string;
  leader_user_id: string | null;
  leader_name: string | null;
  vice_leader_user_id: string | null;
  vice_leader_name: string | null;
  supervisor_name: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  theme: string | null;
  verse: string | null;
  weekly_objective: string | null;
  photos: string[] | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  maps_link?: string | null;
}

interface CellFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  cell?: EditableCell | null;
  onSaved: () => void;
}

const emptyLocation: LocationData = {
  country: "Brasil", state: "", city: "", zipCode: "", street: "", number: "",
  complement: "", neighborhood: "", address: "", mapsLink: "", latitude: undefined, longitude: undefined,
};

const CellFormModal = ({ open, onOpenChange, communityId, userId, cell, onSaved }: CellFormModalProps) => {
  const { toast } = useToast();
  const isEditing = !!cell;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<LocationData>(emptyLocation);
  const [form, setForm] = useState({
    name: "",
    leader_user_id: "",
    leader_name: "",
    vice_leader_user_id: "",
    vice_leader_name: "",
    supervisor_name: "",
    meeting_day: "",
    meeting_time: "",
    theme: "",
    verse: "",
    weekly_objective: "",
    photos: [] as string[],
  });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (cell) {
      setForm({
        name: cell.name || "",
        leader_user_id: cell.leader_user_id || "",
        leader_name: cell.leader_name || "",
        vice_leader_user_id: cell.vice_leader_user_id || "",
        vice_leader_name: cell.vice_leader_name || "",
        supervisor_name: cell.supervisor_name || "",
        meeting_day: cell.meeting_day || "",
        meeting_time: cell.meeting_time || "",
        theme: cell.theme || "",
        verse: cell.verse || "",
        weekly_objective: cell.weekly_objective || "",
        photos: cell.photos || [],
      });
      setLocation({
        country: cell.country || "Brasil",
        state: cell.state || "",
        city: cell.city || "",
        zipCode: cell.zip_code || "",
        street: cell.street || "",
        number: cell.number || "",
        complement: cell.complement || "",
        neighborhood: cell.neighborhood || "",
        address: "",
        mapsLink: cell.maps_link || "",
      });
    } else {
      setForm({
        name: "", leader_user_id: "", leader_name: "", vice_leader_user_id: "", vice_leader_name: "",
        supervisor_name: "", meeting_day: "", meeting_time: "", theme: "", verse: "", weekly_objective: "", photos: [],
      });
      setLocation(emptyLocation);
    }
  }, [open, cell]);

  const pickLeader = (field: "leader" | "vice_leader", member: CommunityMemberOption | null) => {
    if (!member) {
      setForm(prev => ({ ...prev, [`${field}_user_id`]: "", [`${field}_name`]: "" }));
      return;
    }
    setForm(prev => ({ ...prev, [`${field}_user_id`]: member.user_id, [`${field}_name`]: member.full_name }));
  };

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
      const filePath = `community-cells/cell-${communityId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("community-photos")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("community-photos").getPublicUrl(filePath);
      setForm(prev => ({ ...prev, photos: [...prev.photos, urlData.publicUrl] }));
    } catch (error: any) {
      toast({ title: "Erro ao enviar foto", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => setForm(prev => ({ ...prev, photos: prev.photos.filter(p => p !== url) }));

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Campo obrigatório", description: "Dê um nome para a célula.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      leader_user_id: form.leader_user_id || null,
      leader_name: form.leader_name.trim() || null,
      vice_leader_user_id: form.vice_leader_user_id || null,
      vice_leader_name: form.vice_leader_name.trim() || null,
      supervisor_name: form.supervisor_name.trim() || null,
      meeting_day: form.meeting_day || null,
      meeting_time: form.meeting_time || null,
      theme: form.theme.trim() || null,
      verse: form.verse.trim() || null,
      weekly_objective: form.weekly_objective.trim() || null,
      photos: form.photos,
      country: location.country || null,
      state: location.state.trim() || null,
      city: location.city.trim() || null,
      zip_code: location.zipCode.trim() || null,
      street: location.street.trim() || null,
      number: location.number.trim() || null,
      complement: location.complement.trim() || null,
      neighborhood: location.neighborhood.trim() || null,
      maps_link: location.mapsLink.trim() || null,
    };

    try {
      if (isEditing && cell) {
        const { error } = await sb.from("community_cells").update(payload).eq("id", cell.id);
        if (error) throw error;
        toast({ title: "✅ Célula atualizada!" });
      } else {
        const { error } = await sb.from("community_cells").insert({
          community_id: communityId,
          created_by: userId,
          ...payload,
        });
        if (error) throw error;
        toast({ title: "✅ Célula criada!" });
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
              <Home className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>{isEditing ? "Editar Célula" : "Nova Célula"}</DialogTitle>
          </div>
          <DialogDescription>
            Cadastre os dados da célula — líder, encontro, endereço e foco da semana.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
          <div className="space-y-1.5">
            <Label>Nome da Célula *</Label>
            <Input placeholder="Ex: Célula Vida Nova" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} disabled={saving} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Líder</Label>
              <MemberPicker
                communityId={communityId}
                value={form.leader_user_id ? { user_id: form.leader_user_id, full_name: form.leader_name, avatar_url: null, city: null } : null}
                onSelect={(m) => pickLeader("leader", m)}
                disabled={saving}
              />
              <Input
                className="mt-1"
                placeholder="Nome (se não for membro)"
                value={form.leader_name}
                onChange={(e) => setForm(prev => ({ ...prev, leader_name: e.target.value }))}
                disabled={saving || !!form.leader_user_id}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vice-líder</Label>
              <MemberPicker
                communityId={communityId}
                value={form.vice_leader_user_id ? { user_id: form.vice_leader_user_id, full_name: form.vice_leader_name, avatar_url: null, city: null } : null}
                onSelect={(m) => pickLeader("vice_leader", m)}
                disabled={saving}
              />
              <Input
                className="mt-1"
                placeholder="Nome (se não for membro)"
                value={form.vice_leader_name}
                onChange={(e) => setForm(prev => ({ ...prev, vice_leader_name: e.target.value }))}
                disabled={saving || !!form.vice_leader_user_id}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Supervisor(a)</Label>
            <Input placeholder="Nome do supervisor" value={form.supervisor_name} onChange={(e) => setForm(prev => ({ ...prev, supervisor_name: e.target.value }))} disabled={saving} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dia do encontro</Label>
              <Select value={form.meeting_day || "none"} onValueChange={(v) => setForm(prev => ({ ...prev, meeting_day: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {WEEKDAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" value={form.meeting_time} onChange={(e) => setForm(prev => ({ ...prev, meeting_time: e.target.value }))} disabled={saving} />
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-medium mb-3 flex items-center gap-2">📍 Endereço do encontro</h4>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div className="border-t pt-3 space-y-3">
            <h4 className="font-medium flex items-center gap-2">🎯 Foco da semana</h4>
            <div className="space-y-1.5">
              <Label>Tema atual</Label>
              <Input placeholder="Ex: O poder da oração" value={form.theme} onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Versículo</Label>
              <Textarea rows={2} placeholder='Ex: "Orai sem cessar." — 1 Tessalonicenses 5:17' value={form.verse} onChange={(e) => setForm(prev => ({ ...prev, verse: e.target.value }))} disabled={saving} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Objetivo semanal</Label>
              <Textarea rows={2} placeholder="Ex: Convidar 1 visitante" value={form.weekly_objective} onChange={(e) => setForm(prev => ({ ...prev, weekly_objective: e.target.value }))} disabled={saving} className="resize-none" />
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h4 className="font-medium flex items-center gap-2">📷 Fotos</h4>
            <div className="flex flex-wrap gap-2">
              {form.photos.map(url => (
                <div key={url} className="relative">
                  <img src={url} alt="Foto da célula" className="h-16 w-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Button type="button" variant="outline" className="h-16 w-16 border-dashed" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
            </div>
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
            aspectRatio={4 / 3}
            title="Recortar Foto da Célula"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CellFormModal;
