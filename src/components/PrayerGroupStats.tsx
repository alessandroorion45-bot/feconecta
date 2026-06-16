import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, CheckCircle2, Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupStats {
  group_id: string;
  total_prayers: number;
  answered_prayers: number;
  total_members: number;
  scheduled_prayers_count: number;
}

interface MemberStats {
  user_id: string;
  prayers_created: number;
  prayers_interceded: number;
  scheduled_prayers_attended: number;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface PrayerGroupStatsProps {
  groupId: string;
}

const PrayerGroupStats = ({ groupId }: PrayerGroupStatsProps) => {
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [topMembers, setTopMembers] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`group-stats-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_group_stats',
          filter: `group_id=eq.${groupId}`
        },
        () => loadStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const loadStats = async () => {
    setLoading(true);
    
    // Load group stats
    const { data: groupStats } = await supabase
      .from('prayer_group_stats')
      .select('*')
      .eq('group_id', groupId)
      .single();

    if (groupStats) {
      setStats(groupStats);
    }

    // Load top members with their profiles
    const { data: memberStats } = await supabase
      .from('prayer_group_member_stats')
      .select('*')
      .eq('group_id', groupId)
      .order('prayers_interceded', { ascending: false })
      .limit(5);

    if (memberStats && memberStats.length > 0) {
      // Fetch profiles for each member
      const userIds = memberStats.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);

      const membersWithProfiles = memberStats.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.id === m.user_id) || {
          full_name: 'Membro',
          avatar_url: null,
          username: 'membro'
        }
      }));

      setTopMembers(membersWithProfiles);
    }

    setLoading(false);
  };

  const getActivityScore = (member: MemberStats) => {
    return member.prayers_created * 3 + member.prayers_interceded * 2 + member.scheduled_prayers_attended * 5;
  };

  const sortedMembers = [...topMembers].sort((a, b) => getActivityScore(b) - getActivityScore(a));

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-16 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const answeredPercentage = stats && stats.total_prayers > 0 
    ? Math.round((stats.answered_prayers / stats.total_prayers) * 100) 
    : 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Estatísticas do Grupo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-primary">
              {stats?.total_prayers || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total de Orações</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-5 w-5" />
              {stats?.answered_prayers || 0}
            </div>
            <div className="text-xs text-muted-foreground">Respondidas</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
              <Users className="h-5 w-5" />
              {stats?.total_members || 0}
            </div>
            <div className="text-xs text-muted-foreground">Membros</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {answeredPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">Taxa de Resposta</div>
          </div>
        </div>

        {/* Top Members */}
        {sortedMembers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Membros Mais Ativos
            </h4>
            <div className="space-y-2">
              {sortedMembers.slice(0, 3).map((member, index) => {
                const score = getActivityScore(member);
                const maxScore = getActivityScore(sortedMembers[0]);
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

                return (
                  <div 
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 && "bg-amber-500 text-white",
                      index === 1 && "bg-gray-400 text-white",
                      index === 2 && "bg-orange-600 text-white"
                    )}>
                      {index === 0 ? <Trophy className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {member.profiles?.full_name || 'Membro'}
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-xs h-5 px-1.5">
                            {member.prayers_interceded} 🙏
                          </Badge>
                          <Badge variant="outline" className="text-xs h-5 px-1.5">
                            {member.scheduled_prayers_attended} 📅
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sortedMembers.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ainda não há atividade registrada</p>
            <p className="text-xs">Comece a orar com o grupo!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrayerGroupStats;
