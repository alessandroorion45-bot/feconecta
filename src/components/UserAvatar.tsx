import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

/**
 * Standardized rectangular user avatar component
 * Uses 7:10 aspect ratio (similar to 9:16) for consistent visual identity
 * 
 * Sizes:
 * - xs: 28x40px (notifications, small lists)
 * - sm: 36x52px (comments, compact views)
 * - md: 48x68px (cards, feed posts)
 * - lg: 64x92px (rankings, larger displays)
 * - xl: 84x120px mobile / 112x160px desktop (profile header)
 */
const UserAvatar = ({ 
  src, 
  fallback, 
  size = "md", 
  className,
  onClick 
}: UserAvatarProps) => {
  const sizeClasses = {
    xs: "w-7 h-10",
    sm: "w-9 h-[52px]",
    md: "w-12 h-[68px]",
    lg: "w-16 h-[92px]",
    xl: "w-[84px] h-[120px] sm:w-[112px] sm:h-[160px]"
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl sm:text-3xl"
  };

  const initial = fallback?.charAt(0)?.toUpperCase() || "?";

  return (
    <div 
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-muted to-primary/5 transition-transform duration-300 ease-out hover:scale-110",
        sizeClasses[size],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img 
          src={src} 
          alt={fallback}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
          <span className={cn("font-semibold text-primary", textSizes[size])}>
            {initial}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
