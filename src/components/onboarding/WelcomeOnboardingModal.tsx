import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Users, Trophy, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeOnboardingModalProps {
  userId?: string;
}

const doneKey = (userId?: string) => `onboarding-done-${userId || "anon"}`;

const STEPS = [
  {
    icon: BookOpen,
    title: "Leia a Palavra e ganhe Selos",
    text: "Cada capítulo lido conta. Complete missões de leitura e desbloqueie selos comemorativos.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: Users,
    title: "Conecte-se com irmãos",
    text: "Compartilhe testemunhos, peça e faça orações, e caminhe junto com sua comunidade.",
    color: "from-sky-400 to-blue-600",
  },
  {
    icon: Trophy,
    title: "Participe dos Desafios",
    text: "Mantenha sua sequência diária, suba no ranking e cresça na fé todos os dias.",
    color: "from-violet-400 to-purple-600",
  },
];

/**
 * Boas-vindas no primeiro acesso. Aparece uma vez por usuário (flag em
 * localStorage). Só exibição — não altera nenhum dado. Termina com um
 * primeiro passo óbvio (ler um capítulo), pra combater o "e agora?".
 */
export const WelcomeOnboardingModal = ({ userId }: WelcomeOnboardingModalProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let done = false;
    try { done = localStorage.getItem(doneKey(userId)) === "1"; } catch { /* ignore */ }
    if (!done) {
      const t = setTimeout(() => setOpen(true), 700); // deixa o feed pintar antes
      return () => clearTimeout(t);
    }
  }, [userId]);

  const finish = (goToBible: boolean) => {
    try { localStorage.setItem(doneKey(userId), "1"); } catch { /* ignore */ }
    setOpen(false);
    if (goToBible) setTimeout(() => navigate("/bible"), 250);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(10, 8, 20, 0.72)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => finish(false)}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => finish(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-black/5 dark:hover:bg-white/10 transition"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Topo com a Arca */}
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 pt-8 pb-6 px-6 text-center text-white">
              <motion.img
                src="/alianca-logo.png"
                alt="Aliança"
                className="mx-auto w-20 h-20 object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]"
                initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              />
              <h2 className="mt-3 text-2xl font-extrabold tracking-wide flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" /> Bem-vindo à Aliança!
              </h2>
              <p className="text-amber-50/90 text-sm mt-1">Sua jornada de fé começa aqui.</p>
            </div>

            {/* Passo atual */}
            <div className="px-6 pt-6 pb-4 min-h-[190px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.28 }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${STEPS[step].color} text-white shadow-lg`}>
                    {(() => {
                      const Icon = STEPS[step].icon;
                      return <Icon className="h-8 w-8" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{STEPS[step].title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{STEPS[step].text}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Indicadores */}
            <div className="flex justify-center gap-1.5 pb-4">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-amber-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-600"}`}
                />
              ))}
            </div>

            {/* Ações */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              {step < STEPS.length - 1 ? (
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => finish(false)}>
                    Pular
                  </Button>
                  <Button
                    className="flex-1 !bg-gradient-to-r !from-amber-500 !to-orange-500 !text-white"
                    onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                  >
                    Próximo
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full !bg-gradient-to-r !from-amber-500 !to-orange-500 !text-white shadow-md"
                    onClick={() => finish(true)}
                  >
                    <BookOpen className="h-4 w-4 mr-1.5" /> Ler meu primeiro capítulo
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => finish(false)}>
                    Explorar o app por conta própria
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WelcomeOnboardingModal;
