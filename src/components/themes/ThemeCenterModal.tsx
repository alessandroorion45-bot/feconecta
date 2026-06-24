import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { getAllThemes, Theme } from "@/lib/themes";
import { ThemeCard } from "./ThemeCard";
import { ThemeDetailPanel } from "./ThemeDetailPanel";
import { useState } from "react";
import { Palette, Sparkles, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ThemeCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeCenterModal = ({ open, onOpenChange }: ThemeCenterModalProps) => {
  const { currentTheme, activeThemeKey, availableThemes, setTheme, loading } = useTheme();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const allThemes = getAllThemes();

  // Criar mapa de temas desbloqueados
  const unlockedThemesMap = new Map(
    availableThemes.map((t) => [t.theme_key, t.is_unlocked])
  );

  const handleThemeSelect = async (themeKey: string) => {
    const isUnlocked = unlockedThemesMap.get(themeKey) ?? false;
    const isDefault = themeKey === "default";

    if (!isUnlocked && !isDefault) {
      toast({
        title: "🔒 Tema Bloqueado",
        description: "Este tema é premium. Entre em contato com um administrador.",
        variant: "destructive",
      });
      return;
    }

    const success = await setTheme(themeKey);

    if (success) {
      toast({
        title: "✨ Tema Aplicado",
        description: "Seu perfil foi atualizado com sucesso.",
        className: "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0",
      });
    } else {
      toast({
        title: "Erro ao aplicar tema",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsPanelOpen(true);
  };

  // Categorizar temas
  const freeThemes = allThemes.filter((t) => t.key === "default");
  const popularThemes = allThemes.filter((t) => t.rarity >= 4 && t.key !== "default");
  const premiumThemes = allThemes.filter((t) => t.tier && t.key !== "default");
  const allPremiumThemes = allThemes.filter((t) => t.key !== "default");

  const renderThemeGrid = (themes: Theme[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {themes.map((theme) => {
        const isUnlocked = unlockedThemesMap.get(theme.key) ?? (theme.key === "default");
        const isActive = activeThemeKey === theme.key;

        return (
          <ThemeCard
            key={theme.key}
            theme={theme}
            isUnlocked={isUnlocked}
            isActive={isActive}
            onSelect={handleThemeSelect}
            onClick={() => handleCardClick(theme)}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold flex items-center gap-2">
                <Palette className="w-8 h-8" />
                🎨 Personalizar Aparência
              </DialogTitle>
              <DialogDescription className="text-purple-100 text-base mt-2">
                Escolha um tema que combine com sua jornada espiritual.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Tema Atual */}
          <div className="px-6 pt-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-lg">
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.colors.gradient.join(", ")})`,
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Tema Atual</p>
                  <h3 className="text-2xl font-bold">{currentTheme.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{currentTheme.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {currentTheme.key === "default" ? (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                      Gratuito
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                    Em uso
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs de Categorias */}
          <div className="px-6 pb-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="popular" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Populares
                </TabsTrigger>
                <TabsTrigger value="premium" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Premium
                </TabsTrigger>
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Novos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="space-y-6">
                  {/* Tema Gratuito */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      🆓 Tema Gratuito
                    </h3>
                    {renderThemeGrid(freeThemes)}
                  </div>

                  {/* Temas Premium */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-purple-500" />
                      Temas Premium
                    </h3>
                    {renderThemeGrid(allPremiumThemes)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="popular">
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    ⭐ Temas Mais Populares
                  </h3>
                  {renderThemeGrid(popularThemes)}
                </div>
              </TabsContent>

              <TabsContent value="premium">
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-500" />
                    👑 Temas Premium
                  </h3>
                  {renderThemeGrid(premiumThemes)}
                </div>
              </TabsContent>

              <TabsContent value="new">
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    ✨ Novos Temas
                  </h3>
                  {renderThemeGrid(allPremiumThemes.slice(0, 4))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Painel de Detalhes */}
      {selectedTheme && (
        <ThemeDetailPanel
          theme={selectedTheme}
          isUnlocked={unlockedThemesMap.get(selectedTheme.key) ?? (selectedTheme.key === "default")}
          isActive={activeThemeKey === selectedTheme.key}
          open={isPanelOpen}
          onOpenChange={setIsPanelOpen}
          onApply={handleThemeSelect}
        />
      )}
    </>
  );
};
