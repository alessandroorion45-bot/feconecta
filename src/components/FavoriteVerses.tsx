import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FavoriteVerse {
  id: string;
  book_name: string;
  chapter: number;
  verse_number: number;
  verse_text: string;
  created_at: string;
}

interface FavoriteVersesProps {
  refreshTrigger?: number;
}

const FavoriteVerses = ({ refreshTrigger }: FavoriteVersesProps) => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [refreshTrigger]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setFavorites([]);
        return;
      }

      const { data, error } = await supabase
        .from('favorite_verses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar favoritos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_verses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: "Removido",
        description: "Versículo removido dos favoritos.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const shareVerse = (verse: FavoriteVerse) => {
    const text = `${verse.book_name} ${verse.chapter}:${verse.verse_number}\n"${verse.verse_text}"`;
    const shareData = {
      title: 'Versículo da Bíblia',
      text: text,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copiado!",
          description: "Versículo copiado para a área de transferência.",
        });
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Versículo copiado para a área de transferência.",
      });
    }
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Versículos Favoritos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Versículos Favoritos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Você ainda não tem versículos favoritos. Use a busca para adicionar!
          </p>
        ) : (
          <div className="space-y-4">
            {favorites.map((verse) => (
              <div
                key={verse.id}
                className="bg-muted/50 p-4 rounded-lg space-y-3"
              >
                <div>
                  <h3 className="font-bold text-primary mb-2">
                    {verse.book_name} {verse.chapter}:{verse.verse_number}
                  </h3>
                  <p className="text-base leading-relaxed">{verse.verse_text}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareVerse(verse)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFavorite(verse.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteVerses;