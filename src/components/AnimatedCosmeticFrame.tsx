import { motion } from "framer-motion";
import { FRAME_STYLES } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

interface AnimatedCosmeticFrameProps {
  cosmeticKey: string | null | undefined;
  children: React.ReactNode;
  className?: string;
  /** raio externo da moldura — acompanha o formato do avatar retangular */
  rounded?: string;
}

/**
 * Moldura premium da Kingdom Store: anel em gradiente no formato do avatar
 * (retangular/retrato) + feixe de luz percorrendo a borda em loop infinito.
 * O conteúdo cobre o centro, então a luz só aparece na borda.
 */
export const AnimatedCosmeticFrame = ({ cosmeticKey, children, className, rounded = "rounded-2xl" }: AnimatedCosmeticFrameProps) => {
  const frame = cosmeticKey ? FRAME_STYLES[cosmeticKey] : null;
  if (!frame) return <>{children}</>;

  return (
    <div
      className={cn("relative p-[4px] overflow-hidden", rounded, className)}
      style={{ background: frame.ring, boxShadow: frame.glow ? `0 0 22px ${frame.glow}` : undefined }}
    >
      {/* feixe de luz girando na borda (a área central é coberta pelo conteúdo) */}
      <motion.div
        aria-hidden
        className="absolute -inset-[150%] pointer-events-none motion-reduce:hidden"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.95) 6%, transparent 14%, transparent 50%, rgba(255,255,255,0.55) 56%, transparent 64%, transparent 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
      />
      <div className={cn("relative overflow-hidden", rounded === "rounded-2xl" ? "rounded-xl" : "rounded-full")}>
        {children}
      </div>
    </div>
  );
};

export default AnimatedCosmeticFrame;
