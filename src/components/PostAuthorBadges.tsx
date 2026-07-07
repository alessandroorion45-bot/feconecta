import { useEffect, useState } from "react";
import { AvatarPro } from "@/components/AvatarPro";
import { UserBadge } from "@/components/UserBadge";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  badge_name: string;
  badge_icon: string;
  badge_color: string;
}

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#f43f5e",
};

interface PostAuthorBadgesProps {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
}

export const PostAuthorBadges = ({
  userId,
  fullName,
  avatarUrl
}: PostAuthorBadgesProps) => {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadUserBadges();
  }, [userId]);

  const loadUserBadges = async () => {
    const { data } = await (supabase.from("user_badges" as any) as any)
      .select("unlocked_at, badges(name, icon, rarity)")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false })
      .limit(3);

    if (data) {
      setBadges(
        data.map((row: any) => ({
          badge_name: row.badges?.name || "",
          badge_icon: row.badges?.icon || "🏅",
          badge_color: RARITY_COLOR[row.badges?.rarity] || RARITY_COLOR.common,
        }))
      );
    }
  };

  return (
    <div className="flex items-start gap-3">
      <AvatarPro
        src={avatarUrl}
        name={fullName || "U"}
        userId={userId}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{fullName}</p>
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
