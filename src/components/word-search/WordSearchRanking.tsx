import { memo, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AvatarPro } from '@/components/AvatarPro';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Trophy } from 'lucide-react';

type Scope = 'daily' | 'weekly' | 'monthly' | 'global' | 'church' | 'friends';

interface RankRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_score: number;
}

const SCOPE_LABELS: Record<Scope, string> = {
  daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal',
  global: 'Global', church: 'Igreja', friends: 'Amigos',
};

function scopeStartDate(scope: Scope): string | null {
  const now = new Date();
  if (scope === 'daily') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (scope === 'weekly') {
    const day = now.getDay();
    now.setDate(now.getDate() - day);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (scope === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return null;
}

interface WordSearchRankingProps {
  userId?: string | null;
}

export const WordSearchRanking = memo(({ userId }: WordSearchRankingProps) => {
  const [scope, setScope] = useState<Scope>('global');
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let allowedUserIds: string[] | null = null;

        if (scope === 'friends' && userId) {
          const { data: friendships } = await supabase
            .from('friendships')
            .select('user_id_1, user_id_2')
            .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
          allowedUserIds = [
            userId,
            ...(friendships || []).map(f => (f.user_id_1 === userId ? f.user_id_2 : f.user_id_1)),
          ];
        }

        if (scope === 'church' && userId) {
          const { data: membership } = await supabase
            .from('church_community_members')
            .select('community_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (membership?.community_id) {
            const { data: members } = await supabase
              .from('church_community_members')
              .select('user_id')
              .eq('community_id', membership.community_id)
              .eq('is_active', true);
            allowedUserIds = (members || []).map(m => m.user_id);
          } else {
            allowedUserIds = [];
          }
        }

        let query = (supabase.from('word_search_level_completions' as any) as any)
          .select('user_id, score, completed_at');

        const startDate = scopeStartDate(scope);
        if (startDate) query = query.gte('completed_at', startDate);
        if (allowedUserIds) query = query.in('user_id', allowedUserIds.length > 0 ? allowedUserIds : ['00000000-0000-0000-0000-000000000000']);

        const { data: completions } = await query.limit(2000);

        const totals = new Map<string, number>();
        (completions || []).forEach((c: any) => {
          totals.set(c.user_id, (totals.get(c.user_id) || 0) + (c.score || 0));
        });

        const topIds = Array.from(totals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([id]) => id);

        if (topIds.length === 0) {
          setRows([]);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', topIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        const ranked = topIds
          .map(id => ({
            user_id: id,
            full_name: profileMap.get(id)?.full_name || 'Irmão(ã)',
            avatar_url: profileMap.get(id)?.avatar_url || null,
            total_score: totals.get(id) || 0,
          }));

        setRows(ranked);
      } finally {
        setLoading(false);
      }
    })();
  }, [scope, userId]);

  return (
    <div className="pv-trail-card">
      <h3 className="pv-panel-title mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 pv-text-gold" />
        Ranking
      </h3>

      <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto gap-1 bg-transparent mb-3">
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs pv-ranking-tab">
              {SCOPE_LABELS[s]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={scope} className="mt-0">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin pv-text-gold" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm pv-text-muted py-6">Ninguém pontuou aqui ainda.</p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {rows.map((row, index) => (
                <div key={row.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
                  <span className="w-5 text-center text-xs font-bold pv-text-gold">{index + 1}</span>
                  <AvatarPro src={row.avatar_url} name={row.full_name} userId={row.user_id} size="xs" />
                  <span className="flex-1 min-w-0 truncate text-sm text-white/90">{row.full_name}</span>
                  <span className="text-xs font-bold pv-text-gold">{row.total_score} pts</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

WordSearchRanking.displayName = 'WordSearchRanking';

export default WordSearchRanking;
