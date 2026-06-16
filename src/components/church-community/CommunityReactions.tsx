import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommunityReactionsProps {
  votingId?: string;
  evaluationId?: string;
  commentId?: string;
  userId: string;
}

interface ReactionCount {
  praise: number;
  pray: number;
  celebrate: number;
}

const REACTIONS = [
  { type: "praise", emoji: "🙌", label: "Louvor" },
  { type: "pray", emoji: "🙏", label: "Oração" },
  { type: "celebrate", emoji: "🎉", label: "Celebrar" },
] as const;

const CommunityReactions = ({ votingId, evaluationId, commentId, userId }: CommunityReactionsProps) => {
  const { toast } = useToast();
  const [counts, setCounts] = useState<ReactionCount>({ praise: 0, pray: 0, celebrate: 0 });
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [votingId, evaluationId, commentId]);

  const loadReactions = async () => {
    try {
      let query = supabase.from("community_reactions").select("reaction_type, user_id");

      if (votingId) query = query.eq("voting_id", votingId);
      if (evaluationId) query = query.eq("evaluation_id", evaluationId);
      if (commentId) query = query.eq("comment_id", commentId);

      const { data, error } = await query;
      if (error) throw error;

      // Count reactions
      const newCounts: ReactionCount = { praise: 0, pray: 0, celebrate: 0 };
      const newUserReactions = new Set<string>();

      (data || []).forEach(r => {
        const type = r.reaction_type as keyof ReactionCount;
        if (type in newCounts) {
          newCounts[type]++;
        }
        if (r.user_id === userId) {
          newUserReactions.add(r.reaction_type);
        }
      });

      setCounts(newCounts);
      setUserReactions(newUserReactions);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const toggleReaction = async (reactionType: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const hasReaction = userReactions.has(reactionType);

      if (hasReaction) {
        // Remove reaction
        let query = supabase
          .from("community_reactions")
          .delete()
          .eq("user_id", userId)
          .eq("reaction_type", reactionType);

        if (votingId) query = query.eq("voting_id", votingId);
        if (evaluationId) query = query.eq("evaluation_id", evaluationId);
        if (commentId) query = query.eq("comment_id", commentId);

        const { error } = await query;
        if (error) throw error;

        setUserReactions(prev => {
          const next = new Set(prev);
          next.delete(reactionType);
          return next;
        });
        setCounts(prev => ({
          ...prev,
          [reactionType]: Math.max(0, prev[reactionType as keyof ReactionCount] - 1),
        }));
      } else {
        // Add reaction
        const { error } = await supabase
          .from("community_reactions")
          .insert({
            user_id: userId,
            voting_id: votingId || null,
            evaluation_id: evaluationId || null,
            comment_id: commentId || null,
            reaction_type: reactionType,
          });

        if (error) throw error;

        setUserReactions(prev => new Set(prev).add(reactionType));
        setCounts(prev => ({
          ...prev,
          [reactionType]: prev[reactionType as keyof ReactionCount] + 1,
        }));
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = counts[type as keyof ReactionCount];
        const hasReacted = userReactions.has(type);

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 gap-1 text-sm",
              hasReacted && "bg-amber-100 dark:bg-amber-900/30"
            )}
            onClick={() => toggleReaction(type)}
            disabled={loading}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
};

export default CommunityReactions;
