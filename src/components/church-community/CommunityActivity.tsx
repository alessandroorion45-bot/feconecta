import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POST_TYPE_BY_VALUE, CAMPAIGN_EMOJI } from "@/lib/communityRoles";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const sb = supabase as any;

interface ActivityItem {
  key: string;
  emoji: string;
  text: string;
  created_at: string;
}

/**
 * Linha do tempo da comunidade: novos membros, publicações do mural,
 * campanhas e votações, em ordem cronológica.
 */
const CommunityActivity = ({ communityId }: { communityId: string }) => {
  const [items, setItems] = useState<ActivityItem[]>([]);

  const load = useCallback(async () => {
    const [postsRes, campaignsRes, votingsRes, membersRes] = await Promise.allSettled([
      sb.from("community_posts")
        .select("id, type, title, content, user_id, created_at")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })
        .limit(6),
      sb.from("community_campaigns")
        .select("id, name, campaign_type, created_at")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })
        .limit(4),
      sb.from("community_votings")
        .select("id, title, created_at")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("church_community_members")
        .select("user_id, joined_at")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("joined_at", { ascending: false })
        .limit(6),
    ]);

    const posts: any[] = postsRes.status === "fulfilled" ? postsRes.value.data || [] : [];
    const campaigns: any[] = campaignsRes.status === "fulfilled" ? campaignsRes.value.data || [] : [];
    const votings: any[] = votingsRes.status === "fulfilled" ? votingsRes.value.data || [] : [];
    const members: any[] = membersRes.status === "fulfilled" ? (membersRes.value as any).data || [] : [];

    // Nomes dos envolvidos
    const userIds = [...new Set([...posts.map(p => p.user_id), ...members.map(m => m.user_id)])];
    let nameMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles").select("id, full_name").in("id", userIds);
      nameMap = new Map((profiles || []).map(p => [p.id, (p.full_name || "Membro").split(" ")[0]]));
    }

    const merged: ActivityItem[] = [
      ...members.map(m => ({
        key: `member:${m.user_id}:${m.joined_at}`,
        emoji: "🌱",
        text: `${nameMap.get(m.user_id) || "Alguém"} entrou na comunidade`,
        created_at: m.joined_at,
      })),
      ...posts.map(p => {
        const meta = POST_TYPE_BY_VALUE[p.type] || POST_TYPE_BY_VALUE.announcement;
        return {
          key: `post:${p.id}`,
          emoji: meta.emoji,
          text: p.type === "word_of_week"
            ? `Nova Palavra da Semana: "${p.title || ""}"`
            : `${nameMap.get(p.user_id) || "Alguém"} publicou ${meta.label.toLowerCase()}${p.title ? `: "${p.title}"` : ""}`,
          created_at: p.created_at,
        };
      }),
      ...campaigns.map(c => ({
        key: `campaign:${c.id}`,
        emoji: CAMPAIGN_EMOJI[c.campaign_type] || "🔥",
        text: `Campanha iniciada: ${c.name}`,
        created_at: c.created_at,
      })),
      ...votings.map(v => ({
        key: `voting:${v.id}`,
        emoji: "🗳️",
        text: `Nova votação: ${v.title}`,
        created_at: v.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);

    setItems(merged);
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  if (items.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividade da Comunidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.key} className="flex items-start gap-2 text-sm">
              <span className="shrink-0">{item.emoji}</span>
              <span className="flex-1 min-w-0 truncate">{item.text}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityActivity;
