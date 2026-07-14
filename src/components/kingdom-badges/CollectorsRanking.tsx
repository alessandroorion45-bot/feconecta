import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AvatarPro } from "@/components/AvatarPro";
import { Crown } from "lucide-react";

interface Collector {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  count: number;
}

const MEDAL = ["🥇", "🥈", "🥉"];

const CollectorsRanking = () => {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userBadgeRows } = await supabase.from("user_badges").select("user_id");
      const counts = new Map<string, number>();
      (userBadgeRows || []).forEach((row: { user_id: string }) => {
        counts.set(row.user_id, (counts.get(row.user_id) || 0) + 1);
      });

      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", topIds);

      const merged = topIds
        .map((id) => {
          const p = profiles?.find((pr) => pr.id === id);
          return { user_id: id, full_name: p?.full_name || "Usuário", avatar_url: p?.avatar_url || null, count: counts.get(id) || 0 };
        })
        .sort((a, b) => b.count - a.count);

      setCollectors(merged);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || collectors.length === 0) return null;

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-5 w-5 text-amber-500" />
          Top Colecionadores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {collectors.map((c, i) => (
          <div key={c.user_id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{MEDAL[i] || i + 1}</span>
            <AvatarPro src={c.avatar_url} name={c.full_name} userId={c.user_id} size="sm" />
            <span className="flex-1 text-sm font-medium truncate">{c.full_name}</span>
            <span className="text-xs text-muted-foreground">{c.count} selo{c.count !== 1 ? "s" : ""}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CollectorsRanking;
