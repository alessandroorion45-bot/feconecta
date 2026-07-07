import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Theme } from "@/lib/themes";
import { ThemePreview } from "./ThemePreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Crown, Sparkles, Star, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeDetailPanelProps {
  theme: Theme;
  isUnlocked: boolean;
  isActive: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (themeKey: string) => void;
}

export const ThemeDetailPanel = ({
  theme,
  isUnlocked,
  isActive,
  open,
  onOpenChange,
  onApply,
}: ThemeDetailPanelProps) => {
  const rarityConfig = {
    1: { icon: Star, color: "text-gray-400", label: "Comum", description: "Tema básico" },
    2: { icon: Star, color: "text-blue-400", label: "Raro", description: "Tema diferenciado" },
    3: { icon: Star, color: "text-purple-400", label: "Épico", description: "Tema especial" },
    4: { icon: Sparkles, color: "text-amber-400", label: "Lendário", description: "Tema exclusivo" },
    5: { icon: Crown, color: "text-gradient", label: "Mítico", description: "O mais raro" },
  };

  const config = rarityConfig[theme.rarity];
  const RarityIcon = config.icon;

  const features = [
    { icon: Palette, label: "Paleta Exclusiva", value: `${theme.colors.gradient.length} cores` },
    { icon: Sparkles, label: "Efeitos Premium", value: theme.effects?.particles || "Padrão" },
    { icon: Crown, label: "Categoria", value: theme.tier || "Standard" },
    { icon: Star, label: "Raridade", value: config.label },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {/* Header with gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-32 -z-10 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.gradient.join(", ")})`,
          }}
        />

        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <RarityIcon className={cn("w-8 h-8", config.color)} />
            <div className="flex-1">
              <SheetTitle className="text-2xl">{theme.name}</SheetTitle>
              <SheetDescription>{config.description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Preview Grande */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Preview</h3>
            <div className="rounded-xl overflow-hidden border-2 shadow-lg" style={{ borderColor: theme.colors.accent }}>
              <ThemePreview theme={theme} size="lg" />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Descrição</h3>
            <p className="text-sm leading-relaxed">{theme.description}</p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {theme.tier && (
              <Badge
                className={cn(
                  "text-xs",
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

            {!isUnlocked && theme.key !== "default" && (
              <Badge variant="outline" className="border-purple-500">
                <Lock className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}

            {theme.key === "default" && (
              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                Grátis
              </Badge>
            )}

            {isActive && (
              <Badge className="bg-blue-500 text-white">
                <Check className="w-3 h-3 mr-1" />
                Em uso
              </Badge>
            )}
          </div>

          {/* Recursos */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Recursos</h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted border border-border"
                >
                  <feature.icon className="w-4 h-4 mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{feature.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{feature.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Paleta de Cores */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Paleta de Cores</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <div className="h-12 rounded-lg border" style={{ backgroundColor: theme.colors.primary }} />
                <p className="text-xs text-center text-muted-foreground">Primária</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-lg border" style={{ backgroundColor: theme.colors.secondary }} />
                <p className="text-xs text-center text-muted-foreground">Secundária</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-lg border" style={{ backgroundColor: theme.colors.accent }} />
                <p className="text-xs text-center text-muted-foreground">Destaque</p>
              </div>
            </div>

            {/* Gradiente */}
            <div className="mt-3 space-y-2">
              <div
                className="h-12 rounded-lg border"
                style={{
                  background: `linear-gradient(90deg, ${theme.colors.gradient.join(", ")})`,
                }}
              />
              <p className="text-xs text-center text-muted-foreground">Gradiente Premium</p>
            </div>
          </div>

          {/* Efeitos Especiais */}
          {theme.effects && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Efeitos Especiais</h3>
              <div className="space-y-2">
                {theme.effects.particles && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Partículas</p>
                      <p className="text-xs text-muted-foreground">{theme.effects.particles}</p>
                    </div>
                  </div>
                )}
                {theme.effects.glow && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Brilho</p>
                      <p className="text-xs text-muted-foreground">{theme.effects.glow}</p>
                    </div>
                  </div>
                )}
                {theme.effects.animation && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Animação</p>
                      <p className="text-xs text-muted-foreground">{theme.effects.animation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="sticky bottom-0 left-0 right-0 bg-card border-t pt-4 -mx-6 px-6">
            <Button
              size="lg"
              className={cn(
                "w-full text-base transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
                  : isUnlocked || theme.key === "default"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                  : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
              )}
              onClick={() => {
                if (isUnlocked || theme.key === "default") {
                  onApply(theme.key);
                  onOpenChange(false);
                }
              }}
              disabled={!isUnlocked && theme.key !== "default"}
            >
              {isActive ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Tema Ativo
                </>
              ) : isUnlocked || theme.key === "default" ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Aplicar Tema
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Tema Bloqueado
                </>
              )}
            </Button>

            {!isUnlocked && theme.key !== "default" && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Entre em contato com um administrador para desbloquear
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
