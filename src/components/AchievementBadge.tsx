import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  level: string;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
}

const levelColors = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-cyan-400 to-blue-600",
};

const levelBorders = {
  bronze: "border-amber-600/50",
  silver: "border-gray-400/50",
  gold: "border-yellow-400/50",
  platinum: "border-cyan-400/50",
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

  return (
    <div className="group relative flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border-4 transition-all",
          sizeClasses[size],
          earned
            ? `bg-gradient-to-br ${levelColors[level as keyof typeof levelColors]} ${
                levelBorders[level as keyof typeof levelBorders]
              } shadow-glow`
            : "bg-muted border-border grayscale opacity-40"
        )}
      >
        <span className={earned ? "animate-bounce-subtle" : ""}>{icon}</span>
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            🔒
          </div>
        )}
      </div>
      
      <div className="text-center max-w-[150px]">
        <h4 className="font-semibold text-sm">{name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        {earnedAt && (
          <p className="text-xs text-primary mt-1">
            {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <span className="font-semibold">{name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {earnedAt && (
            <p className="text-xs text-primary mt-2">
              Conquistado em {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
          {!earned && (
            <p className="text-xs text-muted-foreground mt-2">
              Ainda não conquistado
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
