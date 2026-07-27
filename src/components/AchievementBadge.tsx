import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  level: string;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
}

// Nível (1/2/3 ou bronze/silver/gold/platinum) → tema de cor + glow
const TIERS = {
  bronze: { grad: "from-amber-500 to-amber-700", ring: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
  silver: { grad: "from-slate-300 to-slate-500", ring: "#cbd5e1", glow: "rgba(203,213,225,0.5)" },
  gold: { grad: "from-yellow-400 to-amber-500", ring: "#facc15", glow: "rgba(250,204,21,0.6)" },
  platinum: { grad: "from-cyan-400 to-blue-600", ring: "#67e8f9", glow: "rgba(103,232,249,0.55)" },
};
const tierFor = (level: string) => {
  const l = String(level || "").toLowerCase();
  if (l === "1" || l === "bronze") return TIERS.bronze;
  if (l === "2" || l === "silver") return TIERS.silver;
  if (l === "3" || l === "gold") return TIERS.gold;
  if (l === "platinum") return TIERS.platinum;
  return TIERS.gold;
};

// Variante de entrada (o container pai controla o stagger)
export const achItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export const AchievementBadge = ({
  icon,
  name,
  description,
  level,
  earned = false,
  earnedAt,
  size = "md",
}: AchievementBadgeProps) => {
  const sizeClasses = {
    sm: "w-16 h-16 text-2xl",
    md: "w-24 h-24 text-4xl",
    lg: "w-32 h-32 text-5xl",
  };
  const tier = tierFor(level);

  return (
    <motion.div
      variants={achItem}
      whileHover={{ y: -6, scale: 1.04 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="group relative flex flex-col items-center gap-2"
    >
      <div className="relative">
        {/* glow pulsante atrás (só desbloqueado) */}
        {earned && (
          <span
            className="ach-glow absolute -inset-2 rounded-full blur-lg pointer-events-none"
            style={{ background: `radial-gradient(circle, ${tier.glow}, transparent 70%)` }}
            aria-hidden
          />
        )}

        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border-4 overflow-hidden transition-all duration-300",
            sizeClasses[size],
            earned
              ? `bg-gradient-to-br ${tier.grad}`
              : "bg-muted border-border grayscale opacity-45 group-hover:opacity-70"
          )}
          style={earned ? { borderColor: tier.ring, boxShadow: `0 0 22px ${tier.glow}, inset 0 1px 0 rgba(255,255,255,0.25)` } : undefined}
        >
          {/* reflexo superior + shine que percorre no hover */}
          {earned && (
            <>
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
              <span className="ach-shine absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none" />
            </>
          )}

          <span className={cn("relative drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]", earned && "ach-float")}>{icon}</span>

          {!earned && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-full text-lg">
              🔒
            </div>
          )}
        </div>

        {/* faíscas (só desbloqueado) */}
        {earned && (
          <>
            <span className="ach-spark absolute -top-1 right-1 text-[10px]" style={{ animationDelay: "0s" }}>✦</span>
            <span className="ach-spark absolute bottom-0 -left-1 text-[8px]" style={{ animationDelay: "1.1s" }}>✦</span>
          </>
        )}
      </div>

      <div className="text-center max-w-[150px]">
        <h4 className={cn("font-semibold text-sm", earned ? "text-foreground" : "text-muted-foreground")}>{name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        {earnedAt && (
          <p className="text-[11px] font-medium text-amber-500 mt-1">
            {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <span className="font-semibold">{name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {earnedAt ? (
            <p className="text-xs text-amber-500 mt-2">Conquistado em {new Date(earnedAt).toLocaleDateString()}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">Ainda não conquistado</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
