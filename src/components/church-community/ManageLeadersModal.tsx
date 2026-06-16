import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";

interface Leader {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
}

interface ManageLeadersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
}

const ManageLeadersModal = ({ open, onOpenChange, communityId, userId }: ManageLeadersModalProps) => {
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
  });

  useEffect(() => {
    if (open) {
      loadLeaders();
    }
  }, [open, communityId]);

  const loadLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from("church_leaders")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error("Error loading leaders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeader = async () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e o cargo do líder.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("church_leaders")
        .insert({
          community_id: communityId,
          name: formData.name.trim(),
          role: formData.role.trim(),
          bio: formData.bio.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Líder adicionado!",
        description: "O líder agora pode receber avaliações.",
      });

      setFormData({ name: "", role: "", bio: "" });
      setShowAddForm(false);
      loadLeaders();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar líder",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLeader = async (leader: Leader) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("church_leaders")
        .update({
          name: formData.name.trim() || leader.name,
          role: formData.role.trim() || leader.role,
          bio: formData.bio.trim() || leader.bio,
        })
        .eq("id", leader.id);

      if (error) throw error;

      toast({ title: "Líder atualizado!" });
      setEditingId(null);
      setFormData({ name: "", role: "", bio: "" });
      loadLeaders();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLeader = async (leaderId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("church_leaders")
        .update({ is_active: false })
        .eq("id", leaderId);

      if (error) throw error;

      toast({ title: "Líder removido" });
      loadLeaders();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (leader: Leader) => {
    setEditingId(leader.id);
    setFormData({
      name: leader.name,
      role: leader.role,
      bio: leader.bio || "",
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
            Adicione pastores e dirigentes que podem ser avaliados pelos membros da comunidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Leaders list */}
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
                      <div className="space-y-3">
                        <Input
                          placeholder="Nome"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                          placeholder="Cargo"
                          value={formData.role}
                          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        />
                        <Textarea
                          placeholder="Bio (opcional)"
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateLeader(leader)}
                            disabled={saving}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setFormData({ name: "", role: "", bio: "" });
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={leader.photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                            {leader.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{leader.name}</p>
                          <p className="text-sm text-muted-foreground">{leader.role}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(leader)}
                          >
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

          {/* Add form */}
          {showAddForm ? (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome do líder"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Input
                    placeholder="Ex: Pastor, Dirigente, Líder de Louvor"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio (opcional)</Label>
                  <Textarea
                    placeholder="Uma breve descrição..."
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={saving}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddLeader}
                    disabled={saving}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ name: "", role: "", bio: "" });
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Líder
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageLeadersModal;
