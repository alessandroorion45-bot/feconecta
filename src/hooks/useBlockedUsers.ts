import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useBlockedUsers = (currentUserId: string) => {
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [blockedByUserIds, setBlockedByUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      loadBlockedUsers();
    }
  }, [currentUserId]);

  const loadBlockedUsers = async () => {
    try {
      // Users I blocked
      const { data: blocked } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", currentUserId);

      // Users who blocked me
      const { data: blockedBy } = await supabase
        .from("blocked_users")
        .select("blocker_id")
        .eq("blocked_id", currentUserId);

      setBlockedUserIds(new Set(blocked?.map(b => b.blocked_id) || []));
      setBlockedByUserIds(new Set(blockedBy?.map(b => b.blocker_id) || []));
    } catch (error) {
      console.error("Error loading blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = (userId: string): boolean => {
    return blockedUserIds.has(userId) || blockedByUserIds.has(userId);
  };

  const blockUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: currentUserId,
          blocked_id: userId
        });

      if (error) throw error;

      setBlockedUserIds(prev => new Set([...prev, userId]));
      return true;
    } catch (error) {
      console.error("Error blocking user:", error);
      return false;
    }
  };

  const unblockUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", userId);

      if (error) throw error;

      setBlockedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      return true;
    } catch (error) {
      console.error("Error unblocking user:", error);
      return false;
    }
  };

  const filterBlockedUsers = <T extends { id: string }>(users: T[]): T[] => {
    return users.filter(user => !isBlocked(user.id));
  };

  return {
    blockedUserIds,
    blockedByUserIds,
    loading,
    isBlocked,
    blockUser,
    unblockUser,
    filterBlockedUsers,
    refresh: loadBlockedUsers
  };
};

export default useBlockedUsers;
