import { useMemo, useEffect, memo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import UserAvatar from "@/components/UserAvatar";
import { getRoleInfo } from "@/lib/communityRoles";

// ============================================================
// Grafo hierárquico do discipulado — direção artística premium.
// Estrutura/lógica intactas (React Flow + dagre). Só refinamento
// visual: cards-relíquia, arestas de luz, Cristo-altar, fundo com
// profundidade e Árvore da Vida sutil atrás.
// ============================================================

export interface GraphMember {
  id: string;
  user_id: string;
  role: string;
  ministries: string[] | null;
  discipler_user_id: string | null;
  profile?: { full_name: string; avatar_url: string | null };
}

interface CommunityGraphProps {
  members: GraphMember[];
  userId: string;
  discipleCounts: Record<string, number>;
  cellsByLeader: Record<string, number>;
  matches: (m: GraphMember) => boolean;
  isSearching: boolean;
  onSelect: (m: GraphMember) => void;
  /** id (linha) do membro em foco — acende só o ramo dele, esmaece o resto */
  focusId?: string | null;
}

// Cor própria por cargo (nobreza cresce com a hierarquia)
const ROLE_COLOR: Record<string, string> = {
  admin: "255,215,106",
  pastor: "255,215,106",
  pastora: "255,215,106",
  lider_geral: "251,191,36",
  presbitero: "125,211,252",
  diacono: "74,222,128",
  diaconisa: "74,222,128",
  lider_ministerio: "248,113,113",
  professor_ebd: "168,120,255",
  musico: "168,120,255",
  vocalista: "168,120,255",
  intercessor: "168,120,255",
  evangelista: "168,120,255",
  missionario: "168,120,255",
  secretario: "148,163,184",
  moderador: "148,163,184",
  moderator: "148,163,184",
  member: "203,213,225",
  visitor: "148,163,184",
};
const roleColor = (r: string) => ROLE_COLOR[r] || "203,213,225";
const NOBLE = new Set(["admin", "pastor", "pastora", "lider_geral"]);

const NODE_W = 194;
const NODE_H = 122;

// -------- Nó da Raiz (Cristo — altar de luz) --------
const RootNode = memo(({ data }: NodeProps) => (
  <div className="relative transition-opacity duration-300" style={{ width: NODE_W, opacity: (data as any)?.dim ? 0.45 : 1 }}>
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    {/* halo giratório + feixe de luz vindo do céu */}
    <div className="cg-halo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none" aria-hidden
      style={{ background: "conic-gradient(from 0deg, rgba(255,215,106,0), rgba(255,215,106,0.35), rgba(255,215,106,0), rgba(255,215,106,0.25), rgba(255,215,106,0))", filter: "blur(6px)" }} />
    <div className="cg-breath absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pointer-events-none" aria-hidden
      style={{ background: "radial-gradient(circle, rgba(255,236,180,0.55), transparent 70%)" }} />
    <div
      className="relative rounded-2xl px-5 py-3.5 text-center"
      style={{
        background: "linear-gradient(160deg, rgba(40,28,10,0.95), rgba(14,9,3,0.98))",
        border: "1.5px solid rgba(255,215,106,0.7)",
        boxShadow: "0 0 34px rgba(255,215,106,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className="text-2xl drop-shadow-[0_0_12px_rgba(255,215,106,1)]">✝️</div>
      <div className="text-sm font-extrabold text-amber-200 mt-0.5 tracking-wide" style={{ textShadow: "0 0 12px rgba(255,215,106,0.6)" }}>Cristo — A Raiz</div>
      <div className="text-[10px] text-amber-100/70 italic mt-0.5">"Eu sou a videira" · João 15:5</div>
    </div>
  </div>
));
RootNode.displayName = "RootNode";

// -------- Nó do membro (card-relíquia) --------
type MemberNodeData = {
  member: GraphMember;
  disciples: number;
  ministries: number;
  cells: number;
  isSelf: boolean;
  dim: boolean;
  highlight: boolean;
  onOpen: () => void;
};

const MemberNode = memo(({ data }: NodeProps) => {
  const d = data as unknown as MemberNodeData;
  const info = getRoleInfo(d.member.role);
  const c = roleColor(d.member.role);
  const noble = NOBLE.has(d.member.role);
  return (
    <div
      onClick={d.onOpen}
      className="cg-card group relative rounded-2xl p-[1.5px] cursor-pointer transition-[transform,opacity] duration-300 hover:-translate-y-1.5 hover:scale-[1.03]"
      style={{
        width: NODE_W,
        opacity: d.dim ? 0.42 : 1,
        background: d.highlight
          ? "linear-gradient(135deg,#facc15,#f59e0b)"
          : `linear-gradient(135deg, rgba(${c},0.9), rgba(${c},0.2))`,
        boxShadow: d.highlight ? "0 0 26px rgba(250,204,21,0.7)" : `0 10px 30px -8px rgba(0,0,0,0.7), 0 0 ${noble ? 26 : 16}px rgba(${c},${noble ? 0.4 : 0.25})`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      {/* borda dourada percorrendo no hover */}
      <span className="cg-sweep absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none" aria-hidden />
      <div
        className="relative rounded-2xl px-3 pt-3.5 pb-3 flex flex-col items-center text-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(18,28,52,0.92), rgba(7,13,28,0.96))", backdropFilter: "blur(8px)" }}
      >
        {/* reflexo superior + coroa de nobreza */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />
        {noble && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[11px]" aria-hidden style={{ filter: "drop-shadow(0 0 5px rgba(255,215,106,0.9))" }}>👑</div>}
        {/* avatar com anel duplo + halo */}
        <div className="relative mt-0.5">
          <span className="cg-breath absolute -inset-2 rounded-full blur-md pointer-events-none" style={{ background: `radial-gradient(circle, rgba(${c},0.55), transparent 70%)` }} aria-hidden />
          <span className="absolute -inset-[3px] rounded-full" style={{ border: `1px solid rgba(${c},0.35)` }} aria-hidden />
          <div className="relative rounded-full ring-2" style={{ borderColor: `rgb(${c})`, boxShadow: `0 0 0 2px rgba(${c},0.55), 0 0 14px rgba(${c},0.6)` }}>
            <UserAvatar src={d.member.profile?.avatar_url || undefined} fallback={d.member.profile?.full_name || "?"} size="md" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-sm drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]" aria-hidden>{info.emoji}</span>
        </div>
        <span className="text-[12.5px] font-bold mt-2 leading-tight text-white line-clamp-2 tracking-wide" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
          {d.member.profile?.full_name || "Membro"}
        </span>
        <span className="text-[10px] font-semibold leading-tight mt-0.5 tracking-wide" style={{ color: `rgb(${c})`, textShadow: `0 0 8px rgba(${c},0.5)` }}>{info.label}</span>
        {(d.disciples > 0 || d.ministries > 0 || d.cells > 0) && (
          <div className="flex flex-wrap justify-center gap-1 mt-1.5">
            {d.disciples > 0 && <span className="rounded-full bg-amber-500/12 border border-amber-400/35 px-1.5 py-0.5 text-[8px] text-amber-200">👥 {d.disciples}</span>}
            {d.ministries > 0 && <span className="rounded-full bg-emerald-500/12 border border-emerald-400/30 px-1.5 py-0.5 text-[8px] text-emerald-200">🌿 {d.ministries}</span>}
            {d.cells > 0 && <span className="rounded-full bg-sky-500/12 border border-sky-400/30 px-1.5 py-0.5 text-[8px] text-sky-200">🏠 {d.cells}</span>}
          </div>
        )}
      </div>
    </div>
  );
});
MemberNode.displayName = "MemberNode";

// -------- Aresta de luz (galho dourado com partículas caminhando) --------
const GoldEdge = memo(({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) => {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const dim = (data as any)?.dim;
  const lit = (data as any)?.lit; // aresta no ramo em foco — mais intensa
  const o = dim ? 0.22 : 1;
  return (
    <g style={{ opacity: o, transition: "opacity .35s ease" }}>
      {/* brilho difuso */}
      <BaseEdge path={path} style={{ stroke: `rgba(255,215,106,${lit ? 0.5 : 0.3})`, strokeWidth: lit ? 8 : 6, filter: "blur(2px)" }} />
      {/* fio central */}
      <BaseEdge path={path} style={{ stroke: `rgba(255,229,160,${lit ? 1 : 0.85})`, strokeWidth: lit ? 2.2 : 1.6 }} />
      {/* partículas caminhando em direção ao discípulo */}
      <path d={path} fill="none" stroke="#fff6d8" strokeWidth={lit ? 3 : 2.4} strokeLinecap="round" strokeDasharray="1 22" className="cg-flow" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,106,0.95))" }} />
    </g>
  );
});
GoldEdge.displayName = "GoldEdge";

const nodeTypes = { member: MemberNode, root: RootNode };
const edgeTypes = { gold: GoldEdge };

// -------- Layout automático (dagre) --------
const layout = (nodes: Node[], edges: Edge[]): Node[] => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 84, marginx: 60, marginy: 60 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: n.type === "root" ? 96 : NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } };
  });
};

