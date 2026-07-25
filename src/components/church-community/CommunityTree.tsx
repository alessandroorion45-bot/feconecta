import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserAvatar from "@/components/UserAvatar";
import { CommunityGraph } from "./CommunityGraph";
import { COMMUNITY_ROLES, getRoleInfo } from "@/lib/communityRoles";
import { MINISTRIES } from "./MinistriesSelector";
import {
  Search, ZoomIn, ZoomOut, Loader2, Users, Heart, Crown, Sprout,
  User as UserIcon, Crosshair, Flame, Trophy, BookOpen,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const sb = supabase as any;

interface TreeMember {
  id: string;
  user_id: string;
  role: string;
  ministries: string[] | null;
  joined_at: string;
  discipler_user_id: string | null;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// Papéis de liderança que podem gerenciar o discipulado dos membros
const LEADER_ROLES = new Set(["admin", "pastor", "pastora", "presbitero", "lider_geral", "secretario"]);

interface MemberExtras {
  achievements: number;
  chapters: number;
  campaigns: number;
}

interface CommunityTreeProps {
  communityId: string;
  userId: string;
}

/**
 * Árvore da Comunidade 🌳 — redesign
 * Cristo é a raiz, a Palavra é o alimento e cada membro é um fruto vivo.
 * Copa frondosa, galhos orgânicos em SVG, folhas balançando, flores que
 * surgem com o crescimento, arrastar/zoom e destaque na busca.
 */

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


// Estrelas e partículas geradas uma única vez (posições estáveis, não
// re-randomizam a cada render). Puramente decorativas.
const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 37.13) % 100,
  y: (i * 53.7) % 92,
  sz: 1 + (i % 3),
  dur: 2.5 + (i % 5),
  delay: (i % 7) * 0.4,
}));

const EMBERS = Array.from({ length: 18 }, (_, i) => ({
  x: 4 + (i * 61.7) % 92,
  sz: 2 + (i % 3),
  dur: 9 + (i % 6),
  delay: (i % 9) * 0.9,
  drift: ((i % 5) - 2) * 14,
  gold: i % 3 !== 0,
}));

