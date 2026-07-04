import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const MINISTRIES = [
  { id: "louvor", name: "Ministério de Louvor", emoji: "🎶" },
  { id: "danca", name: "Ministério de Dança", emoji: "💃" },
  { id: "homens", name: "Ministério de Homens", emoji: "👨" },
  { id: "mulheres", name: "Ministério de Mulheres", emoji: "👩" },
  { id: "jovens", name: "Ministério de Jovens", emoji: "🧑‍🤝‍🧑" },
  { id: "adultos", name: "Ministério de Adultos", emoji: "👥" },
  { id: "infantil", name: "Ministério Infantil", emoji: "👶" },
  { id: "casais", name: "Ministério de Casais", emoji: "💑" },
  { id: "missoes", name: "Ministério de Missões", emoji: "🌍" },
  { id: "evangelismo", name: "Ministério de Evangelismo", emoji: "✝️" },
  { id: "intercessao", name: "Ministério de Intercessão", emoji: "🙏" },
  { id: "ensino", name: "Ministério de Ensino/Discipulado", emoji: "📚" },
  { id: "acao_social", name: "Ministério de Ação Social", emoji: "🤝" },
  { id: "midia", name: "Ministério de Mídia/Comunicação", emoji: "📡" },
];

interface MinistriesSelectorProps {
  communityId: string;
  userId: string;
  onUpdate?: () => void;
}

const MinistriesSelector = ({ communityId, userId, onUpdate }: MinistriesSelectorProps) => {
  const { toast } = useToast();
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMemberMinistries();
  }, [communityId, userId]);

  const loadMemberMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from("church_community_members")
        .select("ministries")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setSelectedMinistries(data?.ministries || []);
    } catch (error) {
      console.error("Error loading ministries:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMinistry = (ministryId: string) => {
    setSelectedMinistries(prev => 
      prev.includes(ministryId) 
        ? prev.filter(m => m !== ministryId)
        : [...prev, ministryId]
    );
  };

  const saveMinistries = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("church_community_members")
        .update({ ministries: selectedMinistries })
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      toast({
        title: "🙏 Ministérios atualizados!",
        description: "Que Deus abençoe seu serviço em cada ministério.",
      });

      onUpdate?.();
    } catch (error) {
      console.error("Error saving ministries:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os ministérios.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Meus Ministérios
        </CardTitle>
        <CardDescription>
          Selecione os ministérios dos quais você participa nesta comunidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spiritual message */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-primary italic">
            "Cada um exerça o dom que recebeu para servir os outros." — 1 Pedro 4:10
          </p>
        </div>

        {/* Ministries grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MINISTRIES.map(ministry => (
            <div
              key={ministry.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedMinistries.includes(ministry.id)
                  ? "bg-primary/10 border-primary"
                  : "bg-card hover:bg-muted/50"
              }`}
              onClick={() => toggleMinistry(ministry.id)}
            >
              {/* Indicador visual puro (Checkbox Radix dentro de card clicável
                  dispara toggle duplo e entra em loop de Presence — React #185) */}
              <div
                className={cn(
                  "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center transition-colors",
                  selectedMinistries.includes(ministry.id) && "bg-primary text-primary-foreground"
                )}
              >
                {selectedMinistries.includes(ministry.id) && <Check className="h-3 w-3" />}
              </div>
              <span className="text-xl">{ministry.emoji}</span>
              <span className="text-sm font-medium flex-1">{ministry.name}</span>
            </div>
          ))}
        </div>

        {/* Selected count */}
        <p className="text-sm text-muted-foreground text-center">
          {selectedMinistries.length === 0 
            ? "Nenhum ministério selecionado"
            : `${selectedMinistries.length} ministério${selectedMinistries.length > 1 ? "s" : ""} selecionado${selectedMinistries.length > 1 ? "s" : ""}`
          }
        </p>

        {/* Save button */}
        <Button 
          onClick={saveMinistries} 
          className="w-full"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Ministérios
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MinistriesSelector;
