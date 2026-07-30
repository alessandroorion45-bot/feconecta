import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Ban, Cross } from "lucide-react";

interface Verdict {
  clean: boolean;
  action?: "warning" | "suspension";
  offense?: number;
  days?: number;
  words?: string[];
  user_name?: string;
}

interface ModerationContextType {
  /** Retorna true se o conteúdo pode ser publicado; false se foi bloqueado (mostra modal). */
  check: (content: string, context?: string) => Promise<boolean>;
}

const ModerationContext = createContext<ModerationContextType | undefined>(undefined);

export function ModerationProvider({ children }: { children: ReactNode }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const check = useCallback(async (content: string, context = "publicação"): Promise<boolean> => {
    if (!content || !content.trim()) return true;
    try {
      const { data, error } = await supabase.rpc("moderate_content", { p_content: content, p_context: context });
      if (error) return true; // falha de infra → não bloqueia usuário legítimo
      const d = data as unknown as Verdict;
      if (d?.clean) return true;
      setVerdict(d);
      return false;
    } catch {
      return true;
    }
  }, []);

  const close = () => {
    const wasSuspension = verdict?.action === "suspension";
    setVerdict(null);
    // Suspenso: recarrega pra que a barreira de acesso o retire do app.
    if (wasSuspension) setTimeout(() => window.location.reload(), 150);
  };

  const isSuspension = verdict?.action === "suspension";

  return (
    <ModerationContext.Provider value={{ check }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {verdict && !verdict.clean && (
            <motion.div
              className="fixed inset-0 z-[120] flex items-center justify-center p-4"
              style={{ background: "rgba(10,6,4,0.75)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl"
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                <div className={`pt-7 pb-5 px-6 text-center text-white ${isSuspension ? "bg-gradient-to-br from-red-600 to-rose-700" : "bg-gradient-to-br from-amber-500 to-orange-600"}`}>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 grid place-items-center mb-3">
                    {isSuspension ? <Ban className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                  </div>
                  <h2 className="text-2xl font-extrabold">
                    {isSuspension ? "Conta suspensa" : "Advertência"}
                  </h2>
                </div>

                <div className="px-6 py-6 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary mb-3">
                    <Cross className="h-4 w-4" /> Aqui é uma plataforma cristã
                  </p>

                  {verdict.words && verdict.words.length > 0 && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Detectamos linguagem imprópria:{" "}
                      <span className="font-semibold text-red-500">"{verdict.words.join(", ")}"</span>
                    </p>
                  )}

                  {isSuspension ? (
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      Como isso se repetiu, sua conta foi <b>suspensa por {verdict.days} dias</b>.
                      Se atitudes de ódio ou desrespeito continuarem, você poderá ser
                      <b> excluído permanentemente</b> da plataforma. Vamos zelar juntos por um
                      ambiente de amor e respeito entre os irmãos. 🙏
                    </p>
                  ) : (
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      Xingamentos e discurso de ódio <b>não são permitidos</b> aqui. Esta é uma
                      <b> advertência</b>. Se isso se repetir, sua conta será <b>suspensa</b>.
                      Que as nossas palavras edifiquem uns aos outros. 🙏
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground mt-3">
                    "A vossa palavra seja sempre agradável, temperada com sal." — Colossenses 4:6
                  </p>

                  <Button
                    className={`w-full mt-5 !text-white ${isSuspension ? "!bg-gradient-to-r !from-red-600 !to-rose-700" : "!bg-gradient-to-r !from-amber-500 !to-orange-600"}`}
                    onClick={close}
                  >
                    Entendi
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ModerationContext.Provider>
  );
}

export function useModeration() {
  const ctx = useContext(ModerationContext);
  if (!ctx) throw new Error("useModeration must be used within ModerationProvider");
  return ctx;
}
