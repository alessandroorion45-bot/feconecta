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
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

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

/** Galho orgânico em SVG (curvas Bézier), com folhas e flores decorativas */
const Branch = ({ label, emoji, flowers }: { label: string; emoji: string; flowers: number }) => (
  <div className="relative flex items-center justify-center mb-1 select-none" aria-hidden>
    <svg viewBox="0 0 400 28" className="w-full max-w-[520px] h-7" preserveAspectRatio="none">
      <path
        d="M200,26 C150,20 90,24 20,8"
        fill="none" stroke="url(#branchGrad)" strokeWidth="5" strokeLinecap="round"
      />
      <path
        d="M200,26 C250,20 310,24 380,8"
        fill="none" stroke="url(#branchGrad)" strokeWidth="5" strokeLinecap="round"
      />
      <path d="M120,20 C110,14 104,10 96,4" fill="none" stroke="url(#branchGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M280,20 C290,14 296,10 304,4" fill="none" stroke="url(#branchGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(120 72 30 / 0.55)" />
          <stop offset="50%" stopColor="rgb(146 94 42 / 0.75)" />
          <stop offset="100%" stopColor="rgb(120 72 30 / 0.55)" />
        </linearGradient>
      </defs>
    </svg>
    {/* Folhas balançando + flores */}
    <span className="tree-leaf absolute left-[6%] -top-1 text-sm">🍃</span>
    <span className="tree-leaf absolute right-[6%] -top-1 text-sm" style={{ animationDelay: "0.9s" }}>🍃</span>
    {flowers > 0 && <span className="tree-leaf absolute left-[22%] -top-2 text-xs" style={{ animationDelay: "0.4s" }}>🌸</span>}
    {flowers > 1 && <span className="tree-leaf absolute right-[22%] -top-2 text-xs" style={{ animationDelay: "1.3s" }}>🌸</span>}
    <span className="absolute -top-3 bg-background/80 backdrop-blur-sm border border-amber-800/20 rounded-full px-3 py-0.5 text-xs font-medium text-amber-900/80 dark:text-amber-200/80 shadow-sm">
      {emoji} {label}
    </span>
  </div>
);

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

  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; active: boolean }>({
    startX: 0, startY: 0, panX: 0, panY: 0, active: false,
  });
  const firstMatchRef = useRef<HTMLButtonElement | null>(null);
  let firstMatchAssigned = false;

  const load = useCallback(async () => {
    const [membersRes, campaignsRes] = await Promise.all([
      supabase
        .from("church_community_members")
        .select("id, user_id, role, ministries, joined_at")
        .eq("community_id", communityId)
        .eq("is_active", true),
      sb.from("community_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId)
        .eq("is_active", true),
    ]);

    setCampaignCount(campaignsRes?.count || 0);

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

  // Flores surgem conforme a comunidade cresce (1 a cada 3 membros)
  const flowersPerTier = Math.min(Math.floor(members.length / 3), 2);

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
      {/* Animações das folhas (discretas) */}
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
      `}</style>

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
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(1.8, +(z + 0.2).toFixed(1)))} aria-label="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={recenter} aria-label="Voltar ao centro" title="Voltar ao centro">
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* A Árvore */}
      <Card className="overflow-hidden bg-gradient-to-b from-sky-400/10 via-emerald-500/5 to-amber-950/15">
        <CardContent className="p-0">
          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-none min-h-[420px]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="relative mx-auto py-8 px-4 origin-top will-change-transform"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, maxWidth: 900 }}
            >
              {/* Copa frondosa (profundidade suave) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[85%] h-64 -z-0 pointer-events-none" aria-hidden>
                <div className="absolute left-[8%] top-8 w-44 h-32 rounded-full bg-emerald-500/15 blur-2xl" />
                <div className="absolute right-[8%] top-8 w-44 h-32 rounded-full bg-green-500/15 blur-2xl" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-64 h-40 rounded-full bg-emerald-400/20 blur-2xl" />
              </div>

              {/* Sol e copa */}
              <div className="text-center mb-3 select-none relative z-10" aria-hidden>
                <span className="tree-leaf inline-block text-2xl" style={{ animationDelay: "0.2s" }}>🌿</span>
                <span className="inline-block text-3xl mx-2 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]">☀️</span>
                <span className="tree-leaf inline-block text-2xl" style={{ animationDelay: "1.1s" }}>🌿</span>
              </div>

              {/* Tronco detalhado */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-16 bottom-24 w-4 rounded-full -z-0 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.25)]"
                style={{ background: "linear-gradient(to bottom, rgb(146 94 42 / 0.55), rgb(92 55 22 / 0.85))" }}
                aria-hidden
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-24 w-1 h-16 bg-amber-950/20 rounded-full -z-0" aria-hidden />

              {/* Camadas (galhos) */}
              <div className="relative z-10 space-y-7">
                {tiers.map((tier, tierIndex) => (
                  <div key={tier.label} className="relative pt-3">
                    <Branch label={tier.label} emoji={tier.emoji} flowers={flowersPerTier} />

                    {/* Frutos */}
                    <div className="flex flex-wrap justify-center gap-3 mt-1">
                      {tier.members.map((member, i) => {
                        const visible = matches(member);
                        const highlight = isSearching && visible;
                        const info = getRoleInfo(member.role);
                        const assignRef = highlight && !firstMatchAssigned
                          ? (el: HTMLButtonElement | null) => { firstMatchRef.current = el; }
                          : undefined;
                        if (highlight && !firstMatchAssigned) firstMatchAssigned = true;
                        return (
                          <motion.button
                            key={member.id}
                            ref={assignRef}
                            initial={{ scale: 0, opacity: 0, y: -8 }}
                            animate={{ scale: visible ? 1 : 0.7, opacity: visible ? 1 : 0.2, y: 0 }}
                            whileHover={visible ? { scale: 1.12, y: -2 } : undefined}
                            transition={{ delay: Math.min(tierIndex * 0.08 + i * 0.03, 0.7), type: "spring", stiffness: 260, damping: 18 }}
                            onClick={() => setSelected(member)}
                            className="flex flex-col items-center w-[76px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
                            title={`${member.profile?.full_name || "Membro"} — ${info.label}`}
                            aria-label={`${member.profile?.full_name || "Membro"}, ${info.label}`}
                          >
                            <div className={cn(
                              "relative rounded-full ring-2 transition-shadow",
                              member.user_id === userId ? "ring-primary shadow-lg shadow-primary/40" : "ring-emerald-500/60 shadow-md shadow-emerald-900/20",
                              "group-hover:shadow-xl group-hover:shadow-amber-400/30",
                              highlight && "fruit-highlight ring-yellow-400"
                            )}>
                              <UserAvatar
                                src={member.profile?.avatar_url || undefined}
                                fallback={member.profile?.full_name || "?"}
                                size="md"
                              />
                              <span className="absolute -bottom-1 -right-1 text-sm drop-shadow" aria-hidden>{info.emoji}</span>
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
                <div className="text-2xl select-none tree-leaf" aria-hidden>🌱</div>
                <div className="inline-block rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm px-4 py-2 mt-1 shadow-sm">
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
      <p className="text-xs text-muted-foreground text-center -mt-2">
        Arraste a árvore para navegar · use os botões de zoom · 🎯 volta ao centro
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
