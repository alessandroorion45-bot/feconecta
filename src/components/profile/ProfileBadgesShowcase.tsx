import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import KingdomBadge from "@/components/kingdom-badges/KingdomBadge";
import { Crown, ChevronRight } from "lucide-react";

const sb = supabase as any;

interface ShowcaseBadge {
  id: string;
  is_equipped: boolean;
  badges: {
    name: string;
    icon: string;
    image_url: string | null;
    rarity: string;
  } | null;
}

interface ProfileBadgesShowcaseProps {
  userId: string;
}

/** 🏆 Meus Selos — os 6 principais (equipado primeiro), com a medalha real */
const ProfileBadgesShowcase = memo(({ userId }: ProfileBadgesShowcaseProps) => {
  const [items, setItems] = useState<ShowcaseBadge[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    sb.from("user_badges")
      .select("id, is_equipped, badges(name, icon, image_url, rarity)")
      .eq("user_id", userId)
      .order("is_equipped", { ascending: false })
      .order("unlocked_at", { ascending: false })
      .limit(6)
      .then(({ data }: { data: ShowcaseBadge[] | null }) => {
        if (!cancelled) setItems(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-[250ms]">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-border/50">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Crown className="h-4 w-4 text-amber-500" />
          Meus Selos
        </span>
        <Link
          to="/gamification"
          className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
        >
          Ver coleção completa <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 p-4 overflow-x-auto snap-x sm:justify-center">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1.5 shrink-0 snap-start" title={item.badges?.name}>
            <KingdomBadge
              rarity={item.badges?.rarity || "common"}
              imageUrl={item.badges?.image_url}
              emoji={item.badges?.icon}
              equipped={item.is_equipped}
              size="sm"
            />
            <span className="text-[10px] text-muted-foreground max-w-[72px] truncate text-center">
              {item.badges?.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

ProfileBadgesShowcase.displayName = "ProfileBadgesShowcase";

export default ProfileBadgesShowcase;
