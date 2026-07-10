import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarPro } from "@/components/AvatarPro";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Loader2, Save, History, UserPlus, X, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const sb = supabase as any;

const STATUS_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  present: { label: "Presente", emoji: "✅", color: "text-emerald-600" },
  absent: { label: "Ausente", emoji: "❌", color: "text-red-500" },
  visitor: { label: "Visitante", emoji: "👋", color: "text-sky-500" },
  new_convert: { label: "Novo convertido", emoji: "✨", color: "text-amber-500" },
};

interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Guest {
  tempId: string;
  guest_name: string;
  status: "visitor" | "new_convert";
}

interface HistoryEntry {
  meeting_date: string;
  rows: { user_id: string | null; guest_name: string | null; status: string; full_name?: string }[];
}

interface CellAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellId: string;
  communityId: string;
  userId: string;
}

const todayStr = () => format(new Date(), "yyyy-MM-dd");

const CellAttendanceModal = ({ open, onOpenChange, cellId, communityId, userId }: CellAttendanceModalProps) => {
  const { toast } = useToast();
  const [view, setView] = useState<"record" | "history">("record");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [meetingDate, setMeetingDate] = useState(todayStr());
  const [statuses, setStatuses] = useState<Record<string, "present" | "absent">>({});
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const loadMembers = async () => {
    const { data } = await sb.from("community_cell_members").select("user_id").eq("cell_id", cellId).eq("is_active", true);
    const ids = [...new Set((data || []).map((m: any) => m.user_id))];
    if (!ids.length) { setMembers([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
    setMembers((profiles || []).map(p => ({ user_id: p.id, full_name: p.full_name || "Membro", avatar_url: p.avatar_url })));
  };

  const loadForDate = async (date: string) => {
    const { data } = await sb.from("community_cell_attendance").select("*").eq("cell_id", cellId).eq("meeting_date", date);
    const rows = data || [];
    const nextStatuses: Record<string, "present" | "absent"> = {};
    const nextGuests: Guest[] = [];
    rows.forEach((r: any) => {
      if (r.user_id) {
        if (r.status === "present" || r.status === "absent") nextStatuses[r.user_id] = r.status;
      } else if (r.guest_name) {
        nextGuests.push({ tempId: r.id, guest_name: r.guest_name, status: r.status });
      }
    });
    setStatuses(nextStatuses);
    setGuests(nextGuests);
  };

  const loadHistory = async () => {
    const { data } = await sb
      .from("community_cell_attendance")
      .select("meeting_date, user_id, guest_name, status")
      .eq("cell_id", cellId)
      .order("meeting_date", { ascending: false })
      .limit(500);
    const rows = data || [];
    const ids = [...new Set(rows.filter((r: any) => r.user_id).map((r: any) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as any[] };
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
    const byDate = new Map<string, HistoryEntry>();
    rows.forEach((r: any) => {
      if (!byDate.has(r.meeting_date)) byDate.set(r.meeting_date, { meeting_date: r.meeting_date, rows: [] });
      byDate.get(r.meeting_date)!.rows.push({ ...r, full_name: r.user_id ? pMap.get(r.user_id) : undefined });
    });
    setHistory([...byDate.values()]);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setView("record");
    setMeetingDate(todayStr());
    Promise.all([loadMembers(), loadForDate(todayStr())]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cellId]);

  useEffect(() => {
    if (!open) return;
    loadForDate(meetingDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingDate]);

  useEffect(() => {
    if (view === "history") loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const toggleStatus = (userIdKey: string, status: "present" | "absent") =>
    setStatuses(prev => ({ ...prev, [userIdKey]: status }));

  const addGuest = (status: "visitor" | "new_convert") => {
    if (!newGuestName.trim()) return;
    setGuests(prev => [...prev, { tempId: crypto.randomUUID(), guest_name: newGuestName.trim(), status }]);
    setNewGuestName("");
  };

  const removeGuest = (tempId: string) => setGuests(prev => prev.filter(g => g.tempId !== tempId));

  const save = async () => {
    setSaving(true);
    try {
      await sb.from("community_cell_attendance").delete().eq("cell_id", cellId).eq("meeting_date", meetingDate);

      const rows: any[] = [];
      members.forEach(m => {
        rows.push({
          cell_id: cellId,
          community_id: communityId,
          meeting_date: meetingDate,
          user_id: m.user_id,
          status: statuses[m.user_id] || "present",
          recorded_by: userId,
        });
      });
      guests.forEach(g => {
        rows.push({
          cell_id: cellId,
          community_id: communityId,
          meeting_date: meetingDate,
          guest_name: g.guest_name,
          status: g.status,
          recorded_by: userId,
        });
      });

      if (rows.length) {
        const { error } = await sb.from("community_cell_attendance").insert(rows);
        if (error) throw error;
      }
      toast({ title: "✅ Presença registrada!" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const present = Object.values(statuses).filter(s => s === "present").length;
    const absent = Object.values(statuses).filter(s => s === "absent").length;
    return { present, absent, guests: guests.length };
  }, [statuses, guests]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>Presença da Célula</DialogTitle>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={view === "record" ? "default" : "outline"} onClick={() => setView("record")} className={view === "record" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : ""}>
              Registrar
            </Button>
            <Button size="sm" variant={view === "history" ? "default" : "outline"} onClick={() => setView("history")} className={view === "history" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : ""}>
              <History className="h-3.5 w-3.5 mr-1.5" /> Histórico
            </Button>
          </div>
        </DialogHeader>

        {view === "record" ? (
          loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} max={todayStr()} />

              <div className="flex gap-2 text-xs">
                <Badge variant="secondary" className="gap-1">✅ {summary.present} presentes</Badge>
                <Badge variant="secondary" className="gap-1">❌ {summary.absent} ausentes</Badge>
                <Badge variant="secondary" className="gap-1">👋 {summary.guests} visitantes/convertidos</Badge>
              </div>

              <div className="space-y-1.5">
                {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro na célula ainda.</p>}
                {members.map(m => {
                  const status = statuses[m.user_id] || "present";
                  return (
                    <div key={m.user_id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2 py-1.5">
                      <AvatarPro src={m.avatar_url} name={m.full_name} size="xs" clickable={false} />
                      <span className="text-sm flex-1 truncate">{m.full_name}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant={status === "present" ? "default" : "outline"} className={`h-7 text-xs px-2 ${status === "present" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`} onClick={() => toggleStatus(m.user_id, "present")}>
                          Presente
                        </Button>
                        <Button size="sm" variant={status === "absent" ? "default" : "outline"} className={`h-7 text-xs px-2 ${status === "absent" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`} onClick={() => toggleStatus(m.user_id, "absent")}>
                          Ausente
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium">Visitantes / Novos convertidos</p>
                {guests.map(g => (
                  <div key={g.tempId} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2 py-1.5">
                    <span className={`text-xs ${STATUS_LABEL[g.status].color}`}>{STATUS_LABEL[g.status].emoji}</span>
                    <span className="text-sm flex-1 truncate">{g.guest_name}</span>
                    <span className="text-xs text-muted-foreground">{STATUS_LABEL[g.status].label}</span>
                    <button type="button" onClick={() => removeGuest(g.tempId)}><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Nome" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} className="h-8 text-sm flex-1" />
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => addGuest("visitor")}>
                    <UserPlus className="h-3.5 w-3.5" /> Visitante
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => addGuest("new_convert")}>
                    <UserPlus className="h-3.5 w-3.5" /> Convertido
                  </Button>
                </div>
              </div>

              <Button onClick={save} disabled={saving} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar presença
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum encontro registrado ainda.</p>}
            {history.map(h => {
              const present = h.rows.filter(r => r.status === "present").length;
              const absent = h.rows.filter(r => r.status === "absent").length;
              const others = h.rows.filter(r => r.status === "visitor" || r.status === "new_convert").length;
              const expanded = expandedDate === h.meeting_date;
              return (
                <div key={h.meeting_date} className="rounded-lg border">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                    onClick={() => setExpandedDate(expanded ? null : h.meeting_date)}
                  >
                    {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <span className="text-sm font-medium flex-1">{format(new Date(h.meeting_date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    <Badge variant="secondary" className="text-[10px]">✅ {present}</Badge>
                    <Badge variant="secondary" className="text-[10px]">❌ {absent}</Badge>
                    {others > 0 && <Badge variant="secondary" className="text-[10px]">👋 {others}</Badge>}
                  </button>
                  {expanded && (
                    <div className="px-3 pb-2 space-y-1 border-t pt-2">
                      {h.rows.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={STATUS_LABEL[r.status]?.color}>{STATUS_LABEL[r.status]?.emoji}</span>
                          <span className="flex-1">{r.full_name || r.guest_name}</span>
                          <span className="text-muted-foreground">{STATUS_LABEL[r.status]?.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CellAttendanceModal;
