import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { usePresence } from "@/contexts/PresenceContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarMiniProfile } from "@/components/AvatarMiniProfile";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type AvatarRing = "admin" | "moderator" | "vip-gold" | "vip-platinum" | "vip-standard" | "new" | "none";

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 40,
  md: 60,
  lg: 90,
  xl: 140,
  xxl: 200,
};

const RING_STYLE: Record<AvatarRing, string> = {
  admin: "ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.55)]",
  moderator: "ring-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]",
  "vip-platinum": "ring-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.5)]",
  "vip-gold": "ring-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]",
  "vip-standard": "ring-purple-300 shadow-[0_0_8px_rgba(216,180,254,0.4)]",
  new: "ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
  none: "ring-border/60",
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

  const px = SIZE_PX[size];
  const showOnline = showOnlineStatus ?? Boolean(userId);
  const status = userId ? getStatus(userId) : "offline";
  const isClickable = clickable ?? Boolean(userId);
  const showHalo = halo ?? (size === "lg" || size === "xl" || size === "xxl");
  const colorClass = FALLBACK_PALETTE[hashString(name || userId || "?") % FALLBACK_PALETTE.length];

  const dotSize = Math.max(8, Math.round(px * 0.24));
  const badgeSize = Math.max(14, Math.round(px * 0.32));

  const avatarBody = (
    <div
      className={cn(
        "relative inline-flex shrink-0 select-none",
        isClickable && "cursor-pointer transition-transform duration-200 hover:scale-105",
        className
      )}
      style={{ width: px, height: px }}
      onClick={onClick}
    >
      {showHalo && (
        <div
          className="pointer-events-none absolute -inset-1.5 rounded-full bg-gradient-to-br from-primary/25 via-amber-300/15 to-transparent blur-md animate-pulse"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative h-full w-full rounded-full ring-2 ring-offset-2 ring-offset-background overflow-hidden bg-muted shadow-md transition-shadow duration-200",
          RING_STYLE[ring]
        )}
      >
        {!loaded && !errored && src && (
          <div className="absolute inset-0 rounded-full bg-muted animate-pulse" />
        )}

        {src && !errored ? (
          <img
            src={src}
            alt={name || "Avatar"}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cn(
              "h-full w-full object-cover object-center transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold text-white",
              colorClass
            )}
            style={{ fontSize: Math.max(10, px * 0.36) }}
          >
            {getInitials(name)}
          </div>
        )}
      </div>

      {badgeIcon && (
        <div
          className="absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-background shadow ring-1 ring-border"
          style={{ width: badgeSize, height: badgeSize, fontSize: badgeSize * 0.62 }}
          title={badgeIcon}
        >
          {badgeIcon}
        </div>
      )}

      {showOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
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
