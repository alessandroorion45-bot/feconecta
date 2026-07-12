import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarPro } from "@/components/AvatarPro";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, Edit2, Check, X, Camera } from "lucide-react";
import { LEADER_ROLES, LEADER_LEVELS, getLeaderRoleInfo } from "@/lib/leaderRoles";
import { MINISTRIES } from "./MinistriesSelector";
import { notifyCommunityMembers } from "@/lib/communityNotifications";
import MemberPicker, { type CommunityMemberOption } from "./MemberPicker";

const sb = supabase as any;

const CUSTOM_ROLE = "__custom__";

interface Leader {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
  ministry: string | null;
  assumed_date: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  favorite_verse: string | null;
  area_of_activity: string | null;
  hierarchy_level: number;
}

interface ManageLeadersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
}

interface LeaderFormData {
  user_id: string | null;
  name: string;
  roleSelect: string;
  customRole: string;
  level: number;
  ministry: string;
  assumed_date: string;
  phone: string;
  whatsapp: string;
  email: string;
  favorite_verse: string;
  area_of_activity: string;
  bio: string;
  photo_url: string | null;
}

const emptyForm: LeaderFormData = {
  user_id: null,
  name: "",
  roleSelect: "",
  customRole: "",
  level: 5,
  ministry: "",
  assumed_date: "",
  phone: "",
  whatsapp: "",
  email: "",
  favorite_verse: "",
  area_of_activity: "",
  bio: "",
  photo_url: "",
};

interface LeaderFormProps {
  communityId: string;
  formData: LeaderFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaderFormData>>;
  saving: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  duplicateWarning: string | null;
}

/**
 * Hoisted pro módulo (fora do componente pai) de propósito — definir um
 * componente dentro do corpo de outro faz o React recriar sua identidade a
 * cada re-render do pai (cada tecla digitada), desmontando/remontando o
 * formulário inteiro e derrubando o foco do input a cada caractere.
 */
