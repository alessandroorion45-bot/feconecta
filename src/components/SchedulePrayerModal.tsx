import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Repeat, Bell } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface SchedulePrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  user: User;
  onSuccess: () => void;
}

const SchedulePrayerModal = ({
  open,
  onOpenChange,
  groupId,
  user,
  onSuccess,
}: SchedulePrayerModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>("weekly");
  const [reminderMinutes, setReminderMinutes] = useState<string>("15");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time) {
      toast({
        title: "Preencha os campos",
        description: "Título, data e horário são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    
    if (scheduledAt <= new Date()) {
      toast({
        title: "Data inválida",
        description: "O horário deve ser no futuro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("scheduled_prayers")
        .insert([{
          group_id: groupId,
          created_by: user.id,
          title: title.trim(),
          description: description.trim() || null,
          scheduled_at: scheduledAt.toISOString(),
          is_recurring: isRecurring,
          recurrence_type: isRecurring ? recurrenceType : null,
          reminder_minutes: parseInt(reminderMinutes) || 15,
        }]);

      if (error) throw error;

      toast({
        title: "Oração agendada! 🙏",
        description: "Os membros do grupo serão notificados",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setIsRecurring(false);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível agendar a oração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendar Oração em Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da oração *</Label>
            <Input
              id="title"
              placeholder="Ex: Oração pela família"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo da oração..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Horário *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Lembrete antes
            </Label>
            <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
              <SelectTrigger>
                <SelectValue placeholder="Tempo de lembrete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <Label htmlFor="recurring" className="cursor-pointer">Repetir</Label>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <Select value={recurrenceType} onValueChange={setRecurrenceType}>
              <SelectTrigger>
                <SelectValue placeholder="Frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            className="w-full bg-gradient-primary gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Agendar Oração
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchedulePrayerModal;
