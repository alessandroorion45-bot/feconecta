import { useState, useEffect } from 'react';
import { Heart, HandIcon as Pray, Flame, Sparkles, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VerseReactionsProps {
  book: string;
  chapter: number;
  verse: number;
  stats: any;
  onUpdate: (stats: any) => void;
}

const REACTIONS = [
  { type: 'heart', icon: Heart, label: 'Tocou meu coração', color: 'text-red-500' },
  { type: 'amen', icon: Pray, label: 'Amém', color: 'text-blue-500' },
  { type: 'fire', icon: Flame, label: 'Palavra poderosa', color: 'text-orange-500' },
  { type: 'sparkle', icon: Sparkles, label: 'Inspirador', color: 'text-yellow-500' },
  { type: 'praise', icon: Hand, label: 'Glória a Deus', color: 'text-purple-500' },
];

export const VerseReactions = ({ book, chapter, verse, stats, onUpdate }: VerseReactionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const loadMyReactions = async () => {
      const { data } = await supabase
        .from('verse_reactions')
        .select('reaction_type')
        .eq('user_id', user.id)
        .eq('book', book)
        .eq('chapter', chapter)
        .eq('verse', verse);

      if (data) {
        setMyReactions(new Set(data.map(r => r.reaction_type)));
      }
    };

    loadMyReactions();
  }, [user, book, chapter, verse]);

  const handleReaction = async (type: string) => {
    if (!user) {
      toast({ title: 'Faça login para reagir', variant: 'destructive' });
      return;
    }

    const hasReacted = myReactions.has(type);

    try {
      if (hasReacted) {
        await supabase
          .from('verse_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('book', book)
          .eq('chapter', chapter)
          .eq('verse', verse)
          .eq('reaction_type', type);

        setMyReactions(prev => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });

        const newReactions = { ...stats.reactions };
        newReactions[type] = Math.max(0, (newReactions[type] || 0) - 1);
        onUpdate({ ...stats, reactions: newReactions });
      } else {
        await supabase.from('verse_reactions').insert({
          user_id: user.id,
          book,
          chapter,
          verse,
          reaction_type: type,
        });

        setMyReactions(prev => new Set([...prev, type]));

        const newReactions = { ...stats.reactions };
        newReactions[type] = (newReactions[type] || 0) + 1;
        onUpdate({ ...stats, reactions: newReactions });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
      {REACTIONS.map(({ type, icon: Icon, label, color }) => {
        const count = stats.reactions?.[type] || 0;
        const isActive = myReactions.has(type);

        return (
          <Button
            key={type}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReaction(type)}
            className={`gap-2 ${isActive ? color : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && <span className="text-xs opacity-70">({count})</span>}
          </Button>
        );
      })}
    </div>
  );
};
