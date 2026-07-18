import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const sb = supabase as any;

interface StatTile {
  emoji: string;
  label: string;
  value: number;
}

interface ProfileStatsProps {
  userId: string;
}

/**
 * Faixa de resumo do perfil — só leitura, dados que já existem no app
 * (user_stats, selos, presentes recebidos, amizades). Nenhum cálculo novo.
 */
const ProfileStats = memo(({ userId }: ProfileStatsProps) => {
  const [tiles, setTiles] = useState<StatTile[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const [statsRes, badgesRes, giftsRes, friendsRes] = await Promise.all([
        sb.from("user_stats").select("total_points, current_streak, bible_chapters_read, prayers_created, prayers_interceded").eq("user_id", userId).maybeSingle(),
        sb.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", userId),
        sb.from("store_purchases").select("id", { count: "exact", head: true }).eq("gift_to", userId).eq("status", "approved"),
        sb.from("friendships").select("id", { count: "exact", head: true }).or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
      ]);
      if (cancelled) return;

      const stats = statsRes.data;
      setTiles([
        { emoji: "⭐", label: "XP", value: stats?.total_points ?? 0 },
        { emoji: "🔥", label: "Sequência", value: stats?.current_streak ?? 0 },
        { emoji: "🏆", label: "Selos", value: badgesRes.count ?? 0 },
        { emoji: "🎁", label: "Presentes", value: giftsRes.count ?? 0 },
        { emoji: "📖", label: "Estudos", value: stats?.bible_chapters_read ?? 0 },
        { emoji: "🙏", label: "Orações", value: (stats?.prayers_created ?? 0) + (stats?.prayers_interceded ?? 0) },
        { emoji: "👥", label: "Amigos", value: friendsRes.count ?? 0 },
      ]);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!tiles) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm px-2 py-2.5 text-center shadow-sm hover:shadow-md hover:border-amber-400/40 hover:-translate-y-0.5 transition-all duration-[250ms]"
          title={tile.label}
        >
          <div className="text-base leading-none">{tile.emoji}</div>
          <div className="text-sm font-bold text-foreground mt-1 leading-none">
            {tile.value >= 1000 ? `${(tile.value / 1000).toFixed(1).replace(".", ",")}k` : tile.value}
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{tile.label}</div>
        </motion.div>
      ))}
    </div>
  );
});

ProfileStats.displayName = "ProfileStats";

export default ProfileStats;
