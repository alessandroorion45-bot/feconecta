import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import KingdomBadge from "@/components/kingdom-badges/KingdomBadge";
import BadgeDetailModal, { BadgeDetail } from "@/components/kingdom-badges/BadgeDetailModal";
import SeloRevelacaoModal, { RevealBadgeData } from "@/components/kingdom-badges/SeloRevelacaoModal";
import { Crown, ChevronRight } from "lucide-react";

const sb = supabase as any;

interface ShowcaseBadge {
  id: string;
  is_equipped: boolean;
  unlocked_at: string;
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    image_url: string | null;
    rarity: string;
    category: string;
    verse_reference: string | null;
    verse_text: string | null;
    unlock_story: string | null;
    unlock_criteria: { type?: string } | null;
  } | null;
}

interface RarityRow {
  nome: string;
  slug: string;
  cor_inicio: string;
  cor_fim: string;
}

interface ProfileBadgesShowcaseProps {
  userId: string;
}

/** 🏆 Meus Selos — até 6 medalhas (equipado primeiro) + chip "+N", clique abre o detalhe */
const ProfileBadgesShowcase = memo(({ userId }: ProfileBadgesShowcaseProps) => {
  const [items, setItems] = useState<ShowcaseBadge[] | null>(null);
  const [total, setTotal] = useState(0);
  const [rarities, setRarities] = useState<RarityRow[]>([]);
  const [detail, setDetail] = useState<BadgeDetail | null>(null);
  const [reveal, setReveal] = useState<{ data: RevealBadgeData; item: ShowcaseBadge } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const [listRes, countRes, rarRes] = await Promise.all([
        sb.from("user_badges")
          .select("id, is_equipped, unlocked_at, badges(id, name, description, icon, image_url, rarity, category, verse_reference, verse_text, unlock_story, unlock_criteria)")
          .eq("user_id", userId)
          .order("is_equipped", { ascending: false })
          .order("unlocked_at", { ascending: false })
          .limit(6),
        sb.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", userId),
        sb.from("badge_rarities").select("nome, slug, cor_inicio, cor_fim"),
      ]);
      if (cancelled) return;
      setItems(listRes.data || []);
      setTotal(countRes.count ?? 0);
      setRarities(rarRes.data || []);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const openReveal = (item: ShowcaseBadge) => {
    const b = item.badges;
    if (!b) return;
    const rar = rarities.find((r) => r.slug === b.rarity);
    setReveal({
      item,
      data: {
        badgeId: b.id,
        name: b.name,
        category: b.category,
        rarity: b.rarity,
        rarityColors: rar ? { corInicio: rar.cor_inicio, corFim: rar.cor_fim } : null,
        imageUrl: b.image_url,
        emoji: b.icon,
      },
    });
  };

  const openDetail = async (item: ShowcaseBadge) => {
    const b = item.badges;
    if (!b) return;
    const { count } = await sb
      .from("user_badges")
      .select("id", { count: "exact", head: true })
      .eq("badge_id", b.id);
    const rar = rarities.find((r) => r.slug === b.rarity);
    setDetail({
      name: b.name,
      description: b.description,
      rarity: b.rarity,
      rarityLabel: rar?.nome || b.rarity,
      rarityColors: rar ? { corInicio: rar.cor_inicio, corFim: rar.cor_fim } : null,
      category: b.category,
      imageUrl: b.image_url,
      emoji: b.icon,
      verseReference: b.verse_reference,
      verseText: b.verse_text,
      unlockStory: b.unlock_story,
      unlockType: b.unlock_criteria?.type,
      usersCount: count ?? 0,
      createdAt: item.unlocked_at,
      unlocked: true,
    });
  };

  if (!items) return null;

  // Estado vazio inspirador
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-5 py-7 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-sm font-semibold text-foreground">Selos Kingdom</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
          Você ainda não conquistou nenhum selo. Continue estudando, orando, participando da
          comunidade e fortalecendo sua caminhada com Cristo. Seu primeiro selo está mais próximo
          do que imagina.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3 border-amber-400/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
          <Link to="/gamification">Explorar Selos</Link>
        </Button>
      </div>
    );
  }

  const extra = Math.max(0, total - items.length);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-[250ms]">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-border/50">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Crown className="h-4 w-4 text-amber-500" />
          Meus Selos
        </span>
        <Link
          to="/gamification"
          className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
        >
          Ver coleção completa <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 p-4 overflow-x-auto snap-x sm:flex-wrap sm:justify-center">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            onClick={() => openReveal(item)}
            className="group flex flex-col items-center gap-2 shrink-0 snap-start transition-transform duration-[250ms] hover:-translate-y-[3px] hover:rotate-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded-xl p-1"
            title={`${item.badges?.name}${item.badges?.category ? ` · ${item.badges.category}` : ""}`}
          >
            <KingdomBadge
              rarity={item.badges?.rarity || "common"}
              imageUrl={item.badges?.image_url}
              emoji={item.badges?.icon}
              equipped={item.is_equipped}
              size="md"
            />
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground max-w-[88px] truncate text-center transition-colors duration-[250ms]">
              {item.badges?.name}
            </span>
          </motion.button>
        ))}
        {extra > 0 && (
          <Link
            to="/gamification"
            className="flex flex-col items-center justify-center gap-1 shrink-0 snap-start self-center rounded-full h-16 w-16 border border-dashed border-amber-400/50 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-sm font-bold hover:bg-amber-500/15 hover:scale-105 transition-all duration-[250ms]"
            title={`Mais ${extra} ${extra === 1 ? "selo" : "selos"}`}
          >
            +{extra}
          </Link>
        )}
      </div>

      <SeloRevelacaoModal
        badge={reveal?.data || null}
        onClose={() => setReveal(null)}
        onShowDetails={() => {
          if (reveal) {
            openDetail(reveal.item);
            setReveal(null);
          }
        }}
      />
      <BadgeDetailModal badge={detail} onClose={() => setDetail(null)} />
    </div>
  );
});

ProfileBadgesShowcase.displayName = "ProfileBadgesShowcase";

export default ProfileBadgesShowcase;
