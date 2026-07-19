import { memo, useEffect, useState } from "react";
import { motion, animate, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateLevel,
  getTitleFromLevel,
  getXPForNextLevel,
  getProgressToNextLevel,
  formatLargeNumber,
} from "@/lib/gamification";

const sb = supabase as any;

/** Contador animado (count-up) — só exibição, respeita prefers-reduced-motion */
const CountUpNumber = memo(({ value, delay = 0 }: { value: number; delay?: number }) => {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: Math.min(1.4, 0.6 + value / 5000),
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  return <span>{formatLargeNumber(display)}</span>;
});
CountUpNumber.displayName = "CountUpNumber";

interface StatTile {
  emoji: string;
  label: string;
  value: number;
  /** identidade visual do card (borda/fundo no hover) */
  accent: string;
  iconBg: string;
}

interface ProfileStatsProps {
  userId: string;
  /** Sobe o Título do Reino pro cabeçalho — só exibição, sem lógica nova */
  onTitleLoaded?: (title: string, level: number) => void;
}

/**
 * Faixa de resumo do perfil + barra de evolução de nível — só leitura,
 * reusando os helpers puros já existentes em lib/gamification.
 */
const ProfileStats = memo(({ userId, onTitleLoaded }: ProfileStatsProps) => {
  const [tiles, setTiles] = useState<StatTile[] | null>(null);
  const [levelInfo, setLevelInfo] = useState<{ level: number; title: string; progress: number; xp: number; nextXP: number } | null>(null);

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
      const xp = stats?.total_points ?? 0;
      const level = calculateLevel(xp);
      const title = getTitleFromLevel(level);
      setLevelInfo({
        level,
        title,
        progress: getProgressToNextLevel(xp, level),
        xp,
        nextXP: getXPForNextLevel(level),
      });
      onTitleLoaded?.(title, level);

      setTiles([
        { emoji: "⭐", label: "XP", value: xp, accent: "hover:border-amber-400/50", iconBg: "bg-amber-100 dark:bg-amber-900/30" },
        { emoji: "🏆", label: "Selos", value: badgesRes.count ?? 0, accent: "hover:border-purple-400/50", iconBg: "bg-purple-100 dark:bg-purple-900/30" },
        { emoji: "🎁", label: "Presentes", value: giftsRes.count ?? 0, accent: "hover:border-emerald-400/50", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
        { emoji: "🙏", label: "Orações", value: (stats?.prayers_created ?? 0) + (stats?.prayers_interceded ?? 0), accent: "hover:border-blue-400/50", iconBg: "bg-blue-100 dark:bg-blue-900/30" },
        { emoji: "📖", label: "Estudos", value: stats?.bible_chapters_read ?? 0, accent: "hover:border-sky-400/50", iconBg: "bg-sky-100 dark:bg-sky-900/30" },
        { emoji: "🔥", label: "Sequência", value: stats?.current_streak ?? 0, accent: "hover:border-orange-400/50", iconBg: "bg-orange-100 dark:bg-orange-900/30" },
        { emoji: "👥", label: "Amigos", value: friendsRes.count ?? 0, accent: "hover:border-slate-400/50", iconBg: "bg-slate-100 dark:bg-slate-800/50" },
      ]);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!tiles) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            whileTap={{ scale: 0.97 }}
            className={`rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm px-2 py-2.5 text-center shadow-sm hover:shadow-md hover:-translate-y-[3px] hover:scale-[1.03] transition-all duration-[250ms] ${tile.accent}`}
            title={tile.label}
          >
            <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-base leading-none ${tile.iconBg}`}>
              {tile.emoji}
            </div>
            <div className="text-sm font-bold text-foreground mt-1 leading-none">
              <CountUpNumber value={tile.value} delay={0.2 + i * 0.05} />
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{tile.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Barra de evolução de nível */}
      {levelInfo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.25 }}
          className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-[11px]">👑</span>
              Nível {levelInfo.level} · {levelInfo.title}
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{Math.round(levelInfo.progress)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="relative h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, levelInfo.progress)}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            >
              {/* Brilho varrendo a barra em loop */}
              <motion.div
                className="absolute inset-y-0 w-1/2 motion-reduce:hidden"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                }}
                initial={{ x: "-120%" }}
                animate={{ x: "320%" }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut", delay: 1.4 }}
              />
            </motion.div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {formatLargeNumber(levelInfo.xp)} / {formatLargeNumber(levelInfo.nextXP)} XP — faltam {formatLargeNumber(Math.max(0, levelInfo.nextXP - levelInfo.xp))} XP para o próximo nível
          </p>
        </motion.div>
      )}
    </div>
  );
});

ProfileStats.displayName = "ProfileStats";

export default ProfileStats;
