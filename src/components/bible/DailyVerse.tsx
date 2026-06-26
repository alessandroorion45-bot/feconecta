import { useState, useEffect } from 'react';
import { Sparkles, Share2, Heart, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { VerseShareDialog } from './VerseShareDialog';
import { useGamification } from '@/hooks/useGamification';

interface DailyVerseData {
  book_id: number;
  book_name: string;
  book_abbrev: string;
  chapter: number;
  verse: number;
  text: string;
}

export const DailyVerse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardXP } = useGamification(user?.id);
  const [dailyVerse, setDailyVerse] = useState<DailyVerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    loadDailyVerse();
  }, []);

  useEffect(() => {
    if (dailyVerse && user) {
      checkIfFavorited();
    }
  }, [dailyVerse, user]);

  const loadDailyVerse = async () => {
    setLoading(true);

    try {
      // Carregar versículo do dia
      const { data, error } = await supabase.rpc('get_daily_verse');

      if (error) throw error;

      if (data && data.length > 0) {
        setDailyVerse(data[0]);

        // Registrar visualização
        await supabase.rpc('record_daily_verse_view');
      }
    } catch (error) {
      console.error('Error loading daily verse:', error);
      toast({
        title: '❌ Erro ao carregar versículo do dia',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async () => {
    if (!user || !dailyVerse) return;

    const { data } = await supabase
      .from('favorite_verses')
      .select('id')
      .eq('user_id', user.id)
      .eq('book', dailyVerse.book_name)
      .eq('chapter', dailyVerse.chapter)
      .eq('verse', dailyVerse.verse)
      .maybeSingle();

    setIsFavorited(!!data);
  };

  const handleFavorite = async () => {
    if (!user) {
      toast({
        title: '🔒 Login necessário',
        description: 'Faça login para favoritar o versículo do dia',
        variant: 'destructive',
      });
      return;
    }

    if (!dailyVerse) return;

    try {
      if (isFavorited) {
        // Remover favorito
        await supabase
          .from('favorite_verses')
          .delete()
          .eq('user_id', user.id)
          .eq('book', dailyVerse.book_name)
          .eq('chapter', dailyVerse.chapter)
          .eq('verse', dailyVerse.verse);

        setIsFavorited(false);

        toast({
          title: '✅ Removido dos favoritos',
          description: 'Versículo removido da sua coleção',
        });
      } else {
        // Adicionar favorito
        await supabase.from('favorite_verses').insert({
          user_id: user.id,
          book: dailyVerse.book_name,
          chapter: dailyVerse.chapter,
          verse: dailyVerse.verse,
          verse_text: dailyVerse.text,
        });

        setIsFavorited(true);

        // Registrar no histórico
        await supabase.rpc('record_daily_verse_favorite');

        // Conceder XP
        await awardXP('verse_favorited');

        toast({
          title: '❤️ Versículo do dia favoritado!',
          description: '+2 XP - Adicionado à sua coleção',
          className: 'animate-in slide-in-from-top bg-green-50 border-green-200',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível atualizar o favorito',
        variant: 'destructive',
      });
    }
  };

  const handleShareComplete = async () => {
    // Registrar compartilhamento no histórico
    await supabase.rpc('record_daily_verse_share');

    // Conceder XP
    if (user) {
      await awardXP('verse_shared');
    }
  };

  if (loading) {
    return (
      <Card className="theme-card animate-pulse">
        <CardHeader>
          <div className="h-8 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-24 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dailyVerse) {
    return (
      <Card className="theme-card">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Versículo do dia não disponível no momento
          </p>
          <Button onClick={loadDailyVerse} variant="outline" size="sm" className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="theme-card theme-gradient-card relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl -z-10" />

        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent">
                Versículo do Dia
              </h2>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Referência */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-1">
              {dailyVerse.book_name} {dailyVerse.chapter}:{dailyVerse.verse}
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </div>

          {/* Texto do versículo */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 text-6xl text-primary/10 font-serif">"</div>
            <p className="text-lg sm:text-xl leading-relaxed text-center px-4 py-6 font-serif">
              {dailyVerse.text}
            </p>
            <div className="absolute -right-4 -bottom-4 text-6xl text-primary/10 font-serif">"</div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={handleFavorite}
              variant={isFavorited ? 'default' : 'outline'}
              size="lg"
              className={`gap-2 transition-all hover:scale-105 ${
                isFavorited ? 'theme-animate-pulse-glow' : ''
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? 'Favoritado' : 'Favoritar'}
            </Button>

            <Button
              onClick={() => setShowShare(true)}
              variant="outline"
              size="lg"
              className="gap-2 transition-all hover:scale-105"
            >
              <Share2 className="h-5 w-5" />
              Compartilhar
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="flex gap-4 justify-center text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span>Meditação diária</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de compartilhamento */}
      {showShare && dailyVerse && (
        <VerseShareDialog
          book={dailyVerse.book_name}
          chapter={dailyVerse.chapter}
          verse={dailyVerse.verse}
          verseText={dailyVerse.text}
          open={showShare}
          onOpenChange={setShowShare}
          onShare={handleShareComplete}
        />
      )}
    </>
  );
};
