import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2, Save } from "lucide-react";

interface EditableCommunity {
  id: string;
  name: string;
  church_name: string;
  description: string | null;
  city?: string | null;
  state?: string | null;
  main_verse?: string | null;
}

interface EditCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: EditableCommunity;
  onSaved: (patch: Partial<EditableCommunity>) => void;
}

/** Edição da comunidade — visível apenas para o criador */
const EditCommunityModal = ({ open, onOpenChange, community, onSaved }: EditCommunityModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    church_name: "",
    description: "",
    city: "",
    state: "",
    main_verse: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: community.name || "",
        church_name: community.church_name || "",
        description: community.description || "",
        city: community.city || "",
        state: community.state || "",
        main_verse: community.main_verse || "",
      });
    }
  }, [open, community]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const save = async () => {
    if (!form.name.trim() || !form.church_name.trim()) {
      toast({ title: "Campos obrigatórios", description: "Nome da comunidade e da igreja.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const patch: any = {
      name: form.name.trim(),
      church_name: form.church_name.trim(),
      description: form.description.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      main_verse: form.main_verse.trim() || null,
    };

    let { error } = await (supabase as any)
      .from("church_communities")
      .update(patch)
      .eq("id", community.id);

    if (error && /main_verse|column/i.test(error.message || "")) {
      // Coluna main_verse ainda não existe no banco — salva sem ela
      delete patch.main_verse;
      ({ error } = await (supabase as any).from("church_communities").update(patch).eq("id", community.id));
      if (!error) {
        toast({
          title: "Salvo (sem o versículo)",
          description: "Aplique APLICAR_COMUNIDADE4_SQL.sql para ativar o versículo principal.",
        });
      }
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      onSaved(patch);
      onOpenChange(false);
      toast({ title: "✅ Comunidade atualizada!" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Comunidade
          </DialogTitle>
          <DialogDescription>
            Personalize a identidade da sua comunidade. Apenas o criador pode editar.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name">Nome da Comunidade *</Label>
            <Input id="ec-name" value={form.name} onChange={set("name")} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-church">Nome da Igreja *</Label>
            <Input id="ec-church" value={form.church_name} onChange={set("church_name")} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-desc">Descrição / Objetivo</Label>
            <Textarea id="ec-desc" value={form.description} onChange={set("description")} rows={3} maxLength={500} className="resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ec-city">Cidade</Label>
              <Input id="ec-city" value={form.city} onChange={set("city")} maxLength={60} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-state">Estado</Label>
              <Input id="ec-state" value={form.state} onChange={set("state")} maxLength={40} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-verse">Versículo principal da comunidade</Label>
            <Textarea
              id="ec-verse"
              placeholder={'Ex: "Tudo posso naquele que me fortalece." — Filipenses 4:13'}
              value={form.main_verse}
              onChange={set("main_verse")}
              rows={2}
              maxLength={300}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Aparece em destaque no topo da comunidade.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommunityModal;
