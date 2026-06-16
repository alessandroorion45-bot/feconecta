import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ActivityType = 
  | "bible_read" 
  | "prayer_created" 
  | "prayer_interceded" 
  | "event_participated" 
  | "testimony_shared" 
  | "comment_posted";

export const useActivityTracking = () => {
  const { toast } = useToast();

  const trackActivity = async (
    activityType: ActivityType,
    metadata?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from("user_activities")
        .insert({
          user_id: user.id,
          activity_type: activityType,
          metadata: metadata || null,
        });

      if (error) {
        console.error("Error tracking activity:", error);
        return;
      }

      // Check for new achievements
      await checkNewAchievements(user.id);
    } catch (error) {
      console.error("Activity tracking error:", error);
    }
  };

  const checkNewAchievements = async (userId: string) => {
    try {
      // Get newly earned achievements (within last 5 seconds)
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

      // Show toast for each new achievement
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
  };

  return { trackActivity };
};
