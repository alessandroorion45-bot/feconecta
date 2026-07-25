import { useMemo, useEffect, useRef, memo } from "react";
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

// -------- Campo estelar (canvas leve — galáxia girando + parallax) --------
// Só a camada de estrelas usa canvas; nebulosa/gradiente/vinheta ficam em CSS.
// ~240 estrelas, um requestAnimationFrame simples, roda atrás do React Flow
// com pointer-events: none. Sem lib de partículas.
const StarField = memo(() => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;
    if (!ctx || !parent) return;

    let raf = 0;
    let W = 0, H = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    type Star = { ang: number; dist: number; r: number; layer: number; base: number; ph: number; sp: number; tint: string };
    let stars: Star[] = [];

    const build = () => {
      const count = Math.min(240, Math.max(90, Math.round((W * H) / 9000)));
      stars = Array.from({ length: count }, () => {
        const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.78 ? 1 : 2;
        const hue = Math.random();
        return {
          ang: Math.random() * Math.PI * 2,
          dist: Math.pow(Math.random(), 0.62) * 0.74,
          r: layer === 2 ? 1.3 + Math.random() * 1.1 : layer === 1 ? 0.8 + Math.random() * 0.6 : 0.4 + Math.random() * 0.5,
          layer,
          base: 0.35 + Math.random() * 0.5,
          ph: Math.random() * Math.PI * 2,
          sp: 0.5 + Math.random() * 1.6,
          tint: hue > 0.86 ? "255,224,158" : hue > 0.62 ? "197,216,255" : "255,255,255",
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = parent.clientWidth; H = parent.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      mouse.tx = (e.clientX - rect.left) / rect.width - 0.5;
      mouse.ty = (e.clientY - rect.top) / rect.height - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const t0 = performance.now();
    const render = (now: number) => {
      const t = (now - t0) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.4, half = Math.hypot(W, H) / 2;
      for (const s of stars) {
        const depth = s.layer + 1;
        const a = s.ang + t * 0.011 * depth;          // rotação lenta da galáxia (camadas em ritmos diferentes)
        const px = cx + Math.cos(a) * s.dist * half - mouse.x * depth * 16;
        const py = cy + Math.sin(a) * s.dist * half - mouse.y * depth * 16;
        const tw = s.base * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
        if (s.layer === 2) { ctx.shadowColor = `rgba(${s.tint},0.85)`; ctx.shadowBlur = 6; } else { ctx.shadowBlur = 0; }
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.tint},${tw})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }} aria-hidden />;
});
StarField.displayName = "StarField";

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
    <div className="relative h-[580px] w-full rounded-lg overflow-hidden" style={{ background: "radial-gradient(130% 100% at 50% 32%, #16305a 0%, #0c1c3a 26%, #060f26 52%, #03081a 78%, #01030c 100%)" }}>
      <style>{`
        @keyframes cgFlow { to { stroke-dashoffset: -230; } }
        .cg-flow { animation: cgFlow 3.2s linear infinite; }
        @keyframes cgBreath { 0%,100% { opacity:.55; transform:scale(1);} 50% { opacity:.9; transform:scale(1.08);} }
        .cg-breath { animation: cgBreath 5s ease-in-out infinite; }
        @keyframes cgHalo { to { transform: translate(-50%,-50%) rotate(360deg);} }
        .cg-halo { animation: cgHalo 18s linear infinite; }
        @keyframes cgSweepK { 0%{background-position:-160% 0} 100%{background-position:260% 0} }
        .cg-sweep { background:linear-gradient(105deg,transparent 40%,rgba(255,215,106,0.5) 50%,transparent 60%); background-size:220% 100%; animation:cgSweepK 1.3s ease-in-out infinite; mix-blend-mode:screen; }
        @keyframes cgNebula { 0%,100%{opacity:.5; transform:scale(1) translateZ(0);} 50%{opacity:.8; transform:scale(1.08);} }
        .cg-nebula { animation: cgNebula 11s ease-in-out infinite; mix-blend-mode:screen; }
      `}</style>

      {/* Camadas de fundo: nebulosa (CSS) + campo estelar (canvas) + brilho da Raiz + vinheta.
          Sem o antigo SVG de "galho" — só profundidade galáctica sóbria. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* nebulosas discretas nos cantos (roxo/magenta/azul), blur + screen */}
        <div className="cg-nebula absolute -top-16 -left-16 w-[26rem] h-[26rem] rounded-full blur-[70px]" style={{ background: "radial-gradient(circle, rgba(138,92,246,0.22), transparent 68%)" }} />
        <div className="cg-nebula absolute -bottom-24 -right-16 w-[30rem] h-[30rem] rounded-full blur-[80px]" style={{ background: "radial-gradient(circle, rgba(56,120,220,0.20), transparent 70%)", animationDelay: "3.5s" }} />
        <div className="cg-nebula absolute top-1/3 -right-24 w-[20rem] h-[20rem] rounded-full blur-[70px]" style={{ background: "radial-gradient(circle, rgba(232,72,180,0.12), transparent 72%)", animationDelay: "6s" }} />

        {/* campo estelar animado (galáxia girando + parallax) */}
        <StarField />

        {/* brilho central pulsando atrás da Raiz (Cristo, topo-centro) */}
        <div className="cg-breath absolute left-1/2 top-[6%] -translate-x-1/2 w-80 h-56 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255,214,120,0.20), transparent 70%)" }} />

        {/* vinheta */}
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 170px 44px rgba(1,3,12,0.88)" }} />
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
        <Background variant={BackgroundVariant.Dots} gap={34} size={1} color="rgba(150,180,255,0.05)" />
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
