import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserAvatar from "@/components/UserAvatar";
import { COMMUNITY_ROLES, getRoleInfo } from "@/lib/communityRoles";
import { MINISTRIES } from "./MinistriesSelector";
import { Search, ZoomIn, ZoomOut, Loader2, Users, Heart, Crown, Sprout, User as UserIcon } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TreeMember {
  id: string;
  user_id: string;
  role: string;
  ministries: string[] | null;
  joined_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface CommunityTreeProps {
  communityId: string;
  userId: string;
}

/**
 * Árvore da Comunidade 🌳
 * Cristo é a raiz, a Palavra é o alimento e cada membro é um fruto.
 * Liderança pastoral no topo, demais membros nos galhos abaixo,
 * organizados automaticamente por função.
 */

// Camadas da árvore, do topo para a base
const TREE_TIERS: { label: string; emoji: string; roles: string[] }[] = [
  { label: "Pastoreio", emoji: "📖", roles: ["pastor", "pastora", "admin"] },
  { label: "Presbitério e Liderança", emoji: "⭐", roles: ["presbitero", "lider_geral", "moderador", "secretario"] },
  { label: "Diaconato", emoji: "🤝", roles: ["diacono", "diaconisa"] },
  {
    label: "Ministérios e Serviço",
    emoji: "🎯",
    roles: ["lider_ministerio", "professor_ebd", "musico", "vocalista", "intercessor", "evangelista", "missionario"],
  },
  { label: "Membros", emoji: "👥", roles: ["member"] },
];

const MINISTRY_NAME = Object.fromEntries(MINISTRIES.map(m => [m.id, m.name.replace("Ministério de ", "")]));

const CommunityTree = ({ communityId, userId }: CommunityTreeProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<TreeMember | null>(null);

  const load = useCallback(async () => {
    const { data: membersData } = await supabase
      .from("church_community_members")
      .select("id, user_id, role, ministries, joined_at")
      .eq("community_id", communityId)
      .eq("is_active", true);

    const list = membersData || [];
    if (list.length) {
      const ids = [...new Set(list.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", ids);
      const map = new Map((profiles || []).map(p => [p.id, p]));
      setMembers(list.map(m => ({ ...m, role: m.role || "member", profile: map.get(m.user_id) })));
    } else {
      setMembers([]);
    }
    setLoading(false);
  }, [communityId]);

  useEffect(() => {
    load();

    // A árvore cresce sozinha quando alguém entra ou muda de função
    const channel = supabase
      .channel(`tree-${communityId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_community_members", filter: `community_id=eq.${communityId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, load]);

  // Busca + filtro
  const matches = useCallback((m: TreeMember) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const roleLabel = getRoleInfo(m.role).label.toLowerCase();
    const ministries = (m.ministries || []).map(id => (MINISTRY_NAME[id] || id).toLowerCase()).join(" ");
    return (
      (m.profile?.full_name || "").toLowerCase().includes(q) ||
      (m.profile?.username || "").toLowerCase().includes(q) ||
      roleLabel.includes(q) ||
      ministries.includes(q)
    );
  }, [search, roleFilter]);

  const tiers = useMemo(() => {
    return TREE_TIERS
      .map(tier => ({
        ...tier,
        members: members.filter(m => tier.roles.includes(m.role)),
      }))
      .filter(tier => tier.members.length > 0);
  }, [members]);

  // Estatísticas
  const stats = useMemo(() => {
    const ministrySet = new Set<string>();
    members.forEach(m => (m.ministries || []).forEach(min => ministrySet.add(min)));
    const leaders = members.filter(m => m.role !== "member").length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = members.filter(m => new Date(m.joined_at) >= monthStart).length;
    return { total: members.length, ministries: ministrySet.size, leaders, newThisMonth };
  }, [members]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, value: stats.total, label: "Frutos (membros)", color: "text-emerald-500" },
          { icon: Heart, value: stats.ministries, label: "Ministérios", color: "text-pink-500" },
          { icon: Crown, value: stats.leaders, label: "Líderes", color: "text-amber-500" },
          { icon: Sprout, value: stats.newThisMonth, label: "Novos no mês", color: "text-green-500" },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="py-3 text-center">
              <Icon className={cn("h-5 w-5 mx-auto mb-1", color)} />
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca, filtro e zoom */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, função ou ministério..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">🌳 Todos</SelectItem>
            {COMMUNITY_ROLES.map(r => (
              <SelectItem key={r.value} value={r.value}>
                <span className="flex items-center gap-2"><span>{r.emoji}</span>{r.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(1.6, +(z + 0.2).toFixed(1)))} aria-label="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* A Árvore */}
      <Card className="overflow-hidden bg-gradient-to-b from-sky-500/5 via-emerald-500/5 to-amber-900/10">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <div
              className="relative mx-auto py-8 px-4 transition-transform origin-top"
              style={{ transform: `scale(${zoom})`, minWidth: 320, maxWidth: 900 }}
            >
              {/* Copa da árvore */}
              <div className="text-center mb-2 text-3xl select-none" aria-hidden>🌿☀️🌿</div>

              {/* Tronco central (decorativo) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-16 bottom-24 w-2.5 rounded-full bg-gradient-to-b from-amber-700/50 to-amber-900/70 -z-0"
                aria-hidden
              />

              {/* Camadas (galhos) */}
              <div className="relative z-10 space-y-6">
                {tiers.map((tier, tierIndex) => (
                  <div key={tier.label} className="relative">
                    {/* Galho */}
                    <div className="flex items-center gap-2 justify-center mb-2" aria-hidden>
                      <div className="h-1 flex-1 max-w-[120px] rounded-full bg-gradient-to-r from-transparent to-amber-800/40" />
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {tier.emoji} {tier.label} 🍃
                      </span>
                      <div className="h-1 flex-1 max-w-[120px] rounded-full bg-gradient-to-l from-transparent to-amber-800/40" />
                    </div>

                    {/* Frutos */}
                    <div className="flex flex-wrap justify-center gap-3">
                      {tier.members.map((member, i) => {
                        const visible = matches(member);
                        const info = getRoleInfo(member.role);
                        return (
                          <motion.button
                            key={member.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: visible ? 1 : 0.75, opacity: visible ? 1 : 0.25 }}
                            transition={{ delay: Math.min(tierIndex * 0.1 + i * 0.03, 0.8), type: "spring", stiffness: 260, damping: 18 }}
                            onClick={() => setSelected(member)}
                            className="flex flex-col items-center w-[76px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
                            title={`${member.profile?.full_name || "Membro"} — ${info.label}`}
                            aria-label={`${member.profile?.full_name || "Membro"}, ${info.label}`}
                          >
                            <div className={cn(
                              "relative rounded-full ring-2 transition-transform group-hover:scale-110",
                              member.user_id === userId ? "ring-primary shadow-lg shadow-primary/30" : "ring-emerald-500/50"
                            )}>
                              <UserAvatar
                                src={member.profile?.avatar_url || undefined}
                                fallback={member.profile?.full_name || "?"}
                                size="md"
                              />
                              <span className="absolute -bottom-1 -right-1 text-sm" aria-hidden>{info.emoji}</span>
                            </div>
                            <span className="text-[10px] font-medium mt-1 truncate w-full text-center">
                              {member.profile?.full_name?.split(" ")[0] || "Membro"}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                              {info.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Raiz */}
              <div className="relative z-10 mt-8 text-center">
                <div className="text-2xl select-none" aria-hidden>🌱</div>
                <div className="inline-block rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 mt-1">
                  <p className="text-sm font-semibold text-primary">✝️ Cristo — a Raiz</p>
                  <p className="text-xs text-muted-foreground italic mt-0.5 max-w-xs">
                    "Eu sou a videira, vós as varas. Quem permanece em mim, e eu nele, esse dá muito fruto." — João 15:5
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  📖 Alimentada pela Palavra de Deus
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartão do membro */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{getRoleInfo(selected.role).emoji}</span>
                  Fruto da Comunidade
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center text-center space-y-3">
                <UserAvatar
                  src={selected.profile?.avatar_url || undefined}
                  fallback={selected.profile?.full_name || "?"}
                  size="xl"
                />
                <div>
                  <p className="font-semibold text-lg">
                    {selected.profile?.full_name || "Membro"}
                    {selected.user_id === userId && <span className="text-primary text-sm ml-1">(você)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">@{selected.profile?.username || "usuario"}</p>
                </div>

                <Badge className="gap-1">
                  {getRoleInfo(selected.role).emoji} {getRoleInfo(selected.role).label}
                </Badge>

                {(selected.ministries?.length || 0) > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {selected.ministries!.map(min => (
                      <Badge key={min} variant="secondary" className="text-xs">
                        {MINISTRY_NAME[min] || min}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>🌱 Na comunidade {formatDistanceToNow(new Date(selected.joined_at), { addSuffix: false, locale: ptBR })}</p>
                  <p>Entrou em {format(new Date(selected.joined_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => navigate(`/profile/${selected.user_id}`)}
                >
                  <UserIcon className="h-4 w-4" />
                  Ver Perfil Completo
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityTree;
