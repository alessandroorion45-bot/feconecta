import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PLATFORM_REACTIONS, REACTION_BY_KEY } from "@/lib/feed/feedTypes";
import type { FeedItem } from "@/lib/feed/feedTypes";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";

interface FeedReactionPickerProps {
  item: FeedItem;
  userId: string | undefined;
  onPatch: (key: string, patch: (i: FeedItem) => Partial<FeedItem>) => void;
}

export const FeedReactionPicker = ({ item, userId, onPatch }: FeedReactionPickerProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const totalReactions = Object.values(item.reaction_counts || {}).reduce((a, b) => a + b, 0);
  const myReaction = item.my_reaction ? REACTION_BY_KEY[item.my_reaction] : null;

  const react = async (reactionKey: string) => {
    if (!userId) {
      toast({ title: "Faça login", description: "Você precisa estar logado para reagir", variant: "destructive" });
      return;
    }
    setOpen(false);

    const removing = item.my_reaction === reactionKey;
    const previous = item.my_reaction;

    // Otimista
    onPatch(item.key, (i) => {
      const counts = { ...(i.reaction_counts || {}) };
      if (previous) counts[previous] = Math.max(0, (counts[previous] || 1) - 1);
      if (!removing) counts[reactionKey] = (counts[reactionKey] || 0) + 1;
      return { reaction_counts: counts, my_reaction: removing ? null : reactionKey };
    });

    try {
      if (removing) {
        await (supabase as any)
          .from('feed_reactions')
          .delete()
          .eq('user_id', userId)
          .eq('item_type', item.type)
          .eq('item_id', item.id);
      } else {
        await (supabase as any)
          .from('feed_reactions')
          .upsert(
            { user_id: userId, item_type: item.type, item_id: item.id, reaction: reactionKey },
            { onConflict: 'user_id,item_type,item_id' }
          );
      }
    } catch {
      toast({
        title: "Reações indisponíveis",
        description: "Aplique a atualização do banco (APLICAR_FEED_SQL.sql) para ativar as reações",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5", myReaction && "text-primary")}
        >
          {myReaction ? (
            <span className="text-base leading-none">{myReaction.emoji}</span>
          ) : (
            <SmilePlus className="h-4 w-4" />
          )}
          {totalReactions > 0 && <span className="text-xs">{totalReactions}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {PLATFORM_REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => react(r.key)}
              title={r.label}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg p-2 hover:bg-muted transition-colors",
                item.my_reaction === r.key && "bg-primary/10 ring-1 ring-primary/30"
              )}
            >
              <span className="text-xl leading-none">{r.emoji}</span>
              <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[52px]">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
