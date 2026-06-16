import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Vote, Check, Clock, Users, MessageSquare, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommunityReactions from "./CommunityReactions";
import CommunityComments from "./CommunityComments";

interface VotingOption {
  id: string;
  text: string;
  votes_count: number;
}

interface Voting {
  id: string;
  title: string;
  description: string | null;
  voting_type: string;
  is_anonymous_votes: boolean;
  options: VotingOption[];
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  created_by: string;
}

interface VotingListProps {
  communityId: string;
  userId: string;
}

const VotingList = ({ communityId, userId }: VotingListProps) => {
  const { toast } = useToast();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [userVotes, setUserVotes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  const [confirmVote, setConfirmVote] = useState<{ votingId: string; optionId: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVotings();

    // Realtime subscription
    const channel = supabase
      .channel(`votings-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_votings',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          loadVotings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, userId]);

  const loadVotings = async () => {
    try {
      const { data: votingsData, error: votingsError } = await supabase
        .from("community_votings")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });

      if (votingsError) throw votingsError;

      // Parse options from JSONB
      const parsedVotings = (votingsData || []).map(v => ({
        ...v,
        options: (v.options as unknown as VotingOption[]) || [],
      }));

      setVotings(parsedVotings);

      // Load user's votes
      const { data: votes, error: votesError } = await supabase
        .from("community_votes")
        .select("voting_id, option_id")
        .eq("user_id", userId);

      if (!votesError && votes) {
        setUserVotes(new Map(votes.map(v => [v.voting_id, v.option_id])));
      }
    } catch (error) {
      console.error("Error loading votings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!confirmVote) return;

    const { votingId, optionId } = confirmVote;
    setVotingInProgress(votingId);

    try {
      // Insert vote
      const { error: voteError } = await supabase
        .from("community_votes")
        .insert({
          voting_id: votingId,
          user_id: userId,
          option_id: optionId,
          is_public: false,
        });

      if (voteError) throw voteError;

      // Update options count in voting
      const voting = votings.find(v => v.id === votingId);
      if (voting) {
        const updatedOptions = voting.options.map(opt => ({
          ...opt,
          votes_count: opt.id === optionId ? opt.votes_count + 1 : opt.votes_count,
        }));

        await supabase
          .from("community_votings")
          .update({ options: updatedOptions })
          .eq("id", votingId);
      }

      toast({
        title: "Voto registrado!",
        description: "Obrigado por participar desta decisão.",
      });

      setUserVotes(prev => new Map(prev).set(votingId, optionId));
      loadVotings();
    } catch (error: any) {
      toast({
        title: "Erro ao votar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVotingInProgress(null);
      setConfirmVote(null);
    }
  };

  const getTotalVotes = (options: VotingOption[]) => {
    return options.reduce((sum, opt) => sum + opt.votes_count, 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 w-full bg-muted rounded" />
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (votings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma votação ainda</h3>
          <p className="text-muted-foreground">
            Crie a primeira votação para a comunidade decidir juntos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {votings.map(voting => {
          const hasVoted = userVotes.has(voting.id);
          const userVote = userVotes.get(voting.id);
          const totalVotes = getTotalVotes(voting.options);
          const isActive = voting.status === "active";
          const showComments = expandedComments.has(voting.id);

          return (
            <Card key={voting.id} className={!isActive ? "opacity-75" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {voting.title}
                      {voting.is_anonymous_votes ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    {voting.description && (
                      <CardDescription className="mt-1">{voting.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Encerrada
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {totalVotes} votos
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Options */}
                <div className="space-y-2">
                  {voting.options.map(option => {
                    const percentage = getVotePercentage(option.votes_count, totalVotes);
                    const isSelected = userVote === option.id;

                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`justify-start flex-1 mr-2 ${isSelected ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                            disabled={hasVoted || !isActive || votingInProgress === voting.id}
                            onClick={() => setConfirmVote({ votingId: voting.id, optionId: option.id })}
                          >
                            {isSelected && <Check className="h-4 w-4 mr-2" />}
                            {option.text}
                          </Button>
                          <span className="text-sm font-medium w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                {/* Reactions */}
                <CommunityReactions
                  votingId={voting.id}
                  userId={userId}
                />

                {/* Comments Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const newExpanded = new Set(expandedComments);
                    if (showComments) {
                      newExpanded.delete(voting.id);
                    } else {
                      newExpanded.add(voting.id);
                    }
                    setExpandedComments(newExpanded);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showComments ? "Ocultar comentários" : "Ver comentários"}
                </Button>

                {/* Comments */}
                {showComments && (
                  <CommunityComments
                    communityId={communityId}
                    votingId={voting.id}
                    userId={userId}
                  />
                )}

                {/* Date */}
                <p className="text-xs text-muted-foreground text-right">
                  Criada em {format(new Date(voting.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmVote} onOpenChange={(open) => !open && setConfirmVote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-amber-500" />
              Confirmar Voto
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-200 text-center italic">
                  "Lembre-se: Deus sonda o coração de cada um. Vote com sabedoria e fé."
                </p>
              </div>
              <p className="text-center">
                Deseja confirmar seu voto? Esta ação não pode ser desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVote}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Confirmar Voto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VotingList;
