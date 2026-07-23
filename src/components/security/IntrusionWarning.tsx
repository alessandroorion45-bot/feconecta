import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntrusionWarningProps {
  ip: string | null;
  location: string | null;
  onDismiss: () => void;
}

/**
 * Tela de dissuasão exibida ao disparar o gatilho de invasão (muitas
 * tentativas de login falho na mesma conta). MENSAGEM HONESTA: só afirma
 * o que o sistema realmente faz — registrou a tentativa, capturou IP e
 * localização APROXIMADA, notificou o dono da conta. NÃO afirma que
 * "autoridades foram notificadas" (isso não acontece automaticamente);
 * diz apenas que o incidente PODE ser encaminhado.
 */
export const IntrusionWarning = ({ ip, location, onDismiss }: IntrusionWarningProps) => {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [traceDone, setTraceDone] = useState(false);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setProgress(100);
      setTraceDone(true);
      return;
    }
    const start = performance.now();
    const DURATION = 2600;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / DURATION) * 100);
      setProgress(p);
      if (p < 100) raf.current = requestAnimationFrame(tick);
      else setTraceDone(true);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduced]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 20%, #2a0a0f 0%, #12060a 55%, #0a0407 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Sirene vermelho/azul + borda de alarme pulsando */}
      {!reduced && (
        <>
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 25% 45%, rgba(239,68,68,0.3), transparent 58%)" }}
            animate={{ opacity: [0, 1, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 75% 55%, rgba(59,130,246,0.26), transparent 58%)" }}
            animate={{ opacity: [0, 0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none border-4 border-red-600/60"
            animate={{ opacity: [0.15, 0.7, 0.15] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{ background: "repeating-linear-gradient(0deg, transparent 0 2px, #fff 2px 3px)" }}
          />
        </>
      )}

      <div className="relative max-w-lg w-full text-center py-8">
        <motion.div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/15 border border-red-500/40"
          animate={reduced ? undefined : { scale: [1, 1.1, 1] }}
          transition={reduced ? undefined : { duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          <Eye className="h-10 w-10 text-red-500" />
        </motion.div>

        <motion.p
          className="text-xs font-bold tracking-[0.35em] text-red-500 mb-2"
          animate={reduced ? undefined : { opacity: [1, 0.35, 1] }}
          transition={reduced ? undefined : { duration: 0.9, repeat: Infinity }}
        >
          ⚠ OLHO DA VIGILÂNCIA ⚠
        </motion.p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1" style={{ textShadow: "0 0 24px rgba(239,68,68,0.6)" }}>
          Acesso não autorizado detectado
        </h1>
        <p className="text-sm text-red-200/80 mb-6">
          Múltiplas tentativas de acesso a esta conta foram identificadas
        </p>

        <div className="text-left rounded-lg border border-red-900/60 bg-black/70 backdrop-blur-sm p-4 font-mono text-[13px] shadow-[0_0_30px_rgba(239,68,68,0.22)]">
          <div className="flex items-center gap-1.5 mb-3 opacity-60">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-[10px] text-white/50 tracking-widest">KINGDOM SECURITY MONITOR</span>
          </div>

          <p className="text-red-400 font-bold">&gt; Tentativa registrada no sistema ✔</p>
          <p className="text-emerald-400">&gt; Endereço IP capturado: {ip || "[registrado no servidor]"}</p>
          <p className="text-amber-400">
            &gt; Localização aproximada:{" "}
            {traceDone ? (location || "não determinada") : "processando..."}
          </p>

          {/* Barra de "rastreamento" — estética, não promete precisão */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-amber-400"
              style={{ width: `${progress}%` }}
            />
          </div>

          {traceDone && (
            <>
              <p className="text-emerald-400 mt-2">&gt; O proprietário da conta foi notificado ✔</p>
              <p className="text-white/60">&gt; Este incidente pode ser encaminhado às autoridades competentes.</p>
            </>
          )}
        </div>

        <p className="mt-5 text-xs text-white/60 leading-relaxed">
          A localização por IP é aproximada (cidade/região/provedor), não um endereço exato.
          Se esta conta é sua e você esqueceu a senha, use a opção de recuperação — não é
          necessário insistir no login.
        </p>

        <Button
          variant="outline"
          onClick={onDismiss}
          className="mt-5 gap-2 border-red-500/40 bg-transparent text-red-100 hover:bg-red-500/10 hover:text-white"
        >
          <ShieldAlert className="h-4 w-4" /> Entendi
        </Button>
      </div>
    </motion.div>
  );
};

export default IntrusionWarning;
