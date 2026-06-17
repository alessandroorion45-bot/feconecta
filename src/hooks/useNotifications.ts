import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  actor_id: string;
  reference_id: string | null;
  profiles: {
    username: string;
    avatar_url: string;
  } | null;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error('[useNotifications] Error loading notifications:', error);
      return;
    }

    if (data) {
      const actorIds = data.map(n => n.actor_id).filter(Boolean);
      const uniqueActorIds = [...new Set(actorIds)];
      
      let profileMap = new Map();
      if (uniqueActorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", uniqueActorIds);
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      const notificationsWithProfiles = data.map(n => ({
        ...n,
        profiles: n.actor_id ? profileMap.get(n.actor_id) || null : null
      }));

      setNotifications(notificationsWithProfiles as Notification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    const setupChannel = async () => {
      if (!user) return;

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            toastRef.current({
              title: "Nova notificação",
              description: newNotif.content,
            });
          }
        )
        .subscribe();
    };

    loadNotifications();
    setupChannel();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications,
  };
};
