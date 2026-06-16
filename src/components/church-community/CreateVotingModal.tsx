import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Vote, Plus, X, Loader2 } from "lucide-react";

interface CreateVotingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  onSuccess: () => void;
}

const CreateVotingModal = ({ open, onOpenChange, communityId, userId, onSuccess }: CreateVotingModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    voting_type: "decision",
    is_anonymous_votes: false,
    options: ["", ""],
  });

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, ""],
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = formData.options.filter(opt => opt.trim());
    
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Preencha o título da votação.",
        variant: "destructive",
      });
      return;
    }

    if (validOptions.length < 2) {
      toast({
        title: "Opções insuficientes",
        description: "Adicione pelo menos 2 opções de voto.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const options = validOptions.map((text, index) => ({
        id: `option_${index}`,
        text,
        votes_count: 0,
      }));

      const { error } = await supabase
        .from("community_votings")
        .insert({
          community_id: communityId,
          created_by: userId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          voting_type: formData.voting_type,
          is_anonymous_votes: formData.is_anonymous_votes,
          options,
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Votação criada!",
        description: "Os membros já podem votar.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        voting_type: "decision",
        is_anonymous_votes: false,
        options: ["", ""],
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao criar votação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Vote className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>Nova Votação</DialogTitle>
          </div>
          <DialogDescription>
            Crie uma votação para a comunidade decidir juntos. Todos os membros ativos poderão participar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Escolha do tema do retiro"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a votação em detalhes..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.voting_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, voting_type: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decision">Decisão</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="evaluation">Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Opções de voto *</Label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    disabled={loading}
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {formData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar opção
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">Votos anônimos</Label>
            <Switch
              id="anonymous"
              checked={formData.is_anonymous_votes}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_anonymous_votes: checked }))}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Votação"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVotingModal;
