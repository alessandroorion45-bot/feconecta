import { useState, useEffect } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { VerseActions } from './VerseActions';

interface TrendingVerse {
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
  score: number;
}

export const TrendingVerses = () => {
  const [trending, setTrending] = useState<TrendingVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    setLoading(true);

    try {
      const { data } = await supabase.rpc('get_trending_verses', {
        p_limit: 10,
      });

      if (data) {
        setTrending(data);
      }
    } catch (error) {
      console.error('Error loading trending verses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="theme-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Versículos em Destaque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="theme-skeleton h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trending.length === 0) {
    return (
      <Card className="theme-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Versículos em Destaque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum versículo em destaque ainda.
            <br />
            Seja o primeiro a favoritar e compartilhar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="theme-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500 theme-animate-fire-flicker" />
          Versículos em Destaque
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Mais curtidos, comentados e compartilhados
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {trending.map((item, index) => (
          <div
            key={`${item.book}-${item.chapter}-${item.verse}`}
            className="theme-card p-4 rounded-lg theme-hover-lift"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full theme-gradient-card flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    {item.book} {item.chapter}:{item.verse}
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </h4>
                  <p className="text-sm mt-2 line-clamp-3">{item.verse_text}</p>
                </div>
                <VerseActions
                  book={item.book}
                  chapter={item.chapter}
                  verse={item.verse}
                  verseText={item.verse_text}
                  compact
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
