import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarPro } from "@/components/AvatarPro";
import {
  Loader2, Users, Settings, Phone, MessageCircle, Mail, BookOpen,
  MapPin, Calendar, Crown, UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LEADER_LEVELS, getLeaderRoleInfo } from "@/lib/leaderRoles";

const sb = supabase as any;

interface Leader {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
  ministry: string | null;
  assumed_date: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  favorite_verse: string | null;
  area_of_activity: string | null;
  hierarchy_level: number;
  user_id: string | null;
}

interface CommunityLeadersProps {
  communityId: string;
  canManage: boolean;
  onManage: () => void;
}

const digitsOnly = (v: string) => v.replace(/\D/g, "");

const LeaderCard = ({ leader, onClick, index }: { leader: Leader; onClick: () => void; index: number }) => {
  const info = getLeaderRoleInfo(leader.role, leader.hierarchy_level);
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      onClick={onClick}
      className="text-left w-full focus:outline-none"
    >
      <Card className="h-full border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-background via-background to-amber-50/40 dark:to-amber-950/20 backdrop-blur-sm hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
        <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
          <div className="relative">
            <AvatarPro src={leader.photo_url} name={leader.name} size="lg" clickable={false} />
            <span className="absolute -bottom-1 -right-1 text-base drop-shadow" aria-hidden>{info.emoji}</span>
          </div>
          <p className="font-semibold text-sm leading-tight truncate w-full">{leader.name}</p>
          <Badge variant="secondary" className="text-[10px] font-normal">{leader.role}</Badge>
          {leader.ministry && (
            <p className="text-[10px] text-muted-foreground truncate w-full">{leader.ministry}</p>
          )}
        </CardContent>
      </Card>
    </motion.button>
  );
};

const CommunityLeaders = ({ communityId, canManage, onManage }: CommunityLeadersProps) => {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Leader | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb
      .from("church_leaders")
      .select("*")
      .eq("community_id", communityId)
      .eq("is_active", true)
      .order("hierarchy_level", { ascending: true })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    setLeaders(data || []);
    setLoading(false);
  }, [communityId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`leaders-${communityId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_leaders", filter: `community_id=eq.${communityId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [communityId, load]);

  const tiers = useMemo(() =>
    LEADER_LEVELS
      .map(lvl => ({ ...lvl, leaders: leaders.filter(l => (l.hierarchy_level || 5) === lvl.level) }))
      .filter(t => t.leaders.length > 0),
  [leaders]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center space-y-3">
          <Crown className="h-10 w-10 mx-auto text-amber-400" />
          <p className="text-muted-foreground">Nenhum líder cadastrado ainda.</p>
          {canManage && (
            <Button onClick={onManage} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Users className="h-4 w-4 mr-2" />
              Cadastrar Líderes
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Organograma de Liderança
          </h3>
          <p className="text-xs text-muted-foreground">{leaders.length} líder{leaders.length !== 1 ? "es" : ""} cadastrado{leaders.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" onClick={onManage} className="gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar Líderes
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {tiers.map((tier, tierIndex) => (
          <div key={tier.level} className="relative">
            {tierIndex > 0 && (
              <div className="absolute left-1/2 -top-4 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-amber-300/60 to-transparent dark:from-amber-700/60" aria-hidden />
            )}
            <div className="flex items-center justify-center mb-3">
              <span className="text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 rounded-full px-3 py-1">
                Nível {tier.level} · {tier.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tier.leaders.map((leader, i) => (
                <LeaderCard key={leader.id} leader={leader} index={i} onClick={() => setSelected(leader)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detalhe do líder */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{getLeaderRoleInfo(selected.role, selected.hierarchy_level).emoji}</span>
                  {selected.role}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center text-center space-y-3">
                <AvatarPro src={selected.photo_url} name={selected.name} size="xl" clickable={false} />
                <p className="font-semibold text-lg">{selected.name}</p>

                {selected.ministry && (
                  <Badge variant="secondary" className="gap-1">{selected.ministry}</Badge>
                )}

                {selected.area_of_activity && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {selected.area_of_activity}
                  </p>
                )}

                {selected.assumed_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Desde {format(new Date(selected.assumed_date + "T00:00:00"), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}

                {selected.bio && (
                  <p className="text-sm text-muted-foreground italic">{selected.bio}</p>
                )}

                {selected.favorite_verse && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex items-start gap-2 text-left">
                    <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/90 italic">{selected.favorite_verse}</p>
                  </div>
                )}

                {(selected.phone || selected.whatsapp || selected.email) && (
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {selected.phone && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={`tel:${digitsOnly(selected.phone)}`}>
                          <Phone className="h-3.5 w-3.5" /> Ligar
                        </a>
                      </Button>
                    )}
                    {selected.whatsapp && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={`https://wa.me/${digitsOnly(selected.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    {selected.email && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={`mailto:${selected.email}`}>
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {selected.user_id && (
                  <Button className="w-full gap-2" onClick={() => navigate(`/profile/${selected.user_id}`)}>
                    <UserIcon className="h-4 w-4" />
                    Ver Perfil Completo
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityLeaders;
