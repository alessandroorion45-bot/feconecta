import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/live-fx.css";

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Gancho diário no topo do feed: sequência (streak) + versículo do dia.
 * É o motivo pra voltar todo dia. Só exibição — reusa get_daily_verse e
 * user_stats.current_streak que já existem.
 */
export const DailyHookCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [streak, setStreak] = useState<number>(0);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [verseRes, statsRes] = await Promise.all([
          supabase.rpc("get_daily_verse"),
          user
            ? supabase.from("user_stats").select("current_streak").eq("user_id", user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (!active) return;
        const v = (verseRes.data as Verse[] | null)?.[0];
        if (v) setVerse(v);
        const s = (statsRes as { data: { current_streak?: number } | null }).data?.current_streak;
        if (typeof s === "number") setStreak(s);
      } catch {
        /* silencioso — é um card de destaque, não pode quebrar o feed */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !verse) return null;

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Card className="overflow-hidden border-0 shadow-divine bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white">
      <CardContent className="p-4 space-y-3">
        {/* Topo: data + streak */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-50/90 capitalize">{hoje}</span>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 backdrop-blur-sm">
            <Flame className={`h-4 w-4 ${streak > 0 ? "text-yellow-200 icon-glow" : "text-white/70"}`} />
            <span className="text-xs font-bold">
              {streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos` : "Comece sua sequência"}
            </span>
          </div>
        </div>

        {/* Versículo do dia */}
        <div>
          <p className="text-[11px] uppercase tracking-wide font-semibold text-amber-50/80 mb-1">
            Versículo do dia
          </p>
          <p className="text-sm sm:text-base font-serif leading-snug line-clamp-3">"{verse.text}"</p>
          <p className="text-xs font-semibold text-amber-50 mt-1.5">
            {verse.book_name} {verse.chapter}:{verse.verse}
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate("/bible")}
          size="sm"
          className="w-full !bg-white !text-orange-600 hover:!bg-amber-50 font-semibold shadow-sm"
        >
          <BookOpen className="h-4 w-4 mr-1.5" />
          {streak > 0 ? "Manter minha sequência" : "Ler e começar minha sequência"}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default DailyHookCard;
