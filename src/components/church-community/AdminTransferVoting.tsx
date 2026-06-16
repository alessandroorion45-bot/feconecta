import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Vote, CheckCircle, XCircle, Loader2, Crown, Users } from "lucide-react";
import RectAvatar from "@/components/RectAvatar";

interface Voting {
  id: string;
  candidate_id: string;
  initiated_by: string;
  total_members: number;
  votes_yes: number;
  votes_no: number;
  approval_threshold: number;
  status: string;
  created_at: string;
  candidate_profile?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  initiator_profile?: {
    full_name: string;
  };
}

interface AdminTransferVotingProps {
  communityId: string;
  userId: string;
}

const AdminTransferVoting = ({ communityId, userId }: AdminTransferVotingProps) => {
  const { toast } = useToast();
  const [voting, setVoting] = useState<Voting | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadActiveVoting();
    checkAdminStatus();
    
    // Realtime subscription
    const channel = supabase
      .channel(`admin-transfer-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_transfer_votings",
          filter: `community_id=eq.${communityId}`,
        },
        () => loadActiveVoting()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_transfer_votes",
        },
        () => loadActiveVoting()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, userId]);

  const checkAdminStatus = async () => {
    const { data } = await supabase
      .from("church_community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    setIsAdmin(data?.role === "admin");
  };

  const loadActiveVoting = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_transfer_votings")
        .select("*")
        .eq("community_id", communityId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Load candidate profile
        const { data: candidateProfile } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url")
          .eq("id", data.candidate_id)
          .single();

        // Load initiator profile
        const { data: initiatorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.initiated_by)
          .single();

        // Check if current user has voted
        const { data: voteData } = await supabase
          .from("admin_transfer_votes")
          .select("id")
          .eq("voting_id", data.id)
          .eq("user_id", userId)
          .maybeSingle();

        setHasVoted(!!voteData);
        setVoting({
          ...data,
          candidate_profile: candidateProfile || undefined,
          initiator_profile: initiatorProfile || undefined,
        });
      } else {
        setVoting(null);
      }
    } catch (error) {
      console.error("Error loading voting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote: boolean) => {
    if (!voting) return;

    setIsVoting(true);
    try {
      const { error } = await supabase.from("admin_transfer_votes").insert({
        voting_id: voting.id,
        user_id: userId,
        vote,
      });

      if (error) throw error;

      setHasVoted(true);

      // Check if voting should be resolved
      const newYes = vote ? voting.votes_yes + 1 : voting.votes_yes;
      const newNo = vote ? voting.votes_no : voting.votes_no + 1;
      const totalVotes = newYes + newNo;
      const yesPercentage = totalVotes > 0 ? newYes / totalVotes : 0;

      // If all members voted or threshold reached
      if (totalVotes === voting.total_members) {
        await resolveVoting(yesPercentage >= voting.approval_threshold);
      }

      toast({
        title: vote ? "✅ Voto registrado: Sim" : "❌ Voto registrado: Não",
        description: "Seu voto foi contabilizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao votar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const resolveVoting = async (approved: boolean) => {
    if (!voting) return;

    try {
      // Update voting status
      await supabase
        .from("admin_transfer_votings")
        .update({
          status: approved ? "approved" : "rejected",
          completed_at: new Date().toISOString(),
        })
        .eq("id", voting.id);

      if (approved) {
        // Transfer admin role
        // Remove admin from current admin
        await supabase
          .from("church_community_members")
          .update({ role: "member" })
          .eq("community_id", communityId)
          .eq("user_id", voting.initiated_by);

        // Give admin to new candidate
        await supabase
          .from("church_community_members")
          .update({ role: "admin" })
          .eq("community_id", communityId)
          .eq("user_id", voting.candidate_id);

        // Update community created_by
        await supabase
          .from("church_communities")
          .update({ created_by: voting.candidate_id })
          .eq("id", communityId);

        // Log the action
        await supabase.from("community_action_history").insert({
          community_id: communityId,
          action_type: "admin_transferred",
          performed_by: voting.initiated_by,
          target_user_id: voting.candidate_id,
          details: {
            voting_id: voting.id,
            votes_yes: voting.votes_yes + 1,
            votes_no: voting.votes_no,
          },
        });
      }

      // Notify all members
      const { data: membersData } = await supabase
        .from("church_community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("is_active", true);

      if (membersData) {
        const notifications = membersData.map((m) => ({
          user_id: m.user_id,
          actor_id: userId,
          type: approved ? "admin_transfer_approved" : "admin_transfer_rejected",
          content: approved
            ? `${voting.candidate_profile?.full_name} é o novo administrador da comunidade! 👑`
            : `A transferência de administração para ${voting.candidate_profile?.full_name} não foi aprovada.`,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (error) {
      console.error("Error resolving voting:", error);
    }
  };

  const handleCancelVoting = async () => {
    if (!voting) return;

    try {
      await supabase
        .from("admin_transfer_votings")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", voting.id);

      toast({
        title: "Votação cancelada",
        description: "A votação foi cancelada pelo administrador.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!voting) return null;

  const totalVotes = voting.votes_yes + voting.votes_no;
  const voteProgress = voting.total_members > 0 
    ? (totalVotes / voting.total_members) * 100 
    : 0;
  const yesPercentage = totalVotes > 0 
    ? (voting.votes_yes / totalVotes) * 100 
    : 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            Votação de Transferência de Administração
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            Em andamento
          </Badge>
        </div>
        <CardDescription>
          Iniciada por {voting.initiator_profile?.full_name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Candidate Info */}
        <div className="flex items-center gap-4 p-3 bg-background/50 rounded-lg">
          <RectAvatar
            src={voting.candidate_profile?.avatar_url}
            fallback={voting.candidate_profile?.full_name || "Candidato"}
            size="md"
          />
          <div className="flex-1">
            <p className="font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              {voting.candidate_profile?.full_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Candidato a novo administrador
            </p>
          </div>
        </div>

        {/* Voting Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Progresso da votação
            </span>
            <span className="font-medium">
              {totalVotes} de {voting.total_members} membros votaram
            </span>
          </div>
          <Progress value={voteProgress} className="h-2" />
        </div>

        {/* Vote Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{voting.votes_yes}</p>
            <p className="text-sm text-muted-foreground">Sim</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">{voting.votes_no}</p>
            <p className="text-sm text-muted-foreground">Não</p>
          </div>
        </div>

        {/* Approval Status */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Aprovação necessária: <strong>80%</strong>
          </p>
          {totalVotes > 0 && (
            <p className={yesPercentage >= 80 ? "text-emerald-600" : "text-amber-600"}>
              Atual: <strong>{yesPercentage.toFixed(1)}%</strong> de aprovação
            </p>
          )}
        </div>

        {/* Voting Buttons */}
        {!hasVoted ? (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => handleVote(false)}
              disabled={isVoting}
              className="border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              {isVoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Não aprovar
                </>
              )}
            </Button>
            <Button
              onClick={() => handleVote(true)}
              disabled={isVoting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isVoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <Badge className="bg-primary/10 text-primary">
              ✓ Você já votou
            </Badge>
          </div>
        )}

        {/* Admin Cancel Button */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelVoting}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            Cancelar votação
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTransferVoting;
