import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { registerLinkViolation, ViolationContentType } from "@/lib/antiLink";

interface LinkBlockContextValue {
  /** Bloqueia e mostra o aviso; registra a tentativa no servidor. */
  blockLink: (content: string, type: ViolationContentType) => void;
}

const LinkBlockContext = createContext<LinkBlockContextValue | null>(null);

export const useLinkBlock = (): LinkBlockContextValue => {
  const ctx = useContext(LinkBlockContext);
  if (!ctx) throw new Error("useLinkBlock precisa estar dentro de <LinkBlockProvider>");
  return ctx;
};

export const LinkBlockProvider = ({ children }: { children: ReactNode }) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const blockLink = useCallback((content: string, type: ViolationContentType) => {
    setOpen(true);
    // Registro é best-effort e não deve travar a abertura do aviso
    registerLinkViolation(content, type);
  }, []);

  return (
    <LinkBlockContext.Provider value={{ blockLink }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(4, 20, 10, 0.7)", backdropFilter: "blur(3px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="alertdialog"
              aria-label="Compartilhamento de link bloqueado"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-white dark:bg-zinc-900 p-6 shadow-2xl overflow-hidden"
              initial={reduced ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={
                reduced
                  ? { opacity: 1 }
                  : { scale: 1, opacity: 1, x: [0, -12, 11, -9, 7, -4, 0] }
              }
              exit={reduced ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              transition={reduced ? { duration: 0.2 } : { x: { duration: 0.55, ease: "easeInOut" }, scale: { duration: 0.25 } }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600" />

              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30"
                  animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
                  transition={reduced ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ShieldAlert className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </motion.div>

                <h2 className="text-xl font-bold text-foreground mb-2">Link externo bloqueado</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Por segurança de toda a comunidade, não é permitido compartilhar links externos em
                  publicações, comentários ou mensagens. Essa regra protege os irmãos contra golpes e
                  conteúdos nocivos.
                </p>

                <div className="w-full rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Esta tentativa foi registrada. Se precisar indicar algo, converse diretamente com a
                  liderança da comunidade.
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LinkBlockContext.Provider>
  );
};
