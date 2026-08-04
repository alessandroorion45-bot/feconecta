import { motion } from "framer-motion";
import { FRAME_STYLES } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

interface AnimatedCosmeticFrameProps {
  cosmeticKey: string | null | undefined;
  children: React.ReactNode;
  className?: string;
  /** raio externo da moldura — acompanha o formato do avatar retangular */
  rounded?: string;
  /** raio exato em px (usado nos avatares, que são "quadrados arredondados"
   *  com raio proporcional ao tamanho — classe fixa não encaixaria) */
  radiusPx?: number;
  /** espessura do anel; menor nos avatares pequenos do feed */
  padPx?: number;
}

/**
 * Moldura premium da Kingdom Store: anel em gradiente no formato do avatar
 * (retangular/retrato) + feixe de luz percorrendo a borda em loop infinito.
 * O conteúdo cobre o centro, então a luz só aparece na borda.
 */
export const AnimatedCosmeticFrame = ({
  cosmeticKey, children, className, rounded = "rounded-2xl", radiusPx, padPx,
}: AnimatedCosmeticFrameProps) => {
  const frame = cosmeticKey ? FRAME_STYLES[cosmeticKey] : null;
  if (!frame) return <>{children}</>;

  const pad = padPx ?? 4;

  return (
    <div
      className={cn("relative overflow-hidden", radiusPx == null && rounded, className)}
      style={{
        padding: pad,
        borderRadius: radiusPx != null ? radiusPx + pad : undefined,
        background: frame.ring,
        boxShadow: frame.glow ? `0 0 ${radiusPx != null ? 12 : 22}px ${frame.glow}` : undefined,
      }}
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
      {/* fundo sólido: garante que a luz giratória apareça SÓ na borda, nunca no centro */}
      <div
        className={cn(
          "relative overflow-hidden bg-card flex",
          radiusPx == null && (rounded === "rounded-2xl" ? "rounded-xl" : "rounded-full"),
        )}
        style={{ borderRadius: radiusPx != null ? radiusPx : undefined }}
      >
        {children}
      </div>
    </div>
  );
};

export default AnimatedCosmeticFrame;
