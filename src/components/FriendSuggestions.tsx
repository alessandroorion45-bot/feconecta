import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SuggestedFriend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  mutual_friends_count: number;
  mutual_friends: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }[];
}

interface FriendSuggestionsProps {
  currentUserId: string;
  onRequestSent?: () => void;
}

export const FriendSuggestions = ({ currentUserId, onRequestSent }: FriendSuggestionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUserId) {
      loadBlockedUsers().then(() => loadSuggestions());
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

      const blockedIds = new Set([
        ...(blocked?.map(b => b.blocked_id) || []),
        ...(blockedBy?.map(b => b.blocker_id) || [])
      ]);
      setBlockedUserIds(blockedIds);
    } catch (error) {
      console.error("Error loading blocked users:", error);
    }
  };

  const loadSuggestions = async () => {
    try {
      // Get current user's friends
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

      if (!friendships || friendships.length === 0) {
        setLoading(false);
        return;
      }

      const myFriendIds = friendships.map(f =>
        f.user_id_1 === currentUserId ? f.user_id_2 : f.user_id_1
      );

      // Get friends of friends
      const { data: friendsOfFriends } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(myFriendIds.map(id => `user_id_1.eq.${id},user_id_2.eq.${id}`).join(","));

      if (!friendsOfFriends) {
        setLoading(false);
        return;
      }

      // Count mutual friends for each potential suggestion
      const mutualFriendsMap = new Map<string, string[]>();

      friendsOfFriends.forEach(friendship => {
        const friendId = myFriendIds.includes(friendship.user_id_1) 
          ? friendship.user_id_1 
          : friendship.user_id_2;
        const suggestedId = friendship.user_id_1 === friendId 
          ? friendship.user_id_2 
          : friendship.user_id_1;

        // Skip if it's the current user or already a friend
        if (suggestedId === currentUserId || myFriendIds.includes(suggestedId)) {
          return;
        }

        if (!mutualFriendsMap.has(suggestedId)) {
          mutualFriendsMap.set(suggestedId, []);
        }
        mutualFriendsMap.get(suggestedId)!.push(friendId);
      });

      // Get existing friend requests to exclude
      const { data: existingRequests } = await supabase
        .from("friend_requests")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq("status", "pending");

      const pendingUserIds = new Set(
        existingRequests?.map(r => 
          r.sender_id === currentUserId ? r.receiver_id : r.sender_id
        ) || []
      );

      // Filter suggestions with at least 1 mutual friend, no pending requests, and not blocked
      const suggestedIds = Array.from(mutualFriendsMap.entries())
        .filter(([id, mutuals]) => 
          mutuals.length >= 1 && 
          !pendingUserIds.has(id) && 
          !blockedUserIds.has(id)
        )
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 6)
        .map(([id]) => id);

      if (suggestedIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get profiles for suggestions
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", suggestedIds);

      // Get mutual friends profiles
      const allMutualIds = [...new Set(
        suggestedIds.flatMap(id => mutualFriendsMap.get(id) || [])
      )];

      const { data: mutualProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", allMutualIds);

      const mutualProfilesMap = new Map(
        mutualProfiles?.map(p => [p.id, p]) || []
      );

      // Build suggestions with mutual friends info
      const suggestionsData: SuggestedFriend[] = (profiles || []).map(profile => {
        const mutualIds = mutualFriendsMap.get(profile.id) || [];
        return {
          ...profile,
          mutual_friends_count: mutualIds.length,
          mutual_friends: mutualIds
            .slice(0, 3)
            .map(id => mutualProfilesMap.get(id))
            .filter(Boolean) as SuggestedFriend["mutual_friends"]
        };
      }).sort((a, b) => b.mutual_friends_count - a.mutual_friends_count);

      setSuggestions(suggestionsData);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    setSendingRequest(userId);
    try {
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: currentUserId,
        receiver_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Pedido enviado! 🎉",
        description: "Aguarde a confirmação do usuário",
      });

      // Remove from suggestions with animation
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      onRequestSent?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o pedido",
        variant: "destructive",
      });
    } finally {
      setSendingRequest(null);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Sugestões de Amigos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          Sugestões de Amigos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${suggestion.id}`)}
                >
                  <div className="relative">
                    <UserAvatar
                      src={suggestion.avatar_url}
                      fallback={suggestion.full_name}
                      size="sm"
                      className="ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                    />
                    {suggestion.mutual_friends_count >= 3 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                      >
                        ⭐
                      </motion.div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                      {suggestion.full_name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {suggestion.mutual_friends_count} amigo{suggestion.mutual_friends_count !== 1 ? "s" : ""} em comum
                      </span>
                    </div>
                    {suggestion.mutual_friends.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex -space-x-2">
                          {suggestion.mutual_friends.slice(0, 3).map((mutual) => (
                            <div
                              key={mutual.id}
                              className="h-5 w-5 rounded-full border-2 border-background overflow-hidden"
                            >
                              <UserAvatar
                                src={mutual.avatar_url}
                                fallback={mutual.full_name}
                                size="xs"
                              />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                          {suggestion.mutual_friends[0]?.full_name.split(" ")[0]}
                          {suggestion.mutual_friends.length > 1 && ` +${suggestion.mutual_friends.length - 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => sendFriendRequest(suggestion.id)}
                  disabled={sendingRequest === suggestion.id}
                  className="gap-1 shrink-0 transition-all duration-300 hover:scale-105"
                >
                  {sendingRequest === suggestion.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default FriendSuggestions;
