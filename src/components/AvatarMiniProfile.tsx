import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, MessageCircle, Check, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MiniProfileData {
  full_name: string;
  username: string;
  avatar_url: string | null;
  church_role: string | null;
  city: string | null;
  country: string | null;
  level: number | null;
  title: string | null;
  badgeIcon: string | null;
  badgeName: string | null;
  vipTier: "standard" | "gold" | "platinum" | null;
}

type Relationship = "self" | "friend" | "pending" | "none";

export const AvatarMiniProfile = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<MiniProfileData | null>(null);
  const [relationship, setRelationship] = useState<Relationship>("none");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const isSelf = currentUser?.id === userId;

      const [profileRes, statsRes, badgeRes, vipRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, username, avatar_url, church_role, city, country")
          .eq("id", userId)
          .maybeSingle(),
        (supabase.from("user_stats" as any) as any)
          .select("level, title")
          .eq("user_id", userId)
          .maybeSingle(),
        (supabase.from("user_badges" as any) as any)
          .select("badge_id, badges(icon, name)")
          .eq("user_id", userId)
          .eq("is_equipped", true)
          .maybeSingle(),
        supabase.rpc("get_vip_tier", { user_id: userId }),
      ]);

      if (cancelled) return;

      const profile = profileRes.data;
      const stats = statsRes?.data;
      const badge = badgeRes?.data;

      setData({
        full_name: profile?.full_name || "Usuário",
        username: profile?.username || "",
        avatar_url: profile?.avatar_url || null,
        church_role: profile?.church_role || null,
        city: profile?.city || null,
        country: profile?.country || null,
        level: stats?.level ?? null,
        title: stats?.title ?? null,
        badgeIcon: badge?.badges?.icon ?? null,
        badgeName: badge?.badges?.name ?? null,
        vipTier: (vipRes?.data as any) || null,
      });

      if (isSelf) {
        setRelationship("self");
      } else if (currentUser) {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("id")
          .or(
            `and(user_id_1.eq.${currentUser.id},user_id_2.eq.${userId}),and(user_id_1.eq.${userId},user_id_2.eq.${currentUser.id})`
          )
          .maybeSingle();

        if (friendship) {
          setRelationship("friend");
        } else {
          const { data: pendingReq } = await supabase
            .from("friend_requests")
            .select("id, status")
            .or(
              `and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`
            )
            .eq("status", "pending")
            .maybeSingle();
          setRelationship(pendingReq ? "pending" : "none");
        }
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, currentUser]);

  const handleAddFriend = async () => {
    if (!currentUser || sending) return;
    setSending(true);
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: currentUser.id,
      receiver_id: userId,
    });
    setSending(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar o pedido.", variant: "destructive" });
      return;
    }
    setRelationship("pending");
    toast({ title: "Pedido enviado! 🎉", description: "Aguarde a confirmação do irmão(ã)." });
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-primary flex items-center justify-center text-xl font-semibold text-primary-foreground">
          {data.avatar_url ? (
            <img src={data.avatar_url} alt={data.full_name} className="h-full w-full object-cover object-center" />
          ) : (
            data.full_name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{data.full_name}</p>
          {data.username && <p className="text-xs text-muted-foreground truncate">@{data.username}</p>}
          {(data.city || data.country) && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              {[data.city, data.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.level != null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            Nível {data.level}
          </span>
        )}
        {data.title && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{data.title}</span>
        )}
        {data.vipTier && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
            ⭐ VIP {data.vipTier}
          </span>
        )}
        {data.badgeIcon && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
            {data.badgeIcon} {data.badgeName}
          </span>
        )}
        {data.church_role && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{data.church_role}</span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/profile/${userId}`)}>
          Ver Perfil
        </Button>

        {relationship === "friend" && (
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => navigate("/chat", { state: { openFriendId: userId } })}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Mensagem
          </Button>
        )}

        {relationship === "none" && (
          <Button size="sm" className="flex-1 gap-1.5" onClick={handleAddFriend} disabled={sending}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Adicionar
          </Button>
        )}

        {relationship === "pending" && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" disabled>
            <Clock className="h-3.5 w-3.5" />
            Pendente
          </Button>
        )}

        {relationship === "self" && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" disabled>
            <Check className="h-3.5 w-3.5" />
            Você
          </Button>
        )}
      </div>
    </div>
  );
};
