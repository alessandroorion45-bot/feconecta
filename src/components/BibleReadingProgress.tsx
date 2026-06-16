import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BookOpen, Bell, BellOff, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReadingPosition {
  user_id: string;
  book_abbrev: string;
  book_name: string;
  chapter: number;
  verse_number: number;
  last_read_at: string;
  notifications_enabled: boolean;
}

interface BibleReadingProgressProps {
  onResumeReading: (bookAbbrev: string, chapter: number, verseNumber: number) => void;
  currentBook?: string;
  currentChapter?: number;
}

const BibleReadingProgress = ({
  onResumeReading,
  currentBook,
  currentChapter,
}: BibleReadingProgressProps) => {
  const { toast } = useToast();
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "Notification" in window;
    setNotificationsSupported(supported);

    if (supported) {
      setNotificationPermission(Notification.permission);
    }

    loadPosition();
  }, []);

  // If reminders are enabled in DB but permission isn't granted, keep reminders OFF until user authorizes
  useEffect(() => {
    if (!position || !notificationsSupported) return;

    const remindersActive = position.notifications_enabled && notificationPermission === "granted";

    if (position.notifications_enabled && !remindersActive) {
      // Reflect correct state in UI and DB (silent)
      setPosition({ ...position, notifications_enabled: false });
      supabase
        .from("bible_reading_position")
        .update({ notifications_enabled: false })
        .eq("user_id", position.user_id);
    }
  }, [position, notificationsSupported, notificationPermission]);

  // Schedule notifications only when permission is granted
  useEffect(() => {
    if (position?.notifications_enabled && notificationsSupported && notificationPermission === "granted") {
      scheduleNotifications();
    }
  }, [position?.notifications_enabled, notificationsSupported, notificationPermission]);

  const loadPosition = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bible_reading_position")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading position:", error);
      }

      setPosition(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!notificationsSupported) return false;

    if (Notification.permission === "granted") {
      setNotificationPermission("granted");
      return true;
    }

    if (Notification.permission === "denied") {
      setNotificationPermission("denied");
      return false;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission === "granted";
  };

  const scheduleNotifications = () => {
    if (!position || !notificationsSupported) return;

    // Clear any existing intervals
    const existingIntervals = (window as any).__bibleNotificationIntervals;
    if (existingIntervals) {
      existingIntervals.forEach((id: number) => clearInterval(id));
    }

    // Schedule check every minute for notification times
    const intervalId = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Check for 8:00, 14:00, 20:00
      if (
        (hours === 8 && minutes === 0) ||
        (hours === 14 && minutes === 0) ||
        (hours === 20 && minutes === 0)
      ) {
        showNotification();
      }
    }, 60000);

    (window as any).__bibleNotificationIntervals = [intervalId];
  };

  const showNotification = () => {
    if (!position || Notification.permission !== "granted") return;

    new Notification("📖 Hora da Leitura Bíblica!", {
      body: `Sua leitura está te esperando! Continue em ${position.book_name} ${position.chapter}:${position.verse_number}`,
      icon: "/favicon.ico",
      tag: "bible-reading-reminder",
    });
  };

  const toggleNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !position) return;

    const remindersActive = position.notifications_enabled && notificationPermission === "granted";
    const newValue = !remindersActive;

    if (newValue) {
      // Check current permission state first
      if (notificationPermission === "denied") {
        toast({
          title: "🔔 Notificações bloqueadas",
          description:
            "Deus fala no silêncio — permita que a Palavra te lembre nos momentos certos. Para receber lembretes, ative as notificações nas configurações do navegador.",
        });
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({
          title: "🙏 Permita os lembretes",
          description:
            "Para receber lembretes da Palavra, ative as notificações nas configurações do seu navegador.",
        });
        return;
      }
    }

    const { error } = await supabase
      .from("bible_reading_position")
      .update({ notifications_enabled: newValue })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Ops!",
        description: "Não foi possível atualizar os lembretes agora. Tente novamente.",
      });
      return;
    }

    setPosition({ ...position, notifications_enabled: newValue });
    toast({
      title: newValue ? "✨ Lembretes ativados!" : "Lembretes desativados",
      description: newValue
        ? "Você receberá lembretes às 8h, 14h e 20h."
        : "Você não receberá mais lembretes diários.",
    });
  };

  const handleResume = () => {
    if (position) {
      onResumeReading(position.book_abbrev, position.chapter, position.verse_number);
      toast({
        title: "Retomando leitura",
        description: `${position.book_name} ${position.chapter}:${position.verse_number}`,
      });
    }
  };

  if (loading) return null;

  if (!position) {
    return (
      <Card className="mb-6 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <p className="text-sm">
              Clique em qualquer versículo para salvar seu progresso de leitura.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCurrentPosition =
    position.book_abbrev === currentBook && position.chapter === currentChapter;

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Seu Progresso de Leitura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Última leitura:</p>
            <p className="font-medium">
              {position.book_name} {position.chapter}:{position.verse_number}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(position.last_read_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {!isCurrentPosition && (
            <Button
              onClick={handleResume}
              className="gap-2"
              aria-label="Continuar leitura da Bíblia"
            >
              <Play className="h-4 w-4" />
              Continuar de onde parei
            </Button>
          )}
        </div>

        {notificationsSupported && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {position.notifications_enabled && notificationPermission === "granted" ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <Label htmlFor="notifications" className="text-sm cursor-pointer">
                  Lembretes diários (8h, 14h, 20h)
                </Label>
                <span className="text-xs text-muted-foreground">
                  {position.notifications_enabled && notificationPermission === "granted"
                    ? "Lembretes ativados"
                    : notificationPermission === "denied"
                      ? "Notificações bloqueadas no navegador"
                      : "Lembretes desativados"}
                </span>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={position.notifications_enabled && notificationPermission === "granted"}
              onCheckedChange={toggleNotifications}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BibleReadingProgress;
