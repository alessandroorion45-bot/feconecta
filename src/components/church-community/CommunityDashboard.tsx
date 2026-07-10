import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Crown, Home, TrendingUp, HandHeart, BookOpenCheck, ClipboardCheck, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const sb = supabase as any;

interface Stats {
  members: number;
  leaders: number;
  cells: number;
  avgMembersPerCell: number;
  prayerRequests: number;
  studiesPublished: number;
  activitiesAnswered: number;
  attendanceRate: number | null;
}

interface CommunityDashboardProps {
  communityId: string;
}

const CommunityDashboard = ({ communityId }: CommunityDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const [
      membersRes,
      leadersRes,
      cellsRes,
      prayersRes,
      studiesRes,
      attemptsRes,
      attendanceRes,
    ] = await Promise.all([
      supabase.from("church_community_members").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("is_active", true),
      sb.from("church_leaders").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("is_active", true),
      sb.from("community_cells").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("is_active", true),
      sb.from("community_cell_prayer_requests").select("id", { count: "exact", head: true }).eq("community_id", communityId),
      supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("type", "word_of_week"),
      sb.from("community_quiz_attempts").select("id", { count: "exact", head: true }).eq("community_id", communityId),
      sb.from("community_cell_attendance").select("status").eq("community_id", communityId),
    ]);

    const cellCount = cellsRes.count || 0;
    const memberCount = membersRes.count || 0;
    const attendanceRows: any[] = attendanceRes.data || [];
    const present = attendanceRows.filter(r => r.status === "present").length;
    const absent = attendanceRows.filter(r => r.status === "absent").length;
    const attendanceRate = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : null;

    setStats({
      members: memberCount,
      leaders: leadersRes.count || 0,
      cells: cellCount,
      avgMembersPerCell: cellCount > 0 ? Math.round((memberCount / cellCount) * 10) / 10 : 0,
      prayerRequests: prayersRes.count || 0,
      studiesPublished: studiesRes.count || 0,
      activitiesAnswered: attemptsRes.count || 0,
      attendanceRate,
    });
    setLoading(false);
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !stats) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const cards = [
    { icon: Users, label: "Membros", value: stats.members, color: "text-blue-500" },
    { icon: Crown, label: "Líderes", value: stats.leaders, color: "text-amber-500" },
    { icon: Home, label: "Células", value: stats.cells, color: "text-emerald-500" },
    { icon: TrendingUp, label: "Média de membros/célula", value: stats.avgMembersPerCell, color: "text-teal-500" },
    { icon: HandHeart, label: "Pedidos de oração", value: stats.prayerRequests, color: "text-pink-500" },
    { icon: BookOpenCheck, label: "Estudos publicados", value: stats.studiesPublished, color: "text-purple-500" },
    { icon: ClipboardCheck, label: "Atividades respondidas", value: stats.activitiesAnswered, color: "text-orange-500" },
    { icon: Percent, label: "Presença nas células", value: stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "—", color: "text-sky-500" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">📊 Dashboard da Comunidade</h3>
        <p className="text-xs text-muted-foreground">Indicadores gerais atualizados em tempo real</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
            <Card className="bg-gradient-to-br from-background to-muted/40 h-full">
              <CardContent className="py-4 text-center">
                <Icon className={cn("h-6 w-6 mx-auto mb-2", color)} />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityDashboard;
