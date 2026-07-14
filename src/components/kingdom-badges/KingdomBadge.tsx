import { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeRarity =
  | "common"
  | "special"
  | "rare"
  | "epic"
  | "mythic"
  | "legendary"
  | "kingdom_exclusive";

interface RarityStyle {
  label: string;
  rim: string;
  glow: string;
  particleColor: string;
  particleCount: number;
  aura?: boolean;
}

export const RARITY_STYLES: Record<BadgeRarity, RarityStyle> = {
  common: {
    label: "Comum",
    rim: "linear-gradient(135deg, #e2e4e9, #9aa0ac)",
    glow: "rgba(160,165,175,0.45)",
    particleColor: "#c9ccd1",
    particleCount: 0,
  },
  special: {
    label: "Especial",
    rim: "linear-gradient(135deg, #6ee7b7, #059669)",
    glow: "rgba(16,185,129,0.5)",
    particleColor: "#6ee7b7",
    particleCount: 4,
  },
  rare: {
    label: "Raro",
    rim: "linear-gradient(135deg, #93c5fd, #2563eb)",
    glow: "rgba(59,130,246,0.5)",
    particleColor: "#93c5fd",
    particleCount: 6,
  },
  epic: {
    label: "Épico",
    rim: "linear-gradient(135deg, #d8b4fe, #7c3aed)",
    glow: "rgba(147,51,234,0.55)",
    particleColor: "#d8b4fe",
    particleCount: 8,
  },
  mythic: {
    label: "Mítico",
    rim: "linear-gradient(135deg, #fda4af, #be123c)",
    glow: "rgba(225,29,72,0.55)",
    particleColor: "#fda4af",
    particleCount: 10,
    aura: true,
  },
  legendary: {
    label: "Lendário",
    rim: "linear-gradient(135deg, #fde68a, #b45309)",
    glow: "rgba(217,119,6,0.6)",
    particleColor: "#fde68a",
    particleCount: 12,
    aura: true,
  },
  kingdom_exclusive: {
    label: "Kingdom Exclusive",
    rim: "linear-gradient(135deg, #fff8dc, #f5d060 45%, #b8860b)",
    glow: "rgba(245,208,96,0.7)",
    particleColor: "#fff2b3",
    particleCount: 16,
    aura: true,
  },
};

const SIZE_MAP = {
  sm: { box: 64, icon: 24, ring: 3 },
  md: { box: 96, icon: 36, ring: 4 },
  lg: { box: 148, icon: 56, ring: 6 },
};

interface KingdomBadgeProps {
  rarity: BadgeRarity | string;
  icon?: React.ReactNode;
  emoji?: string;
  locked?: boolean;
  equipped?: boolean;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

const KingdomBadge = ({ rarity, icon, emoji, locked, equipped, size = "md", className }: KingdomBadgeProps) => {
  const style = RARITY_STYLES[rarity as BadgeRarity] ?? RARITY_STYLES.common;
  const dims = SIZE_MAP[size];

  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (locked || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 18);
    rotateX.set(-py * 18);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const particles = !locked && style.particleCount > 0 ? Array.from({ length: style.particleCount }) : [];

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ width: dims.box, height: dims.box, rotateX, rotateY, perspective: 600 }}
      className={cn("relative select-none", className)}
    >
      {/* brilho pulsante por trás */}
      {!locked && (
        <div
          className="absolute inset-0 rounded-full blur-xl kingdom-badge-glow"
          style={{ background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)` }}
        />
      )}

      {/* partículas */}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const radius = dims.box * 0.62;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 3,
              height: 3,
              left: "50%",
              top: "50%",
              backgroundColor: style.particleColor,
              boxShadow: `0 0 6px ${style.particleColor}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [0, Math.cos(angle) * radius, Math.cos(angle) * radius * 1.15],
              y: [0, Math.sin(angle) * radius, Math.sin(angle) * radius * 1.15],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* moldura lapidada */}
      <div
        className={cn("absolute inset-0 rounded-full", locked && "grayscale opacity-40")}
        style={{ background: style.rim, padding: dims.ring, boxShadow: locked ? "none" : `0 4px 18px -4px ${style.glow}` }}
      >
        {/* sheen holográfico rotativo */}
        {!locked && (
          <div
            className={cn("absolute inset-0 rounded-full overflow-hidden", style.aura && "kingdom-badge-sheen")}
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.55) 8%, transparent 16%, transparent 100%)",
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* disco de vidro */}
        <div
          className="relative h-full w-full rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05) 60%, rgba(0,0,0,0.15))",
          }}
        >
          {locked ? (
            <Lock className="text-white/70" style={{ width: dims.icon * 0.6, height: dims.icon * 0.6 }} />
          ) : icon ? (
            <div style={{ width: dims.icon, height: dims.icon }} className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              {icon}
            </div>
          ) : (
            <span style={{ fontSize: dims.icon * 0.7 }} className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              {emoji}
            </span>
          )}
        </div>
      </div>

      {/* anel de "equipado" */}
      {equipped && (
        <div className="absolute -inset-1 rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-background pointer-events-none" />
      )}
    </motion.div>
  );
};

export default KingdomBadge;