const LeaderForm = ({
  communityId, formData, setFormData, saving, uploading, fileInputRef, onFileSelect, onSave, onCancel, duplicateWarning,
}: LeaderFormProps) => {
  const onRoleSelect = (value: string) => {
    if (value === CUSTOM_ROLE) {
      setFormData(prev => ({ ...prev, roleSelect: CUSTOM_ROLE }));
      return;
    }
    const info = LEADER_ROLES.find(r => r.value === value);
    setFormData(prev => ({ ...prev, roleSelect: value, level: info?.level ?? prev.level }));
  };

  const selectedMember: CommunityMemberOption | null = formData.user_id
    ? { user_id: formData.user_id, full_name: formData.name, avatar_url: formData.photo_url, city: null }
    : null;

  const onPickMember = (member: CommunityMemberOption | null) => {
    if (!member) {
      setFormData(prev => ({ ...prev, user_id: null }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      user_id: member.user_id,
      name: member.full_name,
      photo_url: member.avatar_url || prev.photo_url,
    }));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Vincular a um membro da comunidade (opcional)</Label>
        <MemberPicker communityId={communityId} value={selectedMember} onSelect={onPickMember} disabled={saving} />
        {duplicateWarning && (
          <p className="text-xs text-destructive">{duplicateWarning}</p>
        )}
        <p className="text-[11px] text-muted-foreground">Preenche foto e nome automaticamente. Deixe em branco se o líder não tiver conta no app.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group shrink-0">
          <AvatarPro src={formData.photo_url} name={formData.name || "Líder"} size="lg" clickable={false} />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Foto do líder (opcional, recortada em quadrado).</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nome *</Label>
          <Input
            placeholder="Nome do líder"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>Função *</Label>
          <Select value={formData.roleSelect} onValueChange={onRoleSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {LEADER_LEVELS.map(lvl => (
                <SelectGroup key={lvl.level}>
                  <SelectLabel>{lvl.label}</SelectLabel>
                  {LEADER_ROLES.filter(r => r.level === lvl.level).map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex items-center gap-2"><span>{r.emoji}</span>{r.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <SelectGroup>
                <SelectItem value={CUSTOM_ROLE}>✏️ Outra função (personalizada)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {formData.roleSelect === CUSTOM_ROLE && (
            <Input
              className="mt-1.5"
              placeholder="Digite a função"
              value={formData.customRole}
              onChange={(e) => setFormData(prev => ({ ...prev, customRole: e.target.value }))}
              disabled={saving}
            />
          )}
        </div>

        {formData.roleSelect === CUSTOM_ROLE && (
          <div className="space-y-1.5 col-span-2">
            <Label>Nível hierárquico (organograma)</Label>
            <Select value={String(formData.level)} onValueChange={(v) => setFormData(prev => ({ ...prev, level: Number(v) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEADER_LEVELS.map(lvl => (
                  <SelectItem key={lvl.level} value={String(lvl.level)}>{lvl.level}. {lvl.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5 col-span-2">
          <Label>Ministério</Label>
          <Select value={formData.ministry || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, ministry: v === "none" ? "" : v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="none">Nenhum</SelectItem>
              {MINISTRIES.map(m => (
                <SelectItem key={m.id} value={m.name}>
                  <span className="flex items-center gap-2"><span>{m.emoji}</span>{m.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Data que assumiu</Label>
          <Input
            type="date"
            value={formData.assumed_date}
            onChange={(e) => setFormData(prev => ({ ...prev, assumed_date: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Área de atuação</Label>
          <Input
            placeholder="Ex: Zona Sul, Célula Vida Nova"
            value={formData.area_of_activity}
            onChange={(e) => setFormData(prev => ({ ...prev, area_of_activity: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.whatsapp}
            onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="lider@igreja.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>Versículo favorito</Label>
          <Textarea
            placeholder={'Ex: "Tudo posso naquele que me fortalece." — Filipenses 4:13'}
            value={formData.favorite_verse}
            onChange={(e) => setFormData(prev => ({ ...prev, favorite_verse: e.target.value }))}
            disabled={saving}
            rows={2}
          />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>Bio</Label>
          <Textarea
            placeholder="Uma breve descrição..."
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={saving}
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving || !!duplicateWarning} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
};

const ManageLeadersModal = ({ open, onOpenChange, communityId, userId }: ManageLeadersModalProps) => {
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<LeaderFormData>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadLeaders();
    }
  }, [open, communityId]);

  const loadLeaders = async () => {
    try {
      const { data, error } = await sb
        .from("church_leaders")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("hierarchy_level", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error("Error loading leaders:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData(emptyForm);

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
      const filePath = `community-leaders/leader-${communityId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("community-photos")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("community-photos").getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, photo_url: urlData.publicUrl }));
      toast({ title: "📸 Foto pronta!", description: "Ela será salva junto com o líder." });
    } catch (error: any) {
      toast({ title: "Erro ao enviar foto", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = (data: LeaderFormData) => {
    const role = data.roleSelect === CUSTOM_ROLE ? data.customRole.trim() : data.roleSelect;
    return {
      user_id: data.user_id,
      name: data.name.trim(),
      role,
      bio: data.bio.trim() || null,
      photo_url: data.photo_url || null,
      ministry: data.ministry || null,
      assumed_date: data.assumed_date || null,
      phone: data.phone.trim() || null,
      whatsapp: data.whatsapp.trim() || null,
      email: data.email.trim() || null,
      favorite_verse: data.favorite_verse.trim() || null,
      area_of_activity: data.area_of_activity.trim() || null,
      hierarchy_level: data.level,
    };
  };

  // Membro já vinculado a outro líder ativo? (evita duplicidade ao adicionar)
  const duplicateWarning = !editingId && formData.user_id && leaders.some(l => l.user_id === formData.user_id)
    ? "Este membro já faz parte da liderança. Edite o cargo existente em vez de duplicar."
    : null;

  const handleAddLeader = async () => {
    const role = formData.roleSelect === CUSTOM_ROLE ? formData.customRole.trim() : formData.roleSelect;
    if (!formData.name.trim() || !role) {
      toast({ title: "Campos obrigatórios", description: "Preencha o nome e a função do líder.", variant: "destructive" });
      return;
    }
    if (duplicateWarning) {
      toast({ title: "Membro já é líder", description: duplicateWarning, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(formData);
      const { error } = await sb.from("church_leaders").insert({
        community_id: communityId,
        ...payload,
      });

      if (error) throw error;

      notifyCommunityMembers(communityId, userId, "community_new_leader", `⭐ ${payload.name} agora é ${payload.role} da comunidade!`, communityId);

      toast({ title: "Líder adicionado!", description: "Já aparece na aba Líderes e no organograma." });

      resetForm();
      setShowAddForm(false);
      loadLeaders();
    } catch (error: any) {
      toast({ title: "Erro ao adicionar líder", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLeader = async (leader: Leader) => {
    const role = formData.roleSelect === CUSTOM_ROLE ? formData.customRole.trim() : formData.roleSelect;
    if (!formData.name.trim() || !role) {
      toast({ title: "Campos obrigatórios", description: "Preencha o nome e a função do líder.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await sb.from("church_leaders").update(buildPayload(formData)).eq("id", leader.id);

      if (error) throw error;

      toast({ title: "Líder atualizado!" });
      setEditingId(null);
      resetForm();
      loadLeaders();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLeader = async (leaderId: string) => {
    setSaving(true);
    try {
      const { error } = await sb.from("church_leaders").update({ is_active: false }).eq("id", leaderId);

      if (error) throw error;

      toast({ title: "Líder removido" });
      loadLeaders();
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (leader: Leader) => {
    setEditingId(leader.id);
    const isKnown = LEADER_ROLES.some(r => r.value === leader.role);
    setFormData({
      user_id: leader.user_id,
      name: leader.name,
      roleSelect: isKnown ? leader.role : CUSTOM_ROLE,
      customRole: isKnown ? "" : leader.role,
      level: leader.hierarchy_level || getLeaderRoleInfo(leader.role).level,
      ministry: leader.ministry || "",
      assumed_date: leader.assumed_date || "",
      phone: leader.phone || "",
      whatsapp: leader.whatsapp || "",
      email: leader.email || "",
      favorite_verse: leader.favorite_verse || "",
      area_of_activity: leader.area_of_activity || "",
      bio: leader.bio || "",
      photo_url: leader.photo_url,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>Gerenciar Líderes</DialogTitle>
          </div>
          <DialogDescription>
            Cadastre pastores e dirigentes — eles aparecem na aba Líderes, no organograma e podem receber avaliações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {leaders.map(leader => (
                <Card key={leader.id}>
                  <CardContent className="p-4">
                    {editingId === leader.id ? (
                      <LeaderForm
                        communityId={communityId}
                        formData={formData}
                        setFormData={setFormData}
                        saving={saving}
                        uploading={uploading}
                        fileInputRef={fileInputRef}
                        onFileSelect={handleFileSelect}
                        onSave={() => handleUpdateLeader(leader)}
                        onCancel={() => { setEditingId(null); resetForm(); }}
                        duplicateWarning={null}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <AvatarPro src={leader.photo_url} name={leader.name} size="sm" clickable={false} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{leader.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {getLeaderRoleInfo(leader.role, leader.hierarchy_level).emoji} {leader.role}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => startEditing(leader)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveLeader(leader.id)}
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showAddForm ? (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <LeaderForm
                  communityId={communityId}
                  formData={formData}
                  setFormData={setFormData}
                  saving={saving}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                  onFileSelect={handleFileSelect}
                  onSave={handleAddLeader}
                  onCancel={() => { setShowAddForm(false); resetForm(); }}
                  duplicateWarning={duplicateWarning}
                />
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" className="w-full border-dashed" onClick={() => { resetForm(); setShowAddForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Líder
            </Button>
          )}
        </div>

        {selectedImage && (
          <ImageCropModal
            open={cropModalOpen}
            onOpenChange={setCropModalOpen}
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
            title="Recortar Foto do Líder"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageLeadersModal;
