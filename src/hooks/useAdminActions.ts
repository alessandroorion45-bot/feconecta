import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminStats {
  total_users: number;
  users_today: number;
  users_week: number;
  total_logs: number;
  active_punishments: number;
}

export interface UserProfile {
  id: string;
  email: string;
  registered_at: string;
  last_sign_in_at: string | null;
  total_warnings: number;
}

export interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_audience: string;
  total_sent: number;
  sent_at: string | null;
  created_at: string;
}

export function useAdminActions() {
  const { user } = useAuth();

  /**
   * Buscar estatísticas do dashboard
   */
  const getDashboardStats = async (): Promise<AdminStats | null> => {
    const { data, error } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();

    if (error) {
      console.error('[useAdminActions] Error fetching dashboard stats:', error);
      return null;
    }

    return data;
  };

  /**
   * Buscar perfis de usuários
   */
  const getUserProfiles = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('admin_user_profile')
      .select('*')
      .order('registered_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[useAdminActions] Error fetching user profiles:', error);
      return [];
    }

    return data || [];
  };

  /**
   * Advertir um usuário
   */
  const warnUser = async (userId: string, reason: string): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('warn_user', {
      p_user_id: userId,
      p_admin_id: user.id,
      p_reason: reason,
    });

    if (error) {
      console.error('[useAdminActions] Error warning user:', error);
      return false;
    }

    return true;
  };

  /**
   * Suspender um usuário
   */
  const suspendUser = async (
    userId: string,
    reason: string,
    durationDays: number = 7
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('suspend_user', {
      p_user_id: userId,
      p_admin_id: user.id,
      p_reason: reason,
      p_duration_days: durationDays,
    });

    if (error) {
      console.error('[useAdminActions] Error suspending user:', error);
      return false;
    }

    return true;
  };

  /**
   * Banir um usuário permanentemente
   */
  const banUser = async (userId: string, reason: string): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('ban_user', {
      p_user_id: userId,
      p_admin_id: user.id,
      p_reason: reason,
    });

    if (error) {
      console.error('[useAdminActions] Error banning user:', error);
      return false;
    }

    return true;
  };

  /**
   * Enviar notificação em massa
   */
  const sendMassNotification = async (
    title: string,
    message: string,
    notificationType: string,
    targetAudience: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('send_mass_notification', {
      p_admin_id: user.id,
      p_title: title,
      p_message: message,
      p_notification_type: notificationType,
      p_target_audience: targetAudience,
    });

    if (error) {
      console.error('[useAdminActions] Error sending notification:', error);
      return false;
    }

    return true;
  };

  /**
   * Buscar histórico de notificações
   */
  const getNotificationHistory = async (): Promise<NotificationHistory[]> => {
    const { data, error } = await supabase
      .from('admin_notifications_history')
      .select('*')
      .limit(50);

    if (error) {
      console.error('[useAdminActions] Error fetching notification history:', error);
      return [];
    }

    return data || [];
  };

  /**
   * Buscar logs de admin
   */
  const getAdminLogs = async (limit: number = 100) => {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[useAdminActions] Error fetching admin logs:', error);
      return [];
    }

    return data || [];
  };

  return {
    getDashboardStats,
    getUserProfiles,
    warnUser,
    suspendUser,
    banUser,
    sendMassNotification,
    getNotificationHistory,
    getAdminLogs,
  };
}
