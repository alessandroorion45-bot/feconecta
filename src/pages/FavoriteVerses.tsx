import { useState, useEffect } from 'react';
import { Heart, BookOpen, Filter } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { VerseActions } from '@/components/bible/VerseActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FavoriteVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
  created_at: string;
}

const FavoriteVerses = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'book'>('recent');
  const [selectedBook, setSelectedBook] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    filterAndSort();
  }, [favorites, sortBy, selectedBook]);

  const loadFavorites = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data } = await supabase
        .from('favorite_verses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = [...favorites];

    // Filtrar por livro
    if (selectedBook !== 'all') {
      filtered = filtered.filter(f => f.book === selectedBook);
    }

    // Ordenar
    if (sortBy === 'book') {
      filtered.sort((a, b) => {
        if (a.book !== b.book) return a.book.localeCompare(b.book);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      });
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredFavorites(filtered);
  };

  const uniqueBooks = Array.from(new Set(favorites.map(f => f.book))).sort();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--theme-background)' }}>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <Card className="theme-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-red-500 fill-current" />
              Meus Versículos Favoritos
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {favorites.length} {favorites.length === 1 ? 'versículo' : 'versículos'} salvos
            </p>
          </CardHeader>
        </Card>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="theme-input w-full sm:w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="book">Por livro bíblico</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBook} onValueChange={setSelectedBook}>
            <SelectTrigger className="theme-input w-full sm:w-[200px]">
              <SelectValue placeholder="Todos os livros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os livros</SelectItem>
              {uniqueBooks.map(book => (
                <SelectItem key={book} value={book}>
                  {book}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de favoritos */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="theme-skeleton h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <Card className="theme-card">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedBook !== 'all' ? 'Nenhum favorito neste livro' : 'Nenhum versículo favoritado ainda'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedBook !== 'all'
                  ? 'Explore a Bíblia e favorite seus versículos preferidos'
                  : 'Comece a favoritar versículos que tocam seu coração'}
              </p>
              <Button onClick={() => window.location.href = '/bible'}>
                Ir para a Bíblia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((favorite) => (
              <Card key={favorite.id} className="theme-card theme-hover-lift">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {favorite.book} {favorite.chapter}:{favorite.verse}
                      </h3>
                      <p className="text-base leading-relaxed">{favorite.verse_text}</p>
                    </div>
                    <VerseActions
                      book={favorite.book}
                      chapter={favorite.chapter}
                      verse={favorite.verse}
                      verseText={favorite.verse_text}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FavoriteVerses;
