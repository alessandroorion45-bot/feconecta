import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Send, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { REPORT_REASONS } from "@/lib/reportReasons";

interface ReportContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporterId: string;
  reportedUserId: string;
  contentType: string;
  contentId: string;
  /** trecho curto do conteúdo, só pra dar contexto no registro salvo (não aparece pro denunciado) */
  contentSnippet?: string;
}

export function ReportContentModal({
  open,
  onOpenChange,
  reporterId,
  reportedUserId,
  contentType,
  contentId,
  contentSnippet,
}: ReportContentModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const reset = () => {
    setReason("");
    setOtherText("");
    setSubmitted(false);
    setAlreadyReported(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setAlreadyReported(false);
    try {
      const description = reason === "other" ? otherText.trim() : contentSnippet || null;
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        description,
        content_type: contentType,
        content_id: contentId,
      });

      if (error) {
        // 23505 = violação do índice único (mesma pessoa já denunciou este conteúdo)
        if (error.code === "23505") {
          setAlreadyReported(true);
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        handleOpenChange(false);
      }, 2200);
    } catch (error: any) {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-red-500/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-red-500/10">
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
                transition={{ type: "spring", delay: 0.15 }}
                className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
              >
                <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">Sua denúncia foi enviada.</h3>
              <p className="text-sm text-muted-foreground">
                Obrigado por ajudar a proteger nossa comunidade.
              </p>
            </motion.div>
          ) : alreadyReported ? (
            <motion.div
              key="already"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Você já denunciou esta publicação.</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nossa equipe já está analisando essa denúncia.
              </p>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  </div>
                  Denunciar publicação
                </DialogTitle>
                <DialogDescription>
                  Ajude a manter nossa comunidade segura. Sua denúncia será enviada para análise da
                  administração e permanecerá anônima para o usuário denunciado.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Motivo da denúncia *</Label>
                  <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {REPORT_REASONS.map((r) => (
                      <div
                        key={r.key}
                        className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          reason === r.key
                            ? "border-red-500/50 bg-red-500/5"
                            : "border-border hover:border-red-500/30 hover:bg-muted/50"
                        }`}
                        onClick={() => setReason(r.key)}
                      >
                        <RadioGroupItem value={r.key} id={`reason-${r.key}`} />
                        <Label htmlFor={`reason-${r.key}`} className="cursor-pointer flex-1 font-normal">
                          {r.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {reason === "other" && (
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Explique o motivo..."
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value.slice(0, 500))}
                      className="min-h-[90px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">{otherText.length}/500</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" disabled={submitting} onClick={() => handleOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !reason || (reason === "other" && !otherText.trim())}
                    className="flex-1 gap-2"
                    variant="destructive"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar denúncia
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
