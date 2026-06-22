import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useVIP } from "@/hooks/useVIP";
import { Lock, Check, Crown, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ThemesGallery = () => {
  const { availableThemes, activeThemeKey, setTheme, loading } = useTheme();
  const { isVIP, tier } = useVIP();
  const { toast } = useToast();
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivateTheme = async (themeKey: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      toast({
        title: "Tema bloqueado",
        description: "Este tema requer VIP ou conquistas específicas.",
        variant: "destructive",
      });
      return;
    }

    setActivating(themeKey);
    const success = await setTheme(themeKey);

    if (success) {
      toast({
        title: "Tema ativado! ✨",
        description: "Seu tema foi alterado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível ativar o tema.",
        variant: "destructive",
      });
    }

    setActivating(null);
  };

  const getRarityStars = (rarity: number) => {
    return Array.from({ length: rarity }, (_, i) => (
      <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando temas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">
            Galeria de Temas
          </h1>
          <p className="text-muted-foreground">
            Personalize sua experiência com temas exclusivos
          </p>

          {isVIP && (
            <Badge className="mt-4" variant="default">
              <Crown className="h-4 w-4 mr-1" />
              VIP {tier?.toUpperCase()} - Acesso a temas premium
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableThemes.map((theme) => {
            const isActive = theme.theme_key === activeThemeKey;
            const isUnlocked = theme.is_unlocked;

            // Parse colors
            const colors = theme.colors as any;
            const gradient = colors.gradient || [colors.primary, colors.secondary];

            return (
              <Card
                key={theme.theme_key}
                className={`relative overflow-hidden transition-all ${
                  isActive ? "ring-2 ring-primary shadow-lg" : ""
                } ${!isUnlocked ? "opacity-60" : ""}`}
              >
                {/* Preview do tema */}
                <div
                  className="h-32 relative"
                  style={{
                    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[gradient.length - 1]})`,
                  }}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="h-12 w-12 text-white" />
                    </div>
                  )}

                  {isActive && (
                    <Badge className="absolute top-2 right-2" variant="default">
                      <Check className="h-3 w-3 mr-1" /> Ativo
                    </Badge>
                  )}

                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {getRarityStars(theme.rarity)}
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {theme.theme_name}
                    {theme.rarity >= 5 && <Sparkles className="h-4 w-4 text-purple-500" />}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{theme.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <Button
                    onClick={() => handleActivateTheme(theme.theme_key, isUnlocked)}
                    disabled={!isUnlocked || isActive || activating === theme.theme_key}
                    className="w-full"
                    variant={isActive ? "secondary" : "default"}
                  >
                    {activating === theme.theme_key ? (
                      "Ativando..."
                    ) : isActive ? (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Tema Ativo
                      </>
                    ) : !isUnlocked ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" /> Bloqueado
                      </>
                    ) : (
                      "Ativar Tema"
                    )}
                  </Button>

                  {!isUnlocked && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {theme.rarity >= 4 ? "Requer VIP Gold ou superior" : "Desbloqueie com VIP"}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isVIP && (
          <Card className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Desbloqueie Temas Premium com VIP
              </CardTitle>
              <CardDescription>
                Torne-se VIP e tenha acesso instantâneo a todos os temas exclusivos!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Benefícios VIP: 2x XP, todos os temas, moldura dourada, badges exclusivos e muito
                mais!
              </p>
              <Button className="w-full md:w-auto">Saiba Mais Sobre VIP</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ThemesGallery;
