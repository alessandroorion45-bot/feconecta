import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Crown, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MemberMinistryBadges from "./MemberMinistryBadges";
import RectAvatar from "@/components/RectAvatar";
import { COMMUNITY_ROLES, getRoleInfo } from "@/lib/communityRoles";

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  ministries: string[] | null;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface CommunityMembersProps {
  communityId: string;
  communityName?: string;
  userId: string;
  isAdmin: boolean;
}

const CommunityMembers = ({ communityId, communityName, userId, isAdmin }: CommunityMembersProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    loadMembers();

    // Realtime subscription
    const channel = supabase
      .channel(`community-members-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "church_community_members",
          filter: `community_id=eq.${communityId}`,
        },
        () => loadMembers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const loadMembers = async () => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from("church_community_members")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;

      // Load profiles
      const enrichedMembers = await Promise.all(
        (membersData || []).map(async (m) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", m.user_id)
            .single();
          return { ...m, profile };
        })
      );

      // Sort by role: admins first, then leaders, then members
      const sortedMembers = enrichedMembers.sort((a, b) => {
        const roleOrder: Record<string, number> = { admin: 0, leader: 1, member: 2 };
        return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
      });

      setMembers(sortedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      // Deactivate member
      const { error } = await supabase
        .from("church_community_members")
        .update({ 
          is_active: false, 
          left_at: new Date().toISOString() 
        })
        .eq("id", memberToRemove.id);

      if (error) throw error;

      // Log the action
      await supabase.from("community_action_history").insert({
        community_id: communityId,
        action_type: "member_removed",
        performed_by: userId,
        target_user_id: memberToRemove.user_id,
        details: {
          member_name: memberToRemove.profile?.full_name,
          removed_at: new Date().toISOString(),
        },
      });

      // Notify the removed member
      await supabase.from("notifications").insert({
        user_id: memberToRemove.user_id,
        actor_id: userId,
        type: "community_removed",
        content: `Você foi removido da comunidade "${communityName || "Igreja"}" pelo administrador.`,
        reference_id: communityId,
      });

      toast({
        title: "✅ Membro removido",
        description: `${memberToRemove.profile?.full_name} foi removido da comunidade.`,
      });

      setMemberToRemove(null);
    } catch (error: any) {
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const info = getRoleInfo(role);
    if (role === "admin") {
      return (
        <Badge className="bg-amber-500 text-white flex items-center gap-1">
          <Crown className="h-3 w-3" />
          {info.label}
        </Badge>
      );
    }
    if (role === "member" || !role) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <span>{info.emoji}</span>
          {info.label}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500 text-white flex items-center gap-1">
        <span>{info.emoji}</span>
        {info.label}
      </Badge>
    );
  };

  const handleChangeRole = async (member: Member, newRole: string) => {
    try {
      const { error } = await supabase
        .from("church_community_members")
        .update({ role: newRole })
        .eq("id", member.id);

      if (error) throw error;

      setMembers(prev => prev.map(m => (m.id === member.id ? { ...m, role: newRole } : m)));

      await supabase.from("notifications").insert({
        user_id: member.user_id,
        actor_id: userId,
        type: "community_role",
        content: `Você agora é ${getRoleInfo(newRole).label} na comunidade "${communityName || "Igreja"}".`,
        reference_id: communityId,
      });

      toast({
        title: "✅ Função atualizada",
        description: `${member.profile?.full_name} agora é ${getRoleInfo(newRole).label}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar função",
        description: error.message?.includes("policy")
          ? "Aplique a atualização do banco (APLICAR_COMUNIDADE_SQL.sql)"
          : error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhum membro ainda</h3>
          <p className="text-muted-foreground">
            Convide pessoas para participar desta comunidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Spiritual message */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-3 text-center">
            <p className="text-primary text-sm italic">
              "Assim, nós, que somos muitos, formamos um só corpo em Cristo." — Romanos 12:5
            </p>
          </CardContent>
        </Card>

        {/* Member count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{members.length} membros</span>
        </div>

        {/* Members grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <Card 
              key={member.id} 
              className="hover:shadow-md transition-shadow group relative"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(`/profile/${member.user_id}`)}
                  >
                    <RectAvatar
                      src={member.profile?.avatar_url}
                      fallback={member.profile?.full_name || "U"}
                      size="md"
                    />
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/profile/${member.user_id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {member.profile?.full_name || "Usuário"}
                        {member.user_id === userId && (
                          <span className="text-muted-foreground text-sm"> (você)</span>
                        )}
                      </p>
                      {getRoleBadge(member.role)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{member.profile?.username || "usuario"}
                    </p>
                    <MemberMinistryBadges ministries={member.ministries} maxShow={2} />

                    {/* Admin: alterar função do membro */}
                    {isAdmin && member.user_id !== userId && (
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={member.role || "member"}
                          onValueChange={(v) => handleChangeRole(member, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COMMUNITY_ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                <span className="flex items-center gap-2">
                                  <span>{r.emoji}</span>
                                  {r.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Admin: Remove member button */}
                  {isAdmin && member.user_id !== userId && member.role !== "admin" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMemberToRemove(member);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir membro da comunidade</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Remove Member Confirmation */}
        <AlertDialog 
          open={!!memberToRemove} 
          onOpenChange={(open) => !open && setMemberToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Remover Membro
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover{" "}
                <strong>{memberToRemove?.profile?.full_name}</strong> da comunidade?
                <br /><br />
                O membro será notificado sobre a remoção.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRemoving}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                disabled={isRemoving}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default CommunityMembers;
