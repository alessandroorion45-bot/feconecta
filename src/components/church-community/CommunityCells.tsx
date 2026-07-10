import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarPro } from "@/components/AvatarPro";
import { useToast } from "@/hooks/use-toast";
import {
  Home, Loader2, Plus, Search, MapPin, Clock, Users, Pencil, Trash2,
  LogIn, LogOut, ExternalLink, BookOpen, Target, ClipboardCheck, HandHeart,
} from "lucide-react";
import { motion } from "framer-motion";
import CellFormModal, { type EditableCell } from "./CellFormModal";
import CellAttendanceModal from "./CellAttendanceModal";
import CellPrayerModal from "./CellPrayerModal";

const sb = supabase as any;

interface Cell extends EditableCell {
  community_id: string;
  created_by: string;
  is_active: boolean;
  member_count?: number;
  i_am_member?: boolean;
}

interface CommunityCellsProps {
  communityId: string;
  userId: string;
  myRole: string | null;
  isAdmin: boolean;
}

const LEADER_ROLES_SET = ["admin", "pastor", "pastora", "lider_geral", "presbitero", "moderador", "lider_ministerio", "evangelista", "missionario"];

const CommunityCells = ({ communityId, userId, myRole, isAdmin }: CommunityCellsProps) => {
  const { toast } = useToast();
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cell | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<{ user_id: string; full_name: string; avatar_url: string | null; role: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [joining, setJoining] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showPrayers, setShowPrayers] = useState(false);

  const canCreate = isAdmin || LEADER_ROLES_SET.includes(myRole || "");

  const load = useCallback(async () => {
    const { data: cellRows } = await sb
      .from("community_cells")
      .select("*")
      .eq("community_id", communityId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const list: Cell[] = cellRows || [];
    if (list.length) {
      const { data: memberRows } = await sb
        .from("community_cell_members")
        .select("cell_id, user_id")
        .in("cell_id", list.map(c => c.id))
        .eq("is_active", true);
      const counts = new Map<string, number>();
      const mine = new Set<string>();
      (memberRows || []).forEach((m: any) => {
        counts.set(m.cell_id, (counts.get(m.cell_id) || 0) + 1);
        if (m.user_id === userId) mine.add(m.cell_id);
      });
      list.forEach(c => {
        c.member_count = counts.get(c.id) || 0;
        c.i_am_member = mine.has(c.id);
      });
    }
    setCells(list);
    setLoading(false);
  }, [communityId, userId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`cells-${communityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_cells", filter: `community_id=eq.${communityId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_cell_members", filter: `community_id=eq.${communityId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [communityId, load]);

  const loadMembers = async (cellId: string) => {
    const { data } = await sb
      .from("community_cell_members")
      .select("user_id, role")
      .eq("cell_id", cellId)
      .eq("is_active", true);
    const rows = data || [];
    if (!rows.length) { setSelectedMembers([]); return; }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", rows.map((r: any) => r.user_id));
    const map = new Map((profiles || []).map(p => [p.id, p]));
    setSelectedMembers(rows.map((r: any) => ({
      user_id: r.user_id,
      role: r.role,
      full_name: map.get(r.user_id)?.full_name || "Membro",
      avatar_url: map.get(r.user_id)?.avatar_url || null,
    })));
  };

  const openDetail = (cell: Cell) => {
    setSelected(cell);
    loadMembers(cell.id);
  };

  const toggleMembership = async (cell: Cell) => {
    setJoining(true);
    try {
      if (cell.i_am_member) {
        const { error } = await sb.from("community_cell_members").delete().eq("cell_id", cell.id).eq("user_id", userId);
        if (error) throw error;
        toast({ title: "Você saiu da célula" });
      } else {
        const { error } = await sb.from("community_cell_members").insert({
          cell_id: cell.id, community_id: communityId, user_id: userId, role: "member",
        });
        if (error) throw error;
        toast({ title: "🏠 Você entrou na célula!" });
      }
      await load();
      if (selected?.id === cell.id) loadMembers(cell.id);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const removeCell = async (cell: Cell) => {
    if (!confirm(`Remover a célula "${cell.name}"?`)) return;
    const { error } = await sb.from("community_cells").update({ is_active: false }).eq("id", cell.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Célula removida" });
    setSelected(null);
    load();
  };

  const canManageCell = (cell: Cell) =>
    isAdmin || cell.created_by === userId || cell.leader_user_id === userId || LEADER_ROLES_SET.includes(myRole || "");

  const filtered = useMemo(() => {
    if (!search.trim()) return cells;
    const q = search.toLowerCase();
    return cells.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.leader_name || "").toLowerCase().includes(q) ||
      (c.neighborhood || "").toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q)
    );
  }, [cells, search]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar célula por nome, líder ou bairro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {canCreate && (
          <Button
            onClick={() => { setEditingCell(null); setShowForm(true); }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Célula
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <Home className="h-10 w-10 mx-auto text-amber-400" />
            <p className="text-muted-foreground">{cells.length === 0 ? "Nenhuma célula cadastrada ainda." : "Nenhuma célula encontrada."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cell, i) => (
            <motion.div key={cell.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
              <Card
                onClick={() => openDetail(cell)}
                className="cursor-pointer h-full overflow-hidden border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-background via-background to-amber-50/40 dark:to-amber-950/20 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
              >
                {cell.photos && cell.photos.length > 0 && (
                  <div className="h-32 w-full overflow-hidden">
                    <img src={cell.photos[0]} alt={cell.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold leading-tight">{cell.name}</h4>
                    {cell.i_am_member && <Badge className="shrink-0 text-[10px]">Minha célula</Badge>}
                  </div>
                  {cell.leader_name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {cell.leader_name}
                    </p>
                  )}
                  {cell.meeting_day && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {cell.meeting_day}{cell.meeting_time ? ` · ${cell.meeting_time.slice(0, 5)}` : ""}
                    </p>
                  )}
                  {(cell.neighborhood || cell.city) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {[cell.neighborhood, cell.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="secondary" className="text-[10px]">{cell.member_count || 0} membro{cell.member_count !== 1 ? "s" : ""}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detalhe da célula */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-amber-500" />
                  {selected.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {selected.photos && selected.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selected.photos.map(url => (
                      <img key={url} src={url} alt={selected.name} className="h-24 w-32 object-cover rounded-lg shrink-0" />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selected.leader_name && <p><span className="text-muted-foreground">Líder:</span> {selected.leader_name}</p>}
                  {selected.vice_leader_name && <p><span className="text-muted-foreground">Vice-líder:</span> {selected.vice_leader_name}</p>}
                  {selected.supervisor_name && <p><span className="text-muted-foreground">Supervisor:</span> {selected.supervisor_name}</p>}
                  {selected.meeting_day && (
                    <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selected.meeting_day}{selected.meeting_time ? ` · ${selected.meeting_time.slice(0, 5)}` : ""}</p>
                  )}
                </div>

                {(selected.neighborhood || selected.city || selected.street) && (
                  <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    {[selected.street && `${selected.street}${selected.number ? `, ${selected.number}` : ""}`, selected.neighborhood, selected.city, selected.state].filter(Boolean).join(" - ")}
                  </p>
                )}
                {selected.maps_link && (
                  <a href={selected.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver localização no mapa
                  </a>
                )}

                {selected.theme && (
                  <div className="rounded-lg bg-muted/60 px-3 py-2 flex items-start gap-2">
                    <Target className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">Tema atual</p>
                      <p className="text-sm text-muted-foreground">{selected.theme}</p>
                    </div>
                  </div>
                )}
                {selected.verse && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/90 italic">{selected.verse}</p>
                  </div>
                )}
                {selected.weekly_objective && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Objetivo da semana:</span> {selected.weekly_objective}</p>
                )}

                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {selectedMembers.length} membro{selectedMembers.length !== 1 ? "s" : ""}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(m => (
                      <div key={m.user_id} className="flex items-center gap-1.5 bg-muted/60 rounded-full pl-1 pr-2.5 py-1">
                        <AvatarPro src={m.avatar_url} name={m.full_name} size="xs" clickable={false} />
                        <span className="text-xs">{m.full_name.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => toggleMembership(selected)}
                    disabled={joining}
                    variant={selected.i_am_member ? "outline" : "default"}
                    className={selected.i_am_member ? "flex-1 gap-2" : "flex-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"}
                  >
                    {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : selected.i_am_member ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                    {selected.i_am_member ? "Sair da célula" : "Entrar na célula"}
                  </Button>
                  {(selected.i_am_member || canManageCell(selected)) && (
                    <Button variant="outline" size="icon" onClick={() => setShowPrayers(true)} title="Pedidos de oração">
                      <HandHeart className="h-4 w-4" />
                    </Button>
                  )}
                  {canManageCell(selected) && (
                    <>
                      <Button variant="outline" size="icon" onClick={() => setShowAttendance(true)} title="Presença">
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => { setEditingCell(selected); setShowForm(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeCell(selected)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CellFormModal
        open={showForm}
        onOpenChange={setShowForm}
        communityId={communityId}
        userId={userId}
        cell={editingCell}
        onSaved={() => { load(); setSelected(null); }}
      />

      {selected && (
        <>
          <CellAttendanceModal
            open={showAttendance}
            onOpenChange={setShowAttendance}
            cellId={selected.id}
            communityId={communityId}
            userId={userId}
          />
          <CellPrayerModal
            open={showPrayers}
            onOpenChange={setShowPrayers}
            cellId={selected.id}
            communityId={communityId}
            userId={userId}
            canModerate={canManageCell(selected)}
          />
        </>
      )}
    </div>
  );
};

export default CommunityCells;
