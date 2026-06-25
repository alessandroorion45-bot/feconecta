import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, Sparkles, Trophy, Star, Crown } from "lucide-react";

interface BadgeData {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: string;
  xp_reward: number;
  unlocked?: boolean;
  unlocked_at?: string;
  is_equipped?: boolean;
}

const RARITY_CONFIG = {
  common: {
    label: 'Comum',
    color: 'bg-gray-500',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-600',
    icon: Star,
  },
  rare: {
    label: 'Raro',
    color: 'bg-blue-500',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-600',
    icon: Sparkles,
  },
  epic: {
    label: 'Épico',
    color: 'bg-purple-500',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-600',
    icon: Trophy,
  },
  legendary: {
    label: 'Lendário',
    color: 'bg-orange-500',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-600',
    icon: Crown,
  },
  mythic: {
    label: 'Mítico',
    color: 'bg-gradient-to-r from-pink-500 to-yellow-500',
    borderColor: 'border-pink-400',
    textColor: 'text-pink-600',
    icon: Crown,
  },
};

const BadgeShowcase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    setLoading(true);

    // Buscar todos os badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: false });

    if (badgesError) {
      console.error('[Badges] Erro ao carregar:', badgesError);
      setLoading(false);
      return;
    }

    if (!user) {
      setBadges(allBadges?.map(b => ({ ...b, unlocked: false })) || []);
      setLoading(false);
      return;
    }

    // Buscar badges desbloqueados pelo usuário
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, unlocked_at, is_equipped')
      .eq('user_id', user.id);

    // Combinar dados
    const badgesWithStatus = allBadges?.map(badge => {
      const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
      return {
        ...badge,
        unlocked: !!userBadge,
        unlocked_at: userBadge?.unlocked_at,
        is_equipped: userBadge?.is_equipped || false,
      };
    }) || [];

    setBadges(badgesWithStatus);
    setLoading(false);
  };

  const equipBadge = async (badgeId: string) => {
    if (!user) return;

    // Desequipar todos os badges primeiro
    await supabase
      .from('user_badges')
      .update({ is_equipped: false })
      .eq('user_id', user.id);

    // Equipar o badge selecionado
    const { error } = await supabase
      .from('user_badges')
      .update({ is_equipped: true })
      .eq('user_id', user.id)
      .eq('badge_id', badgeId);

    if (error) {
      toast({
        title: "❌ Erro ao equipar badge",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✅ Badge equipado!",
      description: "Seu badge está agora visível no perfil",
      className: "bg-green-50 border-green-200",
    });

    loadBadges();
  };

  const categories = ['all', ...new Set(badges.map(b => b.category))];

  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(b => b.category === selectedCategory);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Progresso */}
      <Card className="shadow-divine bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🏆 Meus Badges
            </span>
            <Badge variant="secondary" className="text-lg">
              {unlockedCount} / {totalCount}
            </Badge>
          </CardTitle>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Grid de Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredBadges.map(badge => {
          const config = RARITY_CONFIG[badge.rarity];
          const Icon = config.icon;

          return (
            <Card
              key={badge.id}
              className={`relative overflow-hidden transition-all hover:scale-105 ${
                badge.unlocked
                  ? `border-2 ${config.borderColor} shadow-lg`
                  : 'opacity-50 grayscale'
              } ${badge.is_equipped ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <CardContent className="p-4 text-center">
                {/* Raridade Badge */}
                <div className="absolute top-2 right-2">
                  <Icon className={`h-4 w-4 ${config.textColor}`} />
                </div>

                {/* Icon */}
                <div className={`text-5xl mb-3 ${!badge.unlocked && 'blur-sm'}`}>
                  {badge.unlocked ? badge.icon : '🔒'}
                </div>

                {/* Nome */}
                <h3 className={`font-bold text-sm mb-1 ${config.textColor}`}>
                  {badge.unlocked ? badge.name : '???'}
                </h3>

                {/* Raridade */}
                <Badge
                  variant="outline"
                  className={`text-xs mb-2 ${config.textColor} border-current`}
                >
                  {config.label}
                </Badge>

                {/* Descrição */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {badge.unlocked ? badge.description : 'Badge bloqueado'}
                </p>

                {/* Ações */}
                {badge.unlocked && user && (
                  <Button
                    size="sm"
                    variant={badge.is_equipped ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => equipBadge(badge.id)}
                  >
                    {badge.is_equipped ? '✓ Equipado' : 'Equipar'}
                  </Button>
                )}

                {!badge.unlocked && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Bloqueado
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-20">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Nenhum badge encontrado</h2>
          <p className="text-muted-foreground">Tente outra categoria</p>
        </div>
      )}
    </div>
  );
};

export default BadgeShowcase;
