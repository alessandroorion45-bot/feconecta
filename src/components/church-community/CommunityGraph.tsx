import { useMemo, useEffect, memo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import UserAvatar from "@/components/UserAvatar";
import { getRoleInfo } from "@/lib/communityRoles";

// ============================================================
// Grafo hierárquico do discipulado (estilo genealogia premium).
// Cada pessoa é um nó; a aresta liga o discipulador ao discípulo
// (dado real: discipler_user_id). Quem não tem discipulador nasce
// da Raiz (Cristo). Layout automático via dagre.
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
}

// Cor própria por cargo (gradiente da moldura + glow)
const ROLE_COLOR: Record<string, string> = {
  admin: "255,215,106",
  pastor: "255,215,106",
  pastora: "255,215,106",
  lider_geral: "251,191,36",
  presbitero: "125,211,252",
  diacono: "251,146,60",
  diaconisa: "251,146,60",
  lider_ministerio: "248,113,113",
  professor_ebd: "168,120,255",
  musico: "168,120,255",
  vocalista: "168,120,255",
  intercessor: "168,120,255",
  evangelista: "168,120,255",
  missionario: "168,120,255",
  secretario: "148,163,184",
  moderador: "148,163,184",
  member: "148,163,184",
  visitor: "148,163,184",
};
const roleColor = (r: string) => ROLE_COLOR[r] || "148,163,184";

const NODE_W = 190;
const NODE_H = 118;

// -------- Nó da Raiz (Cristo) --------
const RootNode = memo(() => (
  <div
    className="rounded-2xl px-5 py-3 text-center shadow-2xl"
    style={{ width: NODE_W, background: "linear-gradient(160deg, rgba(30,20,8,0.96), rgba(12,8,3,0.98))", border: "1.5px solid rgba(255,215,106,0.55)", boxShadow: "0 0 30px rgba(255,215,106,0.35)" }}
  >
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <div className="text-2xl drop-shadow-[0_0_10px_rgba(255,215,106,0.9)]">✝️</div>
    <div className="text-sm font-bold text-amber-200 mt-0.5">Cristo — A Raiz</div>
    <div className="text-[10px] text-amber-100/60 italic mt-0.5">João 15:5</div>
  </div>
));
RootNode.displayName = "RootNode";

// -------- Nó do membro (card premium) --------
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
  return (
    <div
      onClick={d.onOpen}
      className="rounded-2xl p-[1.5px] cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        width: NODE_W,
        opacity: d.dim ? 0.28 : 1,
        background: d.highlight ? "linear-gradient(135deg,#facc15,#f59e0b)" : `linear-gradient(135deg, rgba(${c},0.85), rgba(${c},0.25))`,
        boxShadow: d.highlight ? "0 0 22px rgba(250,204,21,0.6)" : `0 0 16px rgba(${c},0.28)`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div className="relative rounded-2xl px-3 pt-3 pb-2.5 flex flex-col items-center text-center overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(16,26,48,0.95), rgba(8,15,30,0.97))" }}>
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="relative">
          <span className="absolute -inset-1 rounded-full blur-md opacity-70" style={{ background: `radial-gradient(circle, rgba(${c},0.5), transparent 70%)` }} aria-hidden />
          <div className="relative rounded-full ring-2" style={{ borderColor: `rgb(${c})`, boxShadow: `0 0 0 2px rgba(${c},0.5)` }}>
            <UserAvatar src={d.member.profile?.avatar_url || undefined} fallback={d.member.profile?.full_name || "?"} size="md" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-sm drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" aria-hidden>{info.emoji}</span>
        </div>
        <span className="text-[12px] font-bold mt-2 leading-tight text-white line-clamp-2">{d.member.profile?.full_name || "Membro"}</span>
        <span className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: `rgb(${c})` }}>{info.label}</span>
        {(d.disciples > 0 || d.ministries > 0 || d.cells > 0) && (
          <div className="flex flex-wrap justify-center gap-1 mt-1.5">
            {d.disciples > 0 && <span className="rounded-full bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 text-[8px] text-amber-200">👥 {d.disciples}</span>}
            {d.ministries > 0 && <span className="rounded-full bg-emerald-500/10 border border-emerald-400/25 px-1.5 py-0.5 text-[8px] text-emerald-200">🌿 {d.ministries}</span>}
            {d.cells > 0 && <span className="rounded-full bg-sky-500/10 border border-sky-400/25 px-1.5 py-0.5 text-[8px] text-sky-200">🏠 {d.cells}</span>}
          </div>
        )}
      </div>
    </div>
  );
});
MemberNode.displayName = "MemberNode";

const nodeTypes = { member: MemberNode, root: RootNode };

// -------- Layout automático (dagre) --------
const layout = (nodes: Node[], edges: Edge[]): Node[] => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 46, ranksep: 72, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: n.type === "root" ? 92 : NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } };
  });
};

const ROOT_ID = "__root__";

const CommunityGraphInner = ({ members, userId, discipleCounts, cellsByLeader, matches, isSearching, onSelect }: CommunityGraphProps) => {
  const { rawNodes, rawEdges } = useMemo(() => {
    const ids = new Set(members.map((m) => m.user_id));
    const rn: Node[] = [
      { id: ROOT_ID, type: "root", position: { x: 0, y: 0 }, data: {} },
    ];
    const re: Edge[] = [];
    members.forEach((m) => {
      const visible = matches(m);
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
          dim: isSearching && !visible,
          highlight: isSearching && visible,
          onOpen: () => onSelect(m),
        },
      });
      // pai = discipulador (se estiver na comunidade); senão, a Raiz (Cristo)
      const parentUser = m.discipler_user_id && ids.has(m.discipler_user_id) ? m.discipler_user_id : null;
      const parentNode = parentUser ? members.find((x) => x.user_id === parentUser)?.id : ROOT_ID;
      re.push({
        id: `e-${parentNode}-${m.id}`,
        source: parentNode || ROOT_ID,
        target: m.id,
        type: "default",
        animated: true,
        style: { stroke: "rgba(255,215,106,0.7)", strokeWidth: 2 },
      });
    });
    return { rawNodes: rn, rawEdges: re };
  }, [members, userId, discipleCounts, cellsByLeader, matches, isSearching, onSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(layout(rawNodes, rawEdges));
    setEdges(rawEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  return (
    <div className="h-[560px] w-full rounded-lg overflow-hidden" style={{ background: "radial-gradient(120% 85% at 50% 100%, #10233f 0%, #0a1830 30%, #060f22 60%, #030812 100%)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        nodesDraggable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(255,215,106,0.14)" />
        <Controls showInteractive={false} className="!bg-white/10 !border-white/15 backdrop-blur-md [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-white" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.type === "root" ? "#ffd76a" : `rgb(${roleColor((n.data as any)?.member?.role || "member")})`)}
          maskColor="rgba(3,8,18,0.7)"
          className="!bg-[#0a1830]/80 !border !border-white/10 rounded-lg"
        />
      </ReactFlow>
    </div>
  );
};

export const CommunityGraph = memo(CommunityGraphInner);
export default CommunityGraph;
