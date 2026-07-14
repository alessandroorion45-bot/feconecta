import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, Trophy } from "lucide-react";
import KingdomBadge, { BadgeRarity, RARITY_STYLES } from "@/components/kingdom-badges/KingdomBadge";
import UnlockCelebrationModal from "@/components/kingdom-badges/UnlockCelebrationModal";
import { CrownIcon, OpenBookIcon, GenerousHeartIcon } from "@/components/kingdom-badges/badgeIcons";

interface BadgeData {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  image_url?: string | null;
  rarity: BadgeRarity;
  category: string;
  xp_reward: number;
  verse_reference?: string | null;
  unlocked?: boolean;
  unlocked_at?: string;
  is_equipped?: boolean;
}

interface RarityRow {
  nome: string;
  slug: string;
  cor_inicio: string;
  cor_fim: string;
}

interface CategoryRow {
  nome: string;
  icone: string | null;
}

// Selos-bandeira com arte própria — os demais usam o emoji do catálogo
// dentro da mesma moldura premium.
const CUSTOM_ICONS: Record<string, React.ReactNode> = {
  early_adopter: <CrownIcon />,
  semeador_da_palavra: <OpenBookIcon />,
  coracao_generoso: <GenerousHeartIcon />,
};

const BadgeShowcase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [rarities, setRarities] = useState<RarityRow[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [celebrating, setCelebrating] = useState<BadgeData | null>(null);

  const rarityColorsFor = (slug: string) => {
    const r = rarities.find((x) => x.slug === slug);
    return r ? { corInicio: r.cor_inicio, corFim: r.cor_fim } : null;
  };
  const rarityLabelFor = (slug: string) => rarities.find((x) => x.slug === slug)?.nome ?? RARITY_STYLES[slug as BadgeRarity]?.label ?? slug;

  useEffect(() => {
    loadBadges();
  }, [user]);

  // Celebra automaticamente quando um novo selo é desbloqueado em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`kingdom-badges-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_badges', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const badgeId = (payload.new as { badge_id: string }).badge_id;
          const { data: badge } = await supabase.from('badges').select('*').eq('id', badgeId).maybeSingle();
          if (badge) setCelebrating(badge as BadgeData);
          loadBadges();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBadges = async () => {
    setLoading(true);

    const [{ data: allBadges, error: badgesError }, { data: rarityRows }, { data: categoryRows }] = await Promise.all([
      supabase.from('badges').select('*').eq('status', 'active').order('ordem', { ascending: true }),
      supabase.from('badge_rarities').select('nome, slug, cor_inicio, cor_fim').order('ordem', { ascending: true }),
      supabase.from('badge_categories').select('nome, icone').order('ordem', { ascending: true }),
    ]);

    setRarities(rarityRows || []);
    setCategoryList(categoryRows || []);

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

  const categories = ['all', ...categoryList.map((c) => c.nome)];

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
              👑 Selos Kingdom
            </span>
            <Badge variant="secondary" className="text-lg">
              {unlockedCount} / {totalCount}
            </Badge>
          </CardTitle>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso da coleção</span>
              <span className="font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const catInfo = categoryList.find((c) => c.nome === cat);
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'Todos' : `${catInfo?.icone ? catInfo.icone + ' ' : ''}${cat}`}
            </Button>
          );
        })}
      </div>

      {/* Grid de Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredBadges.map(badge => {
          const rarityColors = rarityColorsFor(badge.rarity);

          return (
            <Card
              key={badge.id}
              className={`relative overflow-hidden transition-all hover:scale-[1.03] ${
                badge.unlocked ? 'shadow-lg' : 'opacity-70'
              }`}
            >
              <CardContent className="p-4 text-center flex flex-col items-center">
                <div className="mb-3">
                  <KingdomBadge
                    rarity={badge.rarity}
                    rarityColors={rarityColors}
                    icon={badge.unlocked && !badge.image_url ? CUSTOM_ICONS[badge.badge_key] : undefined}
                    imageUrl={badge.unlocked ? badge.image_url : undefined}
                    emoji={badge.icon}
                    locked={!badge.unlocked}
                    equipped={badge.is_equipped}
                    size="md"
                  />
                </div>

                {/* Nome */}
                <h3 className="font-bold text-sm mb-1">
                  {badge.unlocked ? badge.name : '???'}
                </h3>

                {/* Raridade */}
                <Badge variant="outline" className="text-xs mb-2" style={{ color: rarityColors?.corInicio, borderColor: rarityColors?.corInicio }}>
                  {rarityLabelFor(badge.rarity)}
                </Badge>

                {/* Descrição */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {badge.unlocked ? badge.description : 'Selo bloqueado'}
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

      <UnlockCelebrationModal
        badge={
          celebrating
            ? {
                name: celebrating.name,
                description: celebrating.description,
                rarity: celebrating.rarity,
                rarityColors: rarityColorsFor(celebrating.rarity),
                icon: !celebrating.image_url ? CUSTOM_ICONS[celebrating.badge_key] : undefined,
                imageUrl: celebrating.image_url,
                emoji: celebrating.icon,
                verseReference: celebrating.verse_reference,
              }
            : null
        }
        onClose={() => setCelebrating(null)}
      />
    </div>
  );
};

export default BadgeShowcase;
