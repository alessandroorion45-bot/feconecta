import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Crown, Home, TrendingUp, HandHeart, BookOpenCheck, ClipboardCheck, Percent, Cake } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AvatarPro } from "@/components/AvatarPro";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface Birthday {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  day: number;
}

interface CommunityDashboardProps {
  communityId: string;
}

const CommunityDashboard = ({ communityId }: CommunityDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; presentes: number; ausentes: number }[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

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
      supabase.from("church_community_members").select("user_id", { count: "exact" }).eq("community_id", communityId).eq("is_active", true),
      sb.from("church_leaders").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("is_active", true),
      sb.from("community_cells").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("is_active", true),
      sb.from("community_cell_prayer_requests").select("id", { count: "exact", head: true }).eq("community_id", communityId),
      supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("community_id", communityId).eq("type", "word_of_week"),
      sb.from("community_quiz_attempts").select("id", { count: "exact", head: true }).eq("community_id", communityId),
      sb.from("community_cell_attendance").select("status, meeting_date").eq("community_id", communityId).order("meeting_date", { ascending: false }).limit(500),
    ]);

    const cellCount = cellsRes.count || 0;
    const memberCount = membersRes.count || 0;
    const attendanceRows: any[] = attendanceRes.data || [];
    const present = attendanceRows.filter(r => r.status === "present").length;
    const absent = attendanceRows.filter(r => r.status === "absent").length;
    const attendanceRate = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : null;

    const byDate = new Map<string, { presentes: number; ausentes: number }>();
    attendanceRows.forEach(r => {
      if (r.status !== "present" && r.status !== "absent") return;
      if (!byDate.has(r.meeting_date)) byDate.set(r.meeting_date, { presentes: 0, ausentes: 0 });
      const entry = byDate.get(r.meeting_date)!;
      if (r.status === "present") entry.presentes += 1; else entry.ausentes += 1;
    });
    const dates = [...byDate.keys()].sort().slice(-8);
    setChartData(dates.map(d => ({
      date: format(new Date(d + "T00:00:00"), "dd/MM"),
      ...byDate.get(d)!,
    })));

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

    // Aniversariantes do mês
    const memberIds = [...new Set((membersRes.data || []).map((m: any) => m.user_id))];
    if (memberIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, birth_date").in("id", memberIds);
      const thisMonth = new Date().getMonth();
      const list = (profiles || [])
        .filter((p: any) => p.birth_date && new Date(p.birth_date + "T00:00:00").getMonth() === thisMonth)
        .map((p: any) => ({
          user_id: p.id,
          full_name: p.full_name || "Membro",
          avatar_url: p.avatar_url,
          day: new Date(p.birth_date + "T00:00:00").getDate(),
        }))
        .sort((a: Birthday, b: Birthday) => a.day - b.day);
      setBirthdays(list);
    }

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartData.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2">Presença nas células (últimos encontros)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="presentes" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ausentes" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Cake className="h-4 w-4 text-pink-500" /> Aniversariantes do mês</p>
            {birthdays.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Ninguém faz aniversário este mês.</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {birthdays.map(b => (
                  <div key={b.user_id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2 py-1.5">
                    <AvatarPro src={b.avatar_url} name={b.full_name} size="xs" clickable={false} />
                    <span className="text-sm flex-1 truncate">{b.full_name}</span>
                    <span className="text-xs text-muted-foreground">dia {b.day}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityDashboard;
