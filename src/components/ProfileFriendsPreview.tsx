import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Friend {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

interface ProfileFriendsPreviewProps {
  userId: string;
  maxDisplay?: number;
}

export const ProfileFriendsPreview = ({ userId, maxDisplay = 6 }: ProfileFriendsPreviewProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        // Get friendships where user is either user_id_1 or user_id_2
        const { data: friendships, error } = await supabase
          .from("friendships")
          .select("user_id_1, user_id_2")
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

        if (error) throw error;

        if (!friendships || friendships.length === 0) {
          setLoading(false);
          return;
        }

        // Get friend IDs (the other user in each friendship)
        const friendIds = friendships.map(f => 
          f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
        );

        setTotalCount(friendIds.length);

        // Get profiles for display
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", friendIds.slice(0, maxDisplay));

        if (profiles) {
          setFriends(profiles);
        }
      } catch (error) {
        console.error("Error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [userId, maxDisplay]);

  if (loading) {
    return (
      <div className="orkut-card">
        <div className="orkut-card-header">
          <Users className="h-4 w-4" />
          <span>Meus amigos</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-[52px] w-9 rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-12 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orkut-card">
      <div className="orkut-card-header">
        <Users className="h-4 w-4" />
        <span>Meus amigos ({totalCount})</span>
      </div>
      <div className="p-4">
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum amigo ainda 😊
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                to={`/friend/${friend.id}`}
                className="flex flex-col items-center gap-1 group hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  src={friend.avatar_url}
                  fallback={friend.full_name}
                  size="sm"
                  className="ring-2 ring-border group-hover:ring-primary/50 transition-all"
                />
                <span className="text-xs text-muted-foreground truncate max-w-full text-center">
                  {friend.full_name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        )}
        {totalCount > maxDisplay && (
          <Link
            to="/friends"
            className="block text-center text-sm text-primary hover:underline mt-3"
          >
            Ver todos ({totalCount})
          </Link>
        )}
      </div>
    </div>
  );
};
