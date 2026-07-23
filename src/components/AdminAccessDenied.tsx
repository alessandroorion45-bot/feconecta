import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Tela 403 teatral do painel admin — "invasor detectado". A sequência de
 * rastreamento é encenação (visual de sirene, tela tremendo, terminal
 * digitando), mas os dados exibidos são reais: o IP público vem da API
 * da ipify, navegador/SO vêm do userAgent, e a tentativa é registrada de
 * verdade no log de segurança pelo AdminRoute. O aviso legal é verdadeiro:
 * invasão de sistema é crime no Brasil (Art. 154-A do Código Penal).
 */

interface TerminalLine {
  text: string;
  delay: number;
  tone: "info" | "warn" | "danger" | "success";
}

const TONE_CLASS: Record<TerminalLine["tone"], string> = {
  info: "text-emerald-400",
  warn: "text-amber-400",
  danger: "text-red-400 font-bold",
  success: "text-emerald-300",
};

const browserSummary = () => {
  const ua = navigator.userAgent;
  const browser =
    ua.includes("Edg/") ? "Microsoft Edge"
    : ua.includes("OPR/") ? "Opera"
    : ua.includes("Chrome/") ? "Chrome"
    : ua.includes("Firefox/") ? "Firefox"
    : ua.includes("Safari/") ? "Safari"
    : "Navegador desconhecido";
  const os =
    ua.includes("Windows") ? "Windows"
    : ua.includes("Android") ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad") ? "iOS"
    : ua.includes("Mac OS") ? "macOS"
    : ua.includes("Linux") ? "Linux"
    : "SO desconhecido";
  return `${browser} · ${os}`;
};

export const AdminAccessDenied = () => {
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [ip, setIp] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // IP público real — muito mais "magnético" do que um número inventado.
    // Se a rede bloquear, segue sem IP (a linha mostra "registrado no servidor").
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => setIp(d?.ip ?? null))
      .catch(() => setIp(null));
  }, []);

  useEffect(() => {
    const now = new Date().toLocaleString("pt-BR");
    const script: TerminalLine[] = [
      { text: "> ACESSO NÃO AUTORIZADO DETECTADO", delay: 300, tone: "danger" },
      { text: "> Iniciando protocolo de segurança Kingdom...", delay: 1100, tone: "info" },
      { text: `> Registrando tentativa: ${now}`, delay: 1900, tone: "info" },
      { text: `> Dispositivo identificado: ${browserSummary()}`, delay: 2700, tone: "warn" },
      { text: "> Localizando endereço IP do invasor...", delay: 3500, tone: "warn" },
      { text: "IP_PLACEHOLDER", delay: 4600, tone: "danger" },
      { text: "> Tentativa registrada no log de segurança ✔", delay: 5400, tone: "success" },
      { text: "> Administradores foram notificados ✔", delay: 6100, tone: "success" },
    ];
    if (reduced) {
      setLines(script);
      setDone(true);
      return;
    }
    script.forEach((line) => {
      timersRef.current.push(setTimeout(() => setLines((prev) => [...prev, line]), line.delay));
    });
    timersRef.current.push(setTimeout(() => setDone(true), 6800));
    return () => timersRef.current.forEach(clearTimeout);
  }, [reduced]);

  const renderLine = (line: TerminalLine, i: number) => {
    const text = line.text === "IP_PLACEHOLDER"
      ? `> IP LOCALIZADO: ${ip ?? "[registrado no servidor]"}`
      : line.text;
    return (
      <motion.p
        key={i}
        initial={reduced ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className={`${TONE_CLASS[line.tone]} leading-relaxed`}
      >
        {text}
      </motion.p>
    );
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 20%, #2a0a0f 0%, #12060a 55%, #0a0407 100%)" }}
      animate={
        reduced || done
          ? undefined
          : { x: [0, -6, 5, -4, 6, -2, 3, 0], y: [0, 3, -4, 2, -3, 4, -1, 0] }
      }
      transition={reduced || done ? undefined : { duration: 0.55, repeat: 11, ease: "easeInOut" }}
    >
      {/* Sirene: vermelho e azul alternando, varrendo a tela */}
      {!reduced && (
        <>
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 20% 50%, rgba(239,68,68,0.28), transparent 55%)" }}
            animate={{ opacity: [0, 1, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 80% 50%, rgba(59,130,246,0.25), transparent 55%)" }}
            animate={{ opacity: [0, 0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          {/* flash de borda tipo alerta */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none border-4 border-red-600/60"
            animate={{ opacity: [0.15, 0.7, 0.15] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* scanlines sutis de "câmera de segurança" */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{ background: "repeating-linear-gradient(0deg, transparent 0 2px, #fff 2px 3px)" }}
          />
        </>
      )}

      <div className="relative max-w-lg w-full text-center py-10">
        <motion.div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/15 border border-red-500/40"
          animate={reduced ? undefined : { scale: [1, 1.12, 1] }}
          transition={reduced ? undefined : { duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </motion.div>

        <motion.p
          className="text-xs font-bold tracking-[0.35em] text-red-500 mb-2"
          animate={reduced ? undefined : { opacity: [1, 0.35, 1] }}
          transition={reduced ? undefined : { duration: 0.9, repeat: Infinity }}
        >
          ⚠ ALERTA DE SEGURANÇA ⚠
        </motion.p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1" style={{ textShadow: "0 0 24px rgba(239,68,68,0.6)" }}>
          ACESSO NEGADO
        </h1>
        <p className="text-sm text-red-200/80 mb-6">Tentativa de invasão ao painel administrativo detectada</p>

        {/* Terminal de rastreamento */}
        <div className="text-left rounded-lg border border-red-900/60 bg-black/70 backdrop-blur-sm p-4 font-mono text-[13px] min-h-[13rem] shadow-[0_0_30px_rgba(239,68,68,0.25)]">
          <div className="flex items-center gap-1.5 mb-3 opacity-60">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-[10px] text-white/50 tracking-widest">KINGDOM SECURITY MONITOR</span>
          </div>
          {lines.map(renderLine)}
          {!done && <span className="text-emerald-400 animate-pulse">▍</span>}
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={done ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5 }}
          className={done ? "" : "opacity-0"}
        >
          <p className="mt-6 text-sm font-semibold text-red-300 leading-relaxed">
            Você será localizado. Invasão de sistema é crime
            <span className="block text-xs font-normal text-red-200/70 mt-1">
              Art. 154-A do Código Penal Brasileiro — invasão de dispositivo informático: pena de reclusão e multa.
            </span>
          </p>
          <p className="mt-3 text-xs text-white/50">
            Se você chegou aqui por engano, volte ao app — nenhuma ação é necessária.
          </p>
          <Link to="/feed">
            <Button variant="outline" className="mt-5 gap-2 border-red-500/40 bg-transparent text-red-100 hover:bg-red-500/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Voltar ao app
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminAccessDenied;
