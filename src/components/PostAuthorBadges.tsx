import { useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { UserBadge } from "@/components/UserBadge";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  badge_name: string;
  badge_icon: string;
  badge_color: string;
}

interface PostAuthorBadgesProps {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export const PostAuthorBadges = ({ 
  userId, 
  username, 
  fullName, 
  avatarUrl 
}: PostAuthorBadgesProps) => {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadUserBadges();
  }, [userId]);

  const loadUserBadges = async () => {
    const { data } = await supabase
      .from("user_badges")
      .select("badge_name, badge_icon, badge_color")
      .eq("user_id", userId)
      .order("display_order", { ascending: true })
      .limit(3);

    if (data) {
      setBadges(data);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <UserAvatar
        src={avatarUrl}
        fallback={fullName || "U"}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{fullName}</p>
        <p className="text-sm text-muted-foreground truncate">@{username}</p>
        {badges.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {badges.map((badge, index) => (
              <UserBadge
                key={index}
                icon={badge.badge_icon}
                name={badge.badge_name}
                color={badge.badge_color}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
