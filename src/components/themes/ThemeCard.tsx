import { Theme } from "@/lib/themes";
import { ThemePreview } from "./ThemePreview";
import { Crown, Lock, Check, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  theme: Theme;
  isUnlocked: boolean;
  isActive: boolean;
  onSelect: (themeKey: string) => void;
  onClick: () => void;
}

export const ThemeCard = ({
  theme,
  isUnlocked,
  isActive,
  onSelect,
  onClick,
}: ThemeCardProps) => {
  const rarityConfig = {
    1: { icon: Star, color: "text-gray-400", label: "Comum" },
    2: { icon: Star, color: "text-blue-400", label: "Raro" },
    3: { icon: Star, color: "text-purple-400", label: "Épico" },
    4: { icon: Sparkles, color: "text-amber-400", label: "Lendário" },
    5: { icon: Crown, color: "text-gradient bg-gradient-to-r from-purple-500 to-amber-500", label: "Mítico" },
  };

  const config = rarityConfig[theme.rarity];
  const RarityIcon = config.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-500",
        "hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20",
        "border-2",
        isActive
          ? "border-purple-500 ring-4 ring-purple-500/30"
          : isUnlocked
          ? "border-gray-200 dark:border-gray-700 hover:border-purple-400"
          : "border-gray-300 dark:border-gray-600 opacity-75 hover:opacity-100"
      )}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.colors.secondary}30, transparent)`,
        }}
      />

      {/* Content */}
      <div className="relative p-4 bg-white dark:bg-gray-900">
        {/* Preview */}
        <div className="mb-3">
          <ThemePreview theme={theme} size="md" />
        </div>

        {/* Info */}
        <div className="space-y-2">
          {/* Title and Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-bold text-sm line-clamp-1">{theme.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {theme.description}
              </p>
            </div>

            <RarityIcon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {theme.tier && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  theme.tier === "platinum" && "bg-purple-500/20 text-purple-600 dark:text-purple-400",
                  theme.tier === "gold" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                  theme.tier === "standard" && "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                )}
              >
                {theme.tier === "platinum" && "💎 Platina"}
                {theme.tier === "gold" && "⭐ Ouro"}
                {theme.tier === "standard" && "✨ Standard"}
              </Badge>
            )}

            {!isUnlocked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500">
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                Premium
              </Badge>
            )}

            {theme.key === "default" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-600 dark:text-green-400">
                Grátis
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <Button
            size="sm"
            className={cn(
              "w-full text-xs h-8 transition-all duration-300",
              isActive
                ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600"
                : isUnlocked
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (isUnlocked || theme.key === "default") {
                onSelect(theme.key);
              }
            }}
            disabled={!isUnlocked && theme.key !== "default"}
          >
            {isActive ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Em uso
              </>
            ) : isUnlocked || theme.key === "default" ? (
              "Usar Tema"
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Bloqueado
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
      )}
    </div>
  );
};
