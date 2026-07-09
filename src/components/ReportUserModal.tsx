import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Send, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { REPORT_REASONS } from "@/lib/reportReasons";

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
  currentUserId: string;
}

export const ReportUserModal = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  currentUserId,
}: ReportUserModalProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Selecione um motivo",
        description: "Por favor, selecione o motivo da denúncia",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: currentUserId,
        reported_user_id: reportedUserId,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      setSubmitted(true);
      
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setReason("");
        setDescription("");
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a denúncia",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
              >
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">Denúncia Enviada</h3>
              <p className="text-sm text-muted-foreground">
                Obrigado por ajudar a manter nossa comunidade segura.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Denunciar Usuário
                </DialogTitle>
                <DialogDescription>
                  Denunciar <span className="font-semibold">{reportedUserName}</span> por comportamento inadequado
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Motivo da denúncia *</Label>
                  <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <motion.div
                        key={r.key}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          reason === r.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                        onClick={() => setReason(r.key)}
                      >
                        <RadioGroupItem value={r.key} id={r.key} />
                        <Label htmlFor={r.key} className="cursor-pointer flex-1">
                          {r.label}
                        </Label>
                      </motion.div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva com mais detalhes o que aconteceu..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/500
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !reason}
                    className="flex-1 gap-2"
                    variant="destructive"
                  >
                    {submitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Send className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar Denúncia
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserModal;
