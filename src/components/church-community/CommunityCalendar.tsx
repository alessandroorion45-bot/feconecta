import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays, Loader2, Plus, MapPin, Clock, Pencil, Trash2, ExternalLink, X,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { RSVP_OPTIONS, getEventTypeInfo } from "@/lib/eventTypes";
import EventFormModal, { type EditableEvent } from "./EventFormModal";

const sb = supabase as any;

interface CommunityEvent extends EditableEvent {
  community_id: string;
  created_by: string;
  rsvpCounts: { going: number; maybe: number; not_going: number };
  myRsvp: "going" | "maybe" | "not_going" | null;
}

interface CommunityCalendarProps {
  communityId: string;
  userId: string;
  myRole: string | null;
  isAdmin: boolean;
}

const LEADER_ROLES_SET = ["admin", "pastor", "pastora", "lider_geral", "presbitero", "moderador", "lider_ministerio", "evangelista", "missionario", "secretario"];

const CommunityCalendar = ({ communityId, userId, myRole, isAdmin }: CommunityCalendarProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [detail, setDetail] = useState<CommunityEvent | null>(null);

  const canCreate = isAdmin || LEADER_ROLES_SET.includes(myRole || "");

  const load = useCallback(async () => {
    const { data } = await sb
      .from("community_events")
      .select("*")
      .eq("community_id", communityId)
      .eq("is_active", true)
      .order("start_at", { ascending: true });

    const list: any[] = data || [];
    if (list.length) {
      const { data: rsvps } = await sb.from("community_event_rsvps").select("event_id, user_id, status").in("event_id", list.map(e => e.id));
      const counts = new Map<string, { going: number; maybe: number; not_going: number }>();
      const mine = new Map<string, string>();
      (rsvps || []).forEach((r: any) => {
        if (!counts.has(r.event_id)) counts.set(r.event_id, { going: 0, maybe: 0, not_going: 0 });
        counts.get(r.event_id)![r.status as "going"] += 1;
        if (r.user_id === userId) mine.set(r.event_id, r.status);
      });
      list.forEach(e => {
        e.rsvpCounts = counts.get(e.id) || { going: 0, maybe: 0, not_going: 0 };
        e.myRsvp = mine.get(e.id) || null;
      });
    }
    setEvents(list);
    setLoading(false);
    if (detail) {
      const updated = list.find(e => e.id === detail.id);
      if (updated) setDetail(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, userId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`events-${communityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_events", filter: `community_id=eq.${communityId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_event_rsvps" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [communityId, load]);

  const eventDates = useMemo(() => events.map(e => new Date(e.start_at)), [events]);

  const visibleEvents = useMemo(() => {
    if (!selectedDate) return events.filter(e => new Date(e.start_at) >= new Date(new Date().setHours(0, 0, 0, 0)));
    return events.filter(e => isSameDay(new Date(e.start_at), selectedDate));
  }, [events, selectedDate]);

  const setRsvp = async (event: CommunityEvent, status: "going" | "maybe" | "not_going") => {
    const { error } = await sb.from("community_event_rsvps").upsert(
      { event_id: event.id, user_id: userId, status },
      { onConflict: "event_id,user_id" }
    );
    if (error) toast({ title: "Erro ao confirmar presença", description: error.message, variant: "destructive" });
    else load();
  };

  const removeEvent = async (event: CommunityEvent) => {
    if (!confirm(`Remover o evento "${event.title}"?`)) return;
    const { error } = await sb.from("community_events").update({ is_active: false }).eq("id", event.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Evento removido" });
    setDetail(null);
    load();
  };

  const canManage = (event: CommunityEvent) => isAdmin || event.created_by === userId || LEADER_ROLES_SET.includes(myRole || "");

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            Calendário da Comunidade
          </h3>
          <p className="text-xs text-muted-foreground">Cultos, células, campanhas e mais — com confirmação de presença</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2">
            <Plus className="h-4 w-4" /> Novo Evento
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        <Card className="w-fit mx-auto lg:mx-0">
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "font-bold text-amber-600 dark:text-amber-400 underline underline-offset-4" }}
            />
            {selectedDate && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setSelectedDate(undefined)}>
                <X className="h-3 w-3 mr-1" /> Limpar filtro de data
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {visibleEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                {selectedDate ? "Nenhum evento nesta data." : "Nenhum evento futuro cadastrado."}
              </CardContent>
            </Card>
          ) : (
            visibleEvents.map((event, i) => {
              const info = getEventTypeInfo(event.event_type);
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <Card
                    onClick={() => setDetail(event)}
                    className="cursor-pointer overflow-hidden border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-background via-background to-amber-50/30 dark:to-amber-950/15 hover:border-amber-400/70 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-3 flex gap-3">
                      {event.cover_image_url ? (
                        <img src={event.cover_image_url} alt={event.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-2xl shrink-0">{info.emoji}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm leading-tight truncate">{event.title}</h4>
                          <Badge variant="secondary" className="text-[10px] shrink-0">{info.emoji} {info.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> {format(new Date(event.start_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </p>
                        )}
                        {event.myRsvp && (
                          <Badge className="mt-1 text-[10px]">{RSVP_OPTIONS.find(r => r.value === event.myRsvp)?.emoji} {RSVP_OPTIONS.find(r => r.value === event.myRsvp)?.label}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Detalhe do evento */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getEventTypeInfo(detail.event_type).emoji} {detail.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {detail.cover_image_url && (
                  <img src={detail.cover_image_url} alt={detail.title} className="w-full h-40 object-cover rounded-lg" />
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(new Date(detail.start_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  {detail.end_at && ` — ${format(new Date(detail.end_at), "HH:mm", { locale: ptBR })}`}
                </p>
                {detail.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {detail.location}
                  </p>
                )}
                {detail.maps_link && (
                  <a href={detail.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver localização no mapa
                  </a>
                )}
                {detail.description && <p className="text-sm whitespace-pre-wrap">{detail.description}</p>}

                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Você vai?</p>
                  <div className="flex gap-2 flex-wrap">
                    {RSVP_OPTIONS.map(opt => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={detail.myRsvp === opt.value ? "default" : "outline"}
                        className={detail.myRsvp === opt.value ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : ""}
                        onClick={() => setRsvp(detail, opt.value)}
                      >
                        {opt.emoji} {opt.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                    <span>✅ {detail.rsvpCounts.going} vão</span>
                    <span>🤔 {detail.rsvpCounts.maybe} talvez</span>
                    <span>❌ {detail.rsvpCounts.not_going} não vão</span>
                  </div>
                </div>

                {canManage(detail) && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => { setEditingEvent(detail); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive gap-2" onClick={() => removeEvent(detail)}>
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EventFormModal
        open={showForm}
        onOpenChange={setShowForm}
        communityId={communityId}
        userId={userId}
        event={editingEvent}
        onSaved={() => { load(); setDetail(null); }}
      />
    </div>
  );
};

export default CommunityCalendar;
