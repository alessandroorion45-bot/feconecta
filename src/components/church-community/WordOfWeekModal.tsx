import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface WordOfWeekModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  onSuccess: () => void;
}

const WordOfWeekModal = ({ open, onOpenChange, communityId, userId, onSuccess }: WordOfWeekModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    verse_reference: "",
    verse_text: "",
    content: "",
    applications: "",
    reflection_questions: "",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const publish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tema e o resumo da ministração.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Despina a Palavra anterior (fica no histórico do mural)
      await (supabase as any)
        .from("community_posts")
        .update({ is_pinned: false })
        .eq("community_id", communityId)
        .eq("type", "word_of_week")
        .eq("is_pinned", true);

      const { error } = await (supabase as any).from("community_posts").insert({
        community_id: communityId,
        user_id: userId,
        type: "word_of_week",
        title: form.title.trim(),
        content: form.content.trim(),
        verse_reference: form.verse_reference.trim() || null,
        verse_text: form.verse_text.trim() || null,
        applications: form.applications.trim() || null,
        reflection_questions: form.reflection_questions.trim() || null,
        is_pinned: true,
      });

      if (error) throw error;

      toast({ title: "✨ Palavra da Semana publicada!", description: "Ela está em destaque no mural da comunidade." });
      setForm({ title: "", verse_reference: "", verse_text: "", content: "", applications: "", reflection_questions: "" });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao publicar",
        description: error.message?.includes("does not exist") || error.message?.includes("policy")
          ? "Aplique a atualização do banco (APLICAR_COMUNIDADE_SQL.sql) e confirme que você é líder."
          : error.message,
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
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Palavra da Semana
          </DialogTitle>
          <DialogDescription>
            Compartilhe a mensagem que vai guiar a comunidade nesta semana.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wow-title">Tema da mensagem *</Label>
            <Input id="wow-title" placeholder="Ex: A fidelidade de Deus no deserto"
              value={form.title} onChange={set("title")} maxLength={120} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wow-ref">Texto bíblico principal</Label>
              <Input id="wow-ref" placeholder="Ex: Êxodo 3:1-9"
                value={form.verse_reference} onChange={set("verse_reference")} maxLength={60} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-verse">Versículo em destaque</Label>
            <Textarea id="wow-verse" placeholder="Cole aqui o texto do versículo principal..."
              value={form.verse_text} onChange={set("verse_text")} rows={2} maxLength={500} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-content">Resumo da ministração *</Label>
            <Textarea id="wow-content" placeholder="O que Deus falou através desta mensagem..."
              value={form.content} onChange={set("content")} rows={4} maxLength={2000} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-app">Aplicações práticas</Label>
            <Textarea id="wow-app" placeholder="Como viver esta Palavra durante a semana..."
              value={form.applications} onChange={set("applications")} rows={3} maxLength={1000} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-q">Perguntas para reflexão</Label>
            <Textarea id="wow-q" placeholder={"1. O que este texto revela sobre Deus?\n2. Qual área da sua vida ele alcança?"}
              value={form.reflection_questions} onChange={set("reflection_questions")} rows={3} maxLength={1000} className="resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={publish} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordOfWeekModal;
