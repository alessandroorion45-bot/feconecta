import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Sparkles, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

interface AnsweredPrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prayerId: string;
  prayerTitle: string;
  onSuccess: () => void;
}

const AnsweredPrayerModal = ({
  open,
  onOpenChange,
  prayerId,
  prayerTitle,
  onSuccess,
}: AnsweredPrayerModalProps) => {
  const [testimony, setTestimony] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("prayers")
        .update({
          is_answered: true,
          answered_at: new Date().toISOString(),
          answer_testimony: testimony.trim() || null,
        })
        .eq("id", prayerId);

      if (error) throw error;

      toast({
        title: "Glória a Deus! 🙌",
        description: "Que maravilhoso ver Deus agindo! Seu testemunho foi registrado.",
      });

      onSuccess();
      onOpenChange(false);
      setTestimony("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a oração respondida",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <PartyPopper className="h-6 w-6 text-amber-500" />
            </motion.div>
            Deus Respondeu sua Oração!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Oração Respondida</span>
            </div>
            <p className="text-sm text-muted-foreground">{prayerTitle}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Compartilhe seu testemunho (opcional)
            </label>
            <Textarea
              placeholder="Conte como Deus respondeu sua oração e abençoe outros com seu testemunho..."
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              rows={5}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {testimony.length}/1000
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Seu testemunho pode encorajar outros que estão passando por situações semelhantes! 💙
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-primary gap-2"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como Respondida
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnsweredPrayerModal;
