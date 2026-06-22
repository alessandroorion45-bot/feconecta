import { Crown, Sparkles, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VIPTier } from "@/hooks/useVIP";

interface VIPBadgeProps {
  tier: VIPTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function VIPBadge({ tier, size = "md", showLabel = false, className }: VIPBadgeProps) {
  if (!tier) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const iconClass = sizeClasses[size];

  // Configuração por tier
  const tierConfig = {
    standard: {
      icon: Crown,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "VIP",
      gradient: "from-yellow-400 to-yellow-600",
    },
    gold: {
      icon: Sparkles,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      label: "VIP Gold",
      gradient: "from-amber-400 to-amber-600",
    },
    platinum: {
      icon: Gem,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      label: "VIP Platinum",
      gradient: "from-purple-400 to-purple-600",
    },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  if (!showLabel) {
    // Apenas ícone
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          config.bgColor,
          className
        )}
        title={config.label}
      >
        <Icon className={cn(iconClass, config.color)} />
      </span>
    );
  }

  // Com label
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className={iconClass} />
      <span>{config.label}</span>
    </span>
  );
}

// Componente para moldura VIP (ao redor do avatar)
interface VIPFrameProps {
  tier: VIPTier;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VIPFrame({ tier, children, size = "md", className }: VIPFrameProps) {
  if (!tier) {
    // Sem moldura VIP, retornar children normal
    return <>{children}</>;
  }

  const frameConfig = {
    standard: {
      border: "border-2 border-yellow-500",
      shadow: "shadow-lg shadow-yellow-500/30",
      gradient: "from-yellow-400 via-yellow-500 to-yellow-600",
    },
    gold: {
      border: "border-2 border-amber-500",
      shadow: "shadow-lg shadow-amber-500/30",
      gradient: "from-amber-400 via-amber-500 to-amber-600",
    },
    platinum: {
      border: "border-2 border-purple-500",
      shadow: "shadow-lg shadow-purple-500/30 animate-pulse",
      gradient: "from-purple-400 via-purple-500 to-purple-600",
    },
  };

  const config = frameConfig[tier];

  const sizeClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  return (
    <div
      className={cn(
        "relative rounded-full",
        `bg-gradient-to-br ${config.gradient}`,
        sizeClasses[size],
        config.shadow,
        className
      )}
    >
      {children}
    </div>
  );
}

// Componente para efeitos visuais VIP (partículas, brilho)
interface VIPEffectsProps {
  tier: VIPTier;
  className?: string;
}

export function VIPEffects({ tier, className }: VIPEffectsProps) {
  if (!tier || tier === "standard") return null;

  // Apenas Gold e Platinum têm efeitos visuais
  if (tier === "gold") {
    return (
      <div className={cn("absolute inset-0 pointer-events-none overflow-hidden rounded-lg", className)}>
        {/* Brilho dourado sutil */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-amber-300/10 blur-xl animate-pulse" />
      </div>
    );
  }

  if (tier === "platinum") {
    return (
      <div className={cn("absolute inset-0 pointer-events-none overflow-hidden rounded-lg", className)}>
        {/* Brilho roxo animado */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-400/20 blur-xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-500/20 blur-xl animate-pulse delay-500" />

        {/* Partículas (opcional - pode ser pesado) */}
        {/* <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div> */}
      </div>
    );
  }

  return null;
}
