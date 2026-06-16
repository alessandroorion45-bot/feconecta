import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Bell, BellOff, Repeat, Trash2 } from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface ScheduledPrayer {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  reminder_minutes: number;
  is_recurring: boolean;
  recurrence_type: string | null;
}

interface ScheduledPrayerCardProps {
  prayer: ScheduledPrayer;
  user: User | null;
  onDelete?: () => void;
}

const ScheduledPrayerCard = ({ prayer, user, onDelete }: ScheduledPrayerCardProps) => {
  const [isAttending, setIsAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendees();
  }, [prayer.id, user]);

  const loadAttendees = async () => {
    const { data, error } = await supabase
      .from("scheduled_prayer_attendees")
      .select("user_id")
      .eq("scheduled_prayer_id", prayer.id);

    if (!error && data) {
      setAttendeeCount(data.length);
      if (user) {
        setIsAttending(data.some(a => a.user_id === user.id));
      }
    }
  };

  const handleToggleAttendance = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para confirmar presença",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isAttending) {
        const { error } = await supabase
          .from("scheduled_prayer_attendees")
          .delete()
          .eq("scheduled_prayer_id", prayer.id)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Presença cancelada",
          description: "Você cancelou sua confirmação",
        });

        setIsAttending(false);
        setAttendeeCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("scheduled_prayer_attendees")
          .insert([{
            scheduled_prayer_id: prayer.id,
            user_id: user.id,
          }]);

        if (error) throw error;

        toast({
          title: "Presença confirmada! 🙏",
          description: "Você receberá um lembrete antes do horário",
        });

        setIsAttending(true);
        setAttendeeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua ação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== prayer.created_by) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("scheduled_prayers")
        .delete()
        .eq("id", prayer.id);

      if (error) throw error;

      toast({
        title: "Agendamento removido",
        description: "O horário de oração foi cancelado",
      });

      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o agendamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduledDate = new Date(prayer.scheduled_at);
  const isPastEvent = isPast(scheduledDate);
  const isCreator = user?.id === prayer.created_by;

  const getRecurrenceLabel = () => {
    switch (prayer.recurrence_type) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return null;
    }
  };

  return (
    <Card className={cn(
      "transition-all",
      isPastEvent && "opacity-60",
      isAttending && !isPastEvent && "ring-2 ring-primary/30 bg-primary/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{prayer.title}</CardTitle>
          <div className="flex items-center gap-1">
            {prayer.is_recurring && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Repeat className="h-3 w-3" />
                {getRecurrenceLabel()}
              </Badge>
            )}
            {isPastEvent ? (
              <Badge variant="secondary" className="text-xs">Encerrado</Badge>
            ) : (
              <Badge variant="default" className="text-xs bg-green-600">Ativo</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        {prayer.description && (
          <p className="text-sm text-muted-foreground">{prayer.description}</p>
        )}
        
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(scheduledDate, "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(scheduledDate, "HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{attendeeCount} {attendeeCount === 1 ? 'confirmado' : 'confirmados'}</span>
          </div>
        </div>

        {isFuture(scheduledDate) && (
          <p className="text-xs text-primary font-medium">
            {formatDistanceToNow(scheduledDate, { addSuffix: true, locale: ptBR })}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2 gap-2">
        {!isPastEvent && (
          <Button
            size="sm"
            variant={isAttending ? "default" : "outline"}
            className={cn("flex-1 gap-2", isAttending && "bg-gradient-primary")}
            onClick={handleToggleAttendance}
            disabled={loading}
          >
            {isAttending ? (
              <>
                <Bell className="h-4 w-4" />
                Confirmado
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Confirmar
              </>
            )}
          </Button>
        )}
        
        {isCreator && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ScheduledPrayerCard;
