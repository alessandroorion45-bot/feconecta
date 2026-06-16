import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Church, Loader2, Music, Users, Heart, Baby, Globe, BookOpen, HandHeart, Radio } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LocationPicker from "./LocationPicker";

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const MINISTRIES = [
  { id: "louvor", name: "Ministério de Louvor", icon: Music, emoji: "🎶" },
  { id: "danca", name: "Ministério de Dança", icon: Heart, emoji: "💃" },
  { id: "homens", name: "Ministério de Homens", icon: Users, emoji: "👨" },
  { id: "mulheres", name: "Ministério de Mulheres", icon: Users, emoji: "👩" },
  { id: "jovens", name: "Ministério de Jovens", icon: Users, emoji: "🧑‍🤝‍🧑" },
  { id: "adultos", name: "Ministério de Adultos", icon: Users, emoji: "👥" },
  { id: "infantil", name: "Ministério Infantil", icon: Baby, emoji: "👶" },
  { id: "casais", name: "Ministério de Casais", icon: Heart, emoji: "💑" },
  { id: "missoes", name: "Ministério de Missões", icon: Globe, emoji: "🌍" },
  { id: "evangelismo", name: "Ministério de Evangelismo", icon: Heart, emoji: "✝️" },
  { id: "intercessao", name: "Ministério de Intercessão", icon: HandHeart, emoji: "🙏" },
  { id: "ensino", name: "Ministério de Ensino/Discipulado", icon: BookOpen, emoji: "📚" },
  { id: "acao_social", name: "Ministério de Ação Social", icon: HandHeart, emoji: "🤝" },
  { id: "midia", name: "Ministério de Mídia/Comunicação", icon: Radio, emoji: "📡" },
];

const CreateCommunityModal = ({ open, onOpenChange, userId, onSuccess }: CreateCommunityModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    church_name: "",
    description: "",
  });
  const [location, setLocation] = useState<{
    country: string;
    state: string;
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }>({
    country: "Brasil",
    state: "",
    city: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
  });
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);

  const toggleMinistry = (ministryId: string) => {
    setSelectedMinistries(prev => 
      prev.includes(ministryId) 
        ? prev.filter(id => id !== ministryId)
        : [...prev, ministryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.church_name.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome da comunidade e da igreja.",
        variant: "destructive",
      });
      return;
    }

    if (!location.state || !location.city || !location.address) {
      toast({
        title: "Localização incompleta",
        description: "Preencha o estado, município e endereço da igreja.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create community
      const { data: community, error: communityError } = await supabase
        .from("church_communities")
        .insert({
          name: formData.name.trim(),
          church_name: formData.church_name.trim(),
          description: formData.description.trim() || null,
          created_by: userId,
          member_count: 1,
          country: location.country,
          state: location.state,
          city: location.city,
          address: location.address,
          latitude: location.latitude || null,
          longitude: location.longitude || null,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Add creator as admin member with selected ministries
      const { error: memberError } = await supabase
        .from("church_community_members")
        .insert({
          community_id: community.id,
          user_id: userId,
          role: "admin",
          ministries: selectedMinistries,
        });

      if (memberError) throw memberError;

      // Reset form
      setFormData({ name: "", church_name: "", description: "" });
      setLocation({
        country: "Brasil",
        state: "",
        city: "",
        address: "",
        latitude: undefined,
        longitude: undefined,
      });
      setSelectedMinistries([]);
      
      toast({
        title: "✅ Comunidade criada com sucesso!",
        description: `ID: ${community.id.slice(0, 8)}... - Sua comunidade já está disponível.`,
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao criar comunidade",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Church className="h-5 w-5 text-primary-foreground" />
            </div>
            <DialogTitle>Criar Comunidade</DialogTitle>
          </div>
          <DialogDescription>
            Crie um espaço para sua comunidade participar de decisões e fortalecer a fé juntos.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Comunidade *</Label>
              <Input
                id="name"
                placeholder="Ex: Comunidade Esperança"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="church_name">Nome da Igreja *</Label>
              <Input
                id="church_name"
                placeholder="Ex: Igreja Batista Central"
                value={formData.church_name}
                onChange={(e) => setFormData(prev => ({ ...prev, church_name: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito e valores desta comunidade..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Location Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                📍 Localização da Igreja
              </h4>
              <LocationPicker value={location} onChange={setLocation} />
            </div>

            {/* Ministries Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                ⛪ Ministérios Ativos (opcional)
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {MINISTRIES.map((ministry) => (
                  <div
                    key={ministry.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedMinistries.includes(ministry.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleMinistry(ministry.id)}
                  >
                    <Checkbox
                      checked={selectedMinistries.includes(ministry.id)}
                      onCheckedChange={() => toggleMinistry(ministry.id)}
                    />
                    <span className="text-lg">{ministry.emoji}</span>
                    <span className="text-sm">{ministry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Comunidade"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityModal;