const ROOT_ID = "__root__";

// Estrelas/poeira do fundo (posições estáveis)
const STARS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 47.3) % 100, y: (i * 71.9) % 100, sz: 1 + (i % 3), dur: 3 + (i % 5), delay: (i % 8) * 0.5 }));

const CommunityGraphInner = ({ members, userId, discipleCounts, cellsByLeader, matches, isSearching, onSelect, focusId }: CommunityGraphProps) => {
  const { rawNodes, rawEdges } = useMemo(() => {
    const ids = new Set(members.map((m) => m.user_id));
    const byUser = new Map(members.map((m) => [m.user_id, m]));
    const childrenByUser = new Map<string, GraphMember[]>();
    members.forEach((m) => {
      const p = m.discipler_user_id && ids.has(m.discipler_user_id) ? m.discipler_user_id : null;
      if (p) childrenByUser.set(p, [...(childrenByUser.get(p) || []), m]);
    });

    // Conjunto do ramo em foco: o membro + caminho até Cristo + descendentes.
    // Nunca esconde a árvore — só acende o ramo e esmaece o resto.
    const focusMember = focusId ? members.find((m) => m.id === focusId) : null;
    const focusSet = new Set<string>();
    if (focusMember) {
      focusSet.add(focusMember.id);
      // sobe até a Raiz
      let cur: GraphMember | undefined = focusMember;
      const guard = new Set<string>();
      while (cur && !guard.has(cur.user_id)) {
        guard.add(cur.user_id);
        const disc = cur.discipler_user_id && ids.has(cur.discipler_user_id) ? byUser.get(cur.discipler_user_id) : undefined;
        if (disc) { focusSet.add(disc.id); cur = disc; } else { focusSet.add(ROOT_ID); cur = undefined; }
      }
      // desce por todos os discípulos
      const stack = [...(childrenByUser.get(focusMember.user_id) || [])];
      const seen = new Set<string>();
      while (stack.length) {
        const c = stack.pop()!;
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        focusSet.add(c.id);
        (childrenByUser.get(c.user_id) || []).forEach((g) => stack.push(g));
      }
    }
    const focusActive = focusSet.size > 0;

    const rn: Node[] = [{
      id: ROOT_ID, type: "root", position: { x: 0, y: 0 },
      data: { dim: focusActive && !focusSet.has(ROOT_ID) },
    }];
    const re: Edge[] = [];
    members.forEach((m) => {
      const visible = matches(m);
      const inFocus = focusSet.has(m.id);
      rn.push({
        id: m.id,
        type: "member",
        position: { x: 0, y: 0 },
        data: {
          member: m,
          disciples: discipleCounts[m.user_id] || 0,
          ministries: m.ministries?.length || 0,
          cells: cellsByLeader[m.user_id] || 0,
          isSelf: m.user_id === userId,
          dim: (isSearching && !visible) || (focusActive && !inFocus),
          highlight: (isSearching && visible) || m.id === focusId,
          onOpen: () => onSelect(m),
        },
      });
      const parentUser = m.discipler_user_id && ids.has(m.discipler_user_id) ? m.discipler_user_id : null;
      const parentNode = parentUser ? members.find((x) => x.user_id === parentUser)?.id : ROOT_ID;
      const pid = parentNode || ROOT_ID;
      const lit = focusActive && focusSet.has(m.id) && focusSet.has(pid);
      re.push({
        id: `e-${pid}-${m.id}`, source: pid, target: m.id, type: "gold",
        data: { dim: focusActive && !lit, lit },
      });
    });
    return { rawNodes: rn, rawEdges: re };
  }, [members, userId, discipleCounts, cellsByLeader, matches, isSearching, onSelect, focusId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(layout(rawNodes, rawEdges));
    setEdges(rawEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  return (
    <div className="relative h-[580px] w-full rounded-lg overflow-hidden" style={{ background: "radial-gradient(120% 90% at 50% 100%, #12294a 0%, #0a1a34 30%, #060f24 60%, #030812 100%)" }}>
      <style>{`
        @keyframes cgFlow { to { stroke-dashoffset: -230; } }
        .cg-flow { animation: cgFlow 3.2s linear infinite; }
        @keyframes cgBreath { 0%,100% { opacity:.55; transform:scale(1);} 50% { opacity:.9; transform:scale(1.08);} }
        .cg-breath { animation: cgBreath 5s ease-in-out infinite; }
        @keyframes cgHalo { to { transform: translate(-50%,-50%) rotate(360deg);} }
        .cg-halo { animation: cgHalo 18s linear infinite; }
        @keyframes cgStar { 0%,100%{opacity:.25} 50%{opacity:.95} }
        .cg-star { position:absolute; border-radius:9999px; background:#fff; animation: cgStar ease-in-out infinite; }
        @keyframes cgSweepK { 0%{background-position:-160% 0} 100%{background-position:260% 0} }
        .cg-sweep { background:linear-gradient(105deg,transparent 40%,rgba(255,215,106,0.5) 50%,transparent 60%); background-size:220% 100%; animation:cgSweepK 1.3s ease-in-out infinite; mix-blend-mode:screen; }
      `}</style>

      {/* Camadas de fundo: névoa, estrelas, Árvore da Vida sutil, vinheta */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="cg-breath absolute top-[10%] left-[15%] w-72 h-72 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(56,120,220,0.25), transparent 70%)" }} />
        <div className="cg-breath absolute bottom-0 left-1/2 -translate-x-1/2 w-[34rem] h-72 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255,200,120,0.16), transparent 70%)", animationDelay: "2s" }} />
        {STARS.map((s, i) => (
          <span key={i} className="cg-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.sz, height: s.sz, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
        ))}
        {/* Árvore da Vida ancestral (esculpida em luz, muito sutil) */}
        <svg className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[92%] w-[70%] opacity-[0.10]" viewBox="0 0 400 500" preserveAspectRatio="xMidYMax meet">
          <g fill="none" stroke="rgba(255,215,106,0.9)" strokeWidth="2" strokeLinecap="round">
            <path d="M200,500 C200,420 200,360 200,300" />
            <path d="M200,320 C150,280 110,250 70,210 M70,210 C50,190 40,170 34,150" />
            <path d="M200,320 C250,280 290,250 330,210 M330,210 C350,190 360,170 366,150" />
            <path d="M200,260 C170,230 140,210 110,180 M200,260 C230,230 260,210 290,180" />
            <path d="M200,300 C195,240 190,200 175,150 M200,300 C205,240 210,200 225,150" />
          </g>
        </svg>
        {/* vinheta */}
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 160px 40px rgba(3,8,18,0.85)" }} />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.15}
        maxZoom={2.2}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        nodesDraggable={false}
        style={{ background: "transparent" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={30} size={1} color="rgba(255,215,106,0.10)" />
        <Controls showInteractive={false} className="!bg-white/10 !border !border-amber-300/25 backdrop-blur-md rounded-lg overflow-hidden [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-amber-100 [&>button:hover]:!bg-amber-400/20" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.type === "root" ? "#ffd76a" : `rgb(${roleColor((n.data as any)?.member?.role || "member")})`)}
          nodeStrokeColor="rgba(255,215,106,0.6)"
          nodeBorderRadius={6}
          maskColor="rgba(3,8,18,0.72)"
          style={{ background: "rgba(10,24,48,0.75)", border: "1px solid rgba(255,215,106,0.35)", borderRadius: 10, boxShadow: "0 0 18px rgba(255,215,106,0.2)" }}
        />
      </ReactFlow>
    </div>
  );
};

export const CommunityGraph = memo(CommunityGraphInner);
export default CommunityGraph;
