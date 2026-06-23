import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRef, useCallback } from "react";

export type ActivityType =
  | "bible_read"
  | "prayer_created"
  | "prayer_interceded"
  | "event_participated"
  | "testimony_shared"
  | "comment_posted";

export const useActivityTracking = () => {
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActivitiesRef = useRef<Array<{ activityType: ActivityType; metadata?: Record<string, any> }>>([]);

  const flushActivities = useCallback(async () => {
    if (pendingActivitiesRef.current.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activities = pendingActivitiesRef.current.map(({ activityType, metadata }) => ({
        user_id: user.id,
        activity_type: activityType,
        metadata: metadata || null,
      }));

      // Batch insert - muito mais eficiente!
      const { error } = await supabase
        .from("user_activities")
        .insert(activities);

      if (error) {
        console.error("Error tracking activities:", error);
        return;
      }

      // Limpa a fila
      pendingActivitiesRef.current = [];
    } catch (error) {
      console.error("Activity tracking error:", error);
    }
  }, []);

  const trackActivity = useCallback(async (
    activityType: ActivityType,
    metadata?: Record<string, any>
  ) => {
    try {
      // Adiciona à fila
      pendingActivitiesRef.current.push({ activityType, metadata });

      // Cancela timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Agenda flush para 2 segundos depois
      debounceTimerRef.current = setTimeout(flushActivities, 2000);
    } catch (error) {
      console.error("Activity tracking error:", error);
    }
  }, [flushActivities]);

  const checkNewAchievements = async (userId: string) => {
    // OTIMIZADO: Desabilitado temporariamente para melhorar performance
    // Query a cada ação estava deixando o app lento
    // TODO: Implementar WebSocket realtime para conquistas
    return;

    /* CÓDIGO ORIGINAL (causava lentidão):
    try {
      const { data: newAchievements, error } = await supabase
        .from("user_achievements")
        .select(`
          earned_at,
          achievements (
            name,
            description,
            icon,
            points
          )
        `)
        .eq("user_id", userId)
        .gte("earned_at", new Date(Date.now() - 5000).toISOString());

      if (error || !newAchievements || newAchievements.length === 0) {
        return;
      }

      newAchievements.forEach((achievement: any) => {
        const ach = achievement.achievements;
        toast({
          title: `🎉 Nova Conquista Desbloqueada!`,
          description: `${ach.icon} ${ach.name} - +${ach.points} pontos`,
        });
      });
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
    */
  };

  return { trackActivity };
};
