// =====================================================
// VERSE ACTIONS - Ações sociais para versículos
// =====================================================
// Favoritar, reagir, comentar, compartilhar
// =====================================================

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { VerseReactions } from './VerseReactions';
import { VerseComments } from './VerseComments';
import { VerseShareDialog } from './VerseShareDialog';

interface VerseActionsProps {
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  compact?: boolean;
}

interface VerseStats {
  favorites: number;
  comments: number;
  shares: number;
  reactions: {
    heart?: number;
    amen?: number;
    fire?: number;
    sparkle?: number;
    praise?: number;
  };
}

export const VerseActions = ({
  book,
  chapter,
  verse,
  verseText,
  compact = false,
}: VerseActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [stats, setStats] = useState<VerseStats>({
    favorites: 0,
    comments: 0,
    shares: 0,
    reactions: {},
  });
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar stats e estado de favorito
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Verificar se está favoritado
      const { data: favorite } = await supabase
        .from('favorite_verses')
        .select('id')
        .eq('user_id', user.id)
        .eq('book', book)
        .eq('chapter', chapter)
        .eq('verse', verse)
        .maybeSingle();

      setIsFavorited(!!favorite);

      // Carregar stats
      const { data: statsData } = await supabase.rpc('get_verse_stats', {
        p_book: book,
        p_chapter: chapter,
        p_verse: verse,
      });

      if (statsData) {
        setStats(statsData as VerseStats);
      }
    };

    loadData();
  }, [user, book, chapter, verse]);

  // Favoritar/desfavoritar
  const handleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para favoritar versículos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isFavorited) {
        // Remover favorito
        await supabase
          .from('favorite_verses')
          .delete()
          .eq('user_id', user.id)
          .eq('book', book)
          .eq('chapter', chapter)
          .eq('verse', verse);

        setIsFavorited(false);
        setStats(prev => ({ ...prev, favorites: Math.max(0, prev.favorites - 1) }));

        toast({
          title: 'Removido dos favoritos',
          description: 'Versículo removido da sua coleção',
        });
      } else {
        // Adicionar favorito
        await supabase.from('favorite_verses').insert({
          user_id: user.id,
          book,
          chapter,
          verse,
          verse_text: verseText,
        });

        setIsFavorited(true);
        setStats(prev => ({ ...prev, favorites: prev.favorites + 1 }));

        toast({
          title: '❤️ Adicionado aos favoritos!',
          description: 'Versículo salvo na sua coleção pessoal',
        });

        // TODO: Adicionar +2 XP (gamificação)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o favorito',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={handleFavorite}
          disabled={loading}
          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
            isFavorited ? 'text-red-500' : ''
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          {stats.favorites > 0 && <span>{formatCount(stats.favorites)}</span>}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {stats.comments > 0 && <span>{formatCount(stats.comments)}</span>}
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Share2 className="h-4 w-4" />
          {stats.shares > 0 && <span>{formatCount(stats.shares)}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Botões de ação */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={isFavorited ? 'default' : 'outline'}
          size="sm"
          onClick={handleFavorite}
          disabled={loading}
          className={`gap-2 ${isFavorited ? 'theme-animate-pulse-glow' : ''}`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          {isFavorited ? 'Favoritado' : 'Favoritar'}
          {stats.favorites > 0 && (
            <span className="ml-1 text-xs opacity-70">({formatCount(stats.favorites)})</span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReactions(!showReactions)}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Reagir
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Comentar
          {stats.comments > 0 && (
            <span className="ml-1 text-xs opacity-70">({formatCount(stats.comments)})</span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShare(true)}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </div>

      {/* Reações */}
      {showReactions && (
        <VerseReactions
          book={book}
          chapter={chapter}
          verse={verse}
          stats={stats}
          onUpdate={(newStats) => setStats(newStats)}
        />
      )}

      {/* Comentários */}
      {showComments && (
        <VerseComments
          book={book}
          chapter={chapter}
          verse={verse}
          verseText={verseText}
          onCountChange={(count) => setStats(prev => ({ ...prev, comments: count }))}
        />
      )}

      {/* Modal de compartilhamento */}
      {showShare && (
        <VerseShareDialog
          book={book}
          chapter={chapter}
          verse={verse}
          verseText={verseText}
          open={showShare}
          onOpenChange={setShowShare}
          onShare={() => setStats(prev => ({ ...prev, shares: prev.shares + 1 }))}
        />
      )}
    </div>
  );
};