const CommunityTree = ({ communityId, userId }: CommunityTreeProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [campaignCount, setCampaignCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<TreeMember | null>(null);
  const [extras, setExtras] = useState<MemberExtras | null>(null);
  const [cellsByLeader, setCellsByLeader] = useState<Record<string, number>>({});

  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; active: boolean }>({
    startX: 0, startY: 0, panX: 0, panY: 0, active: false,
  });
  const firstMatchRef = useRef<HTMLButtonElement | null>(null);
  let firstMatchAssigned = false;

  const load = useCallback(async () => {
    const [membersRes, campaignsRes, cellsRes] = await Promise.all([
      supabase
        .from("church_community_members")
        .select("id, user_id, role, ministries, joined_at, discipler_user_id")
        .eq("community_id", communityId)
        .eq("is_active", true),
      sb.from("community_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId)
        .eq("is_active", true),
      // células lideradas por membro (dado real, para o card)
      sb.from("community_cells")
        .select("leader_user_id")
        .eq("community_id", communityId)
        .eq("is_active", true),
    ]);

    setCampaignCount(campaignsRes?.count || 0);

    // mapa user_id -> nº de células que lidera
    const cellsMap: Record<string, number> = {};
    (cellsRes?.data || []).forEach((c: { leader_user_id: string | null }) => {
      if (c.leader_user_id) cellsMap[c.leader_user_id] = (cellsMap[c.leader_user_id] || 0) + 1;
    });
    setCellsByLeader(cellsMap);

    const list = membersRes.data || [];
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

  // Conquistas/leituras/campanhas do membro selecionado (painel)
  useEffect(() => {
    if (!selected) {
      setExtras(null);
      return;
    }
    (async () => {
      const [ach, reading, checks] = await Promise.all([
        supabase.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", selected.user_id),
        supabase.from("shared_reading_stats").select("total_chapters_completed").eq("user_id", selected.user_id).maybeSingle(),
        sb.from("community_campaign_checkins").select("id", { count: "exact", head: true }).eq("user_id", selected.user_id),
      ]);
      setExtras({
        achievements: ach.count || 0,
        chapters: (reading.data as any)?.total_chapters_completed || 0,
        campaigns: checks?.count || 0,
      });
    })();
  }, [selected]);

  const matches = useCallback((m: TreeMember) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (ministryFilter !== "all" && !(m.ministries || []).includes(ministryFilter)) return false;
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
  }, [search, roleFilter, ministryFilter]);

  const isSearching = search.trim().length > 0 || roleFilter !== "all" || ministryFilter !== "all";

  // Centraliza automaticamente o primeiro resultado da busca
  useEffect(() => {
    if (!isSearching) return;
    const t = setTimeout(() => {
      firstMatchRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 350);
    return () => clearTimeout(t);
  }, [search, roleFilter, ministryFilter, isSearching]);

  const tiers = useMemo(() =>
    TREE_TIERS
      .map(tier => ({ ...tier, members: members.filter(m => tier.roles.includes(m.role)) }))
      .filter(tier => tier.members.length > 0),
  [members]);

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

  // Discipulado real: quantos discípulos cada pessoa tem
  const discipleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach(m => {
      if (m.discipler_user_id) map[m.discipler_user_id] = (map[m.discipler_user_id] || 0) + 1;
    });
    return map;
  }, [members]);

  // O usuário atual pode gerenciar o discipulado? (é líder na comunidade)
  const canManage = useMemo(
    () => members.some(m => m.user_id === userId && LEADER_ROLES.has(m.role)),
    [members, userId],
  );

  // Nome do discipulador (para exibir no painel)
  const nameOf = useCallback(
    (uid: string | null) => (uid ? members.find(m => m.user_id === uid)?.profile?.full_name || null : null),
    [members],
  );

  // Define/atualiza o discipulador de um membro (líderes ou o próprio)
  const setDiscipler = useCallback(async (memberRowId: string, disciplerUserId: string | null) => {
    await sb.from("church_community_members").update({ discipler_user_id: disciplerUserId }).eq("id", memberRowId);
    setSelected(prev => (prev && prev.id === memberRowId ? { ...prev, discipler_user_id: disciplerUserId } : prev));
    load();
  }, [load]);

  // Flores surgem conforme a comunidade cresce (1 a cada 3 membros)

  // Arrastar a árvore (mouse e toque, via pointer events)
  const onPointerDown = (e: React.PointerEvent) => {
    // Não inicia arrasto sobre um fruto (deixa o clique funcionar)
    if ((e.target as HTMLElement).closest("button")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  };
  const onPointerUp = () => { dragRef.current.active = false; };

  const recenter = () => { setPan({ x: 0, y: 0 }); setZoom(1); };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Animações das folhas (discretas) + atmosfera cinematográfica */}
      <style>{`
        @keyframes treeLeafSway {
          0%, 100% { transform: rotate(-6deg) translateY(0); }
          50% { transform: rotate(8deg) translateY(-2px); }
        }
        .tree-leaf { display: inline-block; animation: treeLeafSway 3.5s ease-in-out infinite; transform-origin: bottom center; }
        @keyframes fruitPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgb(234 179 8 / 0.55); }
          50% { box-shadow: 0 0 0 7px rgb(234 179 8 / 0); }
        }
        .fruit-highlight { animation: fruitPulse 1.6s ease-out infinite; border-radius: 9999px; }

        /* Luz divina descendo do topo — respira, nunca pisca */
        @keyframes divineBreath {
          0%, 100% { opacity: 0.35; transform: translateX(-50%) scaleY(1); }
          50% { opacity: 0.6; transform: translateX(-50%) scaleY(1.05); }
        }
        .divine-light { animation: divineBreath 6s ease-in-out infinite; }

        /* Glow geral respirando */
        @keyframes auraBreath {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .aura-breath { animation: auraBreath 6s ease-in-out infinite; }

        /* Partículas de luz subindo lentamente (poeira dourada / vagalumes) */
        @keyframes emberFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-260px) translateX(var(--drift, 12px)); opacity: 0; }
        }
        .tree-ember { position: absolute; border-radius: 9999px; animation: emberFloat linear infinite; will-change: transform, opacity; }

        /* Estrelas piscando de leve ao fundo */
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.9; }
        }
        .tree-star { position: absolute; border-radius: 9999px; background: #fff; animation: starTwinkle ease-in-out infinite; }

        /* Raízes pulsando de leve */
        @keyframes rootPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
        .root-glow { animation: rootPulse 5s ease-in-out infinite; }

        /* Card do membro flutuando de leve */
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        /* Luz correndo pela coluna central (a vida subindo de Cristo) */
        @keyframes spineFlow {
          0% { top: 100%; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { top: 0%; opacity: 0; }
        }
        .spine-flow { animation: spineFlow 3.4s linear infinite; }
      `}</style>

      {/* Título — A Videira Viva */}
      <div className="text-center mb-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,215,106,0.35)]">
          🍇 A Videira Viva
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Toda a vida flui de Cristo, a Raiz — cada membro é um ramo do Reino
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: Users, value: stats.total, label: "Frutos", color: "text-emerald-500" },
          { icon: Heart, value: stats.ministries, label: "Ministérios", color: "text-pink-500" },
          { icon: Crown, value: stats.leaders, label: "Líderes", color: "text-amber-500" },
          { icon: Sprout, value: stats.newThisMonth, label: "Novos no mês", color: "text-green-500" },
          { icon: Flame, value: campaignCount, label: "Campanhas", color: "text-orange-500" },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label} className="bg-gradient-to-br from-background to-muted/40">
            <CardContent className="py-3 text-center">
              <Icon className={cn("h-5 w-5 mx-auto mb-1", color)} />
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca, filtros, zoom e centralizar */}
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, função ou ministério..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">🌳 Funções</SelectItem>
              {COMMUNITY_ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  <span className="flex items-center gap-2"><span>{r.emoji}</span>{r.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ministryFilter} onValueChange={setMinistryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">🌿 Ministérios</SelectItem>
              {MINISTRIES.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2"><span>{m.emoji}</span>{MINISTRY_NAME[m.id]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grafo hierárquico do discipulado (React Flow + auto-layout) */}
      <div className="rounded-lg border border-white/10 shadow-2xl overflow-hidden">
        <CommunityGraph
          members={members}
          userId={userId}
          discipleCounts={discipleCounts}
          cellsByLeader={cellsByLeader}
          matches={matches}
          isSearching={isSearching}
          onSelect={setSelected}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center -mt-1">
        🖱️ Arraste para navegar · roda do mouse ou botões pra zoom · clique num card pra ver o perfil
      </p>

      {/* Painel do membro */}
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

                {/* Participação na plataforma */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="rounded-lg bg-muted/60 py-2">
                    <Trophy className="h-4 w-4 mx-auto text-yellow-500 mb-0.5" />
                    <div className="text-sm font-bold">{extras?.achievements ?? "…"}</div>
                    <div className="text-[10px] text-muted-foreground">Conquistas</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 py-2">
                    <BookOpen className="h-4 w-4 mx-auto text-emerald-500 mb-0.5" />
                    <div className="text-sm font-bold">{extras?.chapters ?? "…"}</div>
                    <div className="text-[10px] text-muted-foreground">Capítulos</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 py-2">
                    <Flame className="h-4 w-4 mx-auto text-orange-500 mb-0.5" />
                    <div className="text-sm font-bold">{extras?.campaigns ?? "…"}</div>
                    <div className="text-[10px] text-muted-foreground">Check-ins</div>
                  </div>
                </div>

                {/* Discipulado */}
                <div className="w-full rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-left space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> Discipulado
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {discipleCounts[selected.user_id] || 0} discípulo{(discipleCounts[selected.user_id] || 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discipulado por:{" "}
                    <span className="font-medium text-foreground">{nameOf(selected.discipler_user_id) || "— ninguém definido"}</span>
                  </p>
                  {(canManage || selected.user_id === userId) && (
                    <Select
                      value={selected.discipler_user_id || "none"}
                      onValueChange={(v) => setDiscipler(selected.id, v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Definir discipulador" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="none">— Sem discipulador</SelectItem>
                        {members
                          .filter(m => m.user_id !== selected.user_id)
                          .map(m => (
                            <SelectItem key={m.id} value={m.user_id}>
                              {getRoleInfo(m.role).emoji} {m.profile?.full_name || "Membro"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

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
