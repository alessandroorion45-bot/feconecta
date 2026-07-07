import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { usePresence } from "@/contexts/PresenceContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarMiniProfile } from "@/components/AvatarMiniProfile";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type AvatarRing = "admin" | "moderator" | "vip-gold" | "vip-platinum" | "vip-standard" | "new" | "none";

/** Retângulo vertical (proporção ~7:10, estilo retrato) — mesma identidade visual de sempre. */
const SIZE_DIM: Record<AvatarSize, { w: number; h: number }> = {
  xs: { w: 28, h: 40 },
  sm: { w: 36, h: 52 },
  md: { w: 48, h: 68 },
  lg: { w: 64, h: 92 },
  xl: { w: 96, h: 138 },
  xxl: { w: 140, h: 200 },
};

const RING_STYLE: Record<AvatarRing, string> = {
  admin: "ring-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.45)]",
  moderator: "ring-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.4)]",
  "vip-platinum": "ring-fuchsia-400/80 shadow-[0_0_14px_rgba(232,121,249,0.4)]",
  "vip-gold": "ring-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.4)]",
  "vip-standard": "ring-purple-300/70 shadow-[0_0_8px_rgba(216,180,254,0.35)]",
  new: "ring-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.35)]",
  none: "ring-white/15",
};

const FALLBACK_PALETTE = [
  "from-rose-400 to-orange-400",
  "from-amber-400 to-yellow-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-indigo-400 to-violet-500",
  "from-fuchsia-400 to-pink-500",
  "from-teal-400 to-cyan-500",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

interface AvatarProProps {
  src?: string | null;
  name?: string | null;
  userId?: string | null;
  size?: AvatarSize;
  ring?: AvatarRing;
  badgeIcon?: string | null;
  showOnlineStatus?: boolean;
  clickable?: boolean;
  halo?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AvatarPro = memo(({
  src,
  name,
  userId,
  size = "md",
  ring = "none",
  badgeIcon,
  showOnlineStatus,
  clickable,
  halo,
  className,
  onClick,
}: AvatarProProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const { getStatus } = usePresence();

  const { w, h } = SIZE_DIM[size];
  const showOnline = showOnlineStatus ?? Boolean(userId);
  const status = userId ? getStatus(userId) : "offline";
  const isClickable = clickable ?? Boolean(userId);
  const showHalo = halo ?? (size === "lg" || size === "xl" || size === "xxl");
  const colorClass = FALLBACK_PALETTE[hashString(name || userId || "?") % FALLBACK_PALETTE.length];

  const dotSize = Math.max(8, Math.round(w * 0.22));
  const badgeSize = Math.max(14, Math.round(w * 0.34));
  const radius = Math.max(8, Math.round(w * 0.22));

  const avatarBody = (
    <div
      className={cn(
        "group/avatar relative inline-flex shrink-0 select-none",
        isClickable && "cursor-pointer",
        className
      )}
      style={{ width: w, height: h }}
      onClick={onClick}
    >
      {showHalo && (
        <div
          className="pointer-events-none absolute -inset-1.5 opacity-0 blur-md transition-opacity duration-500 group-hover/avatar:opacity-100 bg-gradient-to-br from-primary/30 via-amber-300/20 to-transparent"
          style={{ borderRadius: radius + 6 }}
          aria-hidden
        />
      )}

      {/* Elevação/sombra premium — camadas suaves, cresce discretamente no hover */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-muted transition-all duration-300 ease-out",
          "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_16px_-4px_rgba(15,23,42,0.12)]",
          isClickable && "group-hover/avatar:-translate-y-0.5 group-hover/avatar:scale-[1.03] group-hover/avatar:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_14px_28px_-6px_rgba(15,23,42,0.22)]"
        )}
        style={{ borderRadius: radius }}
      >
        {/* Moldura em vidro fosco + brilho de borda discreto */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 ring-1 ring-inset transition-all duration-300",
            "ring-black/[0.06] dark:ring-white/[0.08]",
            isClickable && "group-hover/avatar:ring-white/25"
          )}
          style={{ borderRadius: radius }}
        />
        <div
          className={cn("pointer-events-none absolute inset-0 z-10 ring-1", RING_STYLE[ring])}
          style={{ borderRadius: radius }}
        />
        {/* Brilho sutil na borda superior (luz vindo de cima) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/3 bg-gradient-to-b from-white/15 to-transparent"
          aria-hidden
        />

        {!loaded && !errored && src && (
          <div className="absolute inset-0 z-[5] overflow-hidden bg-muted">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>
        )}

        {src && !errored ? (
          <img
            src={src}
            alt={name || "Avatar"}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cn(
              "h-full w-full object-cover object-center transition-all duration-500",
              isClickable && "group-hover/avatar:scale-[1.06]",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold text-white",
              colorClass
            )}
            style={{ fontSize: Math.max(10, w * 0.34) }}
          >
            {getInitials(name)}
          </div>
        )}
      </div>

      {badgeIcon && (
        <div
          className="absolute -right-1 -top-1 z-20 flex items-center justify-center rounded-full bg-background shadow ring-1 ring-border"
          style={{ width: badgeSize, height: badgeSize, fontSize: badgeSize * 0.6 }}
          title={badgeIcon}
        >
          {badgeIcon}
        </div>
      )}

      {showOnline && (
        <span
          className={cn(
            "absolute bottom-1 right-1 z-20 rounded-full ring-2 ring-background transition-transform duration-300",
            isClickable && "group-hover/avatar:scale-110",
            status === "online" && "bg-emerald-500",
            status === "away" && "bg-amber-400",
            status === "offline" && "bg-muted-foreground/40"
          )}
          style={{ width: dotSize, height: dotSize }}
          aria-label={status}
        />
      )}
    </div>
  );

  if (!isClickable || !userId) return avatarBody;

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {avatarBody}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <AvatarMiniProfile userId={userId} />
      </PopoverContent>
    </Popover>
  );
});

AvatarPro.displayName = "AvatarPro";
