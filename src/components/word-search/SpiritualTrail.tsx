import { memo, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sprout, BookOpen, Flame, Trophy } from 'lucide-react';

interface TrailStats {
  totalWords: number;
  themesCompleted: number;
  charactersDiscovered: number;
  spiritualPoints: number;
}

interface SpiritualTrailProps {
  userId?: string | null;
  refreshKey?: number;
}

export const SpiritualTrail = memo(({ userId, refreshKey }: SpiritualTrailProps) => {
  const [stats, setStats] = useState<TrailStats | null>(null);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data } = await (supabase.from('word_search_level_completions' as any) as any)
        .select('theme_key, words_found_count, score')
        .eq('user_id', userId);

      if (!data) return;

      const totalWords = data.reduce((sum: number, r: any) => sum + (r.words_found_count || 0), 0);
      const spiritualPoints = data.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
      const distinctThemes = new Set(data.map((r: any) => r.theme_key).filter(Boolean));

      setStats({
        totalWords,
        themesCompleted: distinctThemes.size,
        charactersDiscovered: distinctThemes.size, // aproximação: 1 personagem central por tema em média
        spiritualPoints,
      });
    })();
  }, [userId, refreshKey]);

  if (!userId || !stats) return null;

  return (
    <div className="pv-trail-card">
      <h3 className="pv-panel-title mb-2">🌟 Sua Trilha Espiritual</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 pv-text-gold shrink-0" />
          <span className="text-white/90">{stats.totalWords} palavras encontradas</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 pv-text-gold shrink-0" />
          <span className="text-white/90">{stats.charactersDiscovered} personagens descobertos</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 pv-text-gold shrink-0" />
          <span className="text-white/90">{stats.themesCompleted} temas concluídos</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 pv-text-gold shrink-0" />
          <span className="text-white/90">{stats.spiritualPoints} pontos espirituais</span>
        </div>
      </div>
    </div>
  );
});

SpiritualTrail.displayName = 'SpiritualTrail';

export default SpiritualTrail;
