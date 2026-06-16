import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, ChevronLeft, ChevronRight, Loader2, Heart, Share2, MessageCircle, Highlighter } from "lucide-react";
import { bibleApi, BibleBook, BibleChapter } from "@/services/bibleApi";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useVerseInteractions } from "@/hooks/useVerseInteractions";
import VerseSearch from "@/components/VerseSearch";
import FavoriteVerses from "@/components/FavoriteVerses";
import ReadingPlan from "@/components/ReadingPlan";
import BibleNotes from "@/components/BibleNotes";
import DarkModeToggle from "@/components/DarkModeToggle";

import VerseHighlighter, { useVerseHighlights, getHighlightClass } from "@/components/VerseHighlighter";
import SpiritualCampaignsEnhanced from "@/components/SpiritualCampaignsEnhanced";
import VerseComments from "@/components/VerseComments";
import VerseImageShare from "@/components/VerseImageShare";
import BibleReadingProgress from "@/components/BibleReadingProgress";
import { supabase } from "@/integrations/supabase/client";

const Bible = () => {
  const { toast } = useToast();
  const { trackActivity } = useActivityTracking();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState("GN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [refreshFavorites, setRefreshFavorites] = useState(0);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Verse highlights
  const { highlights, loadHighlights } = useVerseHighlights(selectedBook, selectedChapter);
  
  // Verse interactions (comments, highlights, shares counts)
  const { getVerseCounts, refreshInteractions } = useVerseInteractions(selectedBook, selectedChapter);

  // Scroll to target verse after chapter loads
  useEffect(() => {
    if (targetVerse && chapterData && !loadingChapter) {
      const verseElement = verseRefs.current[targetVerse];
      if (verseElement) {
        setTimeout(() => {
          verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
          verseElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            verseElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 3000);
        }, 300);
      }
      setTargetVerse(null);
    }
  }, [targetVerse, chapterData, loadingChapter]);

  // Load all books on mount
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const data = await bibleApi.getBooks();
        setBooks(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar livros",
          description: "Não foi possível carregar a lista de livros da Bíblia.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, [toast]);

  // Load chapter when book or chapter changes
  useEffect(() => {
    const loadChapter = async () => {
      try {
        setLoadingChapter(true);
        const data = await bibleApi.getChapter(selectedBook, selectedChapter);
        setChapterData(data);
        
        // Track bible reading activity
        trackActivity("bible_read", {
          book: selectedBook,
          chapter: selectedChapter,
        });

        // Reload highlights for new chapter
        loadHighlights();
      } catch (error) {
        toast({
          title: "Erro ao carregar capítulo",
          description: "Não foi possível carregar os versículos deste capítulo.",
          variant: "destructive",
        });
      } finally {
        setLoadingChapter(false);
      }
    };
    if (selectedBook && selectedChapter) {
      loadChapter();
    }
  }, [selectedBook, selectedChapter, toast]);

  const currentBook = books.find(b => b.abrev === selectedBook);

  const shareVerse = (verse: { number: number; verse: string }) => {
    const verseReference = `${chapterData?.name} ${chapterData?.chapter}:${verse.number}`;
    const shareUrl = `${window.location.origin}/bible?book=${selectedBook}&chapter=${selectedChapter}&verse=${verse.number}`;
    
    const message = `✨ ${verseReference}\n\n"${verse.verse}"\n\n📖 Leia mais: ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Abrindo WhatsApp",
      description: "Compartilhe o versículo com seus amigos!",
    });
  };

  const saveReadingPosition = async (verse: { number: number; verse: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !chapterData) return;

    try {
      const { error } = await supabase
        .from("bible_reading_position")
        .upsert({
          user_id: user.id,
          book_abbrev: selectedBook,
          book_name: chapterData.name,
          chapter: selectedChapter,
          verse_number: verse.number,
          last_read_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (!error) {
        setRefreshProgress(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error saving position:", error);
    }
  };

  const addToFavorites = async (verse: { number: number; verse: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para favoritar versículos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('favorite_verses').insert({
        user_id: user.id,
        book_name: chapterData?.name || '',
        book_abbrev: selectedBook,
        chapter: selectedChapter,
        verse_number: verse.number,
        verse_text: verse.verse,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Já nos favoritos",
            description: "Este versículo já está salvo.",
          });
        } else {
          toast({
            title: "Erro ao favoritar",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Adicionado aos favoritos ❤️",
        description: "Versículo salvo com sucesso.",
      });
      setRefreshFavorites(prev => prev + 1);
      refreshInteractions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível favoritar o versículo.",
        variant: "destructive",
      });
    }
  };

  // Navigate to specific passage (for campaigns)
  const navigateToPassage = useCallback((bookAbbrevOrName: string, chapter: number) => {
    // First try to find by abbreviation (case-insensitive)
    let book = books.find(b => 
      b.abrev.toLowerCase() === bookAbbrevOrName.toLowerCase()
    );
    
    // If not found, try to find by name
    if (!book) {
      book = books.find(b => 
        b.names.some(n => n.toLowerCase().includes(bookAbbrevOrName.toLowerCase()))
      );
    }
    
    if (book) {
      setSelectedBook(book.abrev);
      setSelectedChapter(chapter);
      // Scroll to top of the page to show the chapter
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast({
        title: "📖 Navegando para leitura",
        description: `${book.names[0]} ${chapter}`,
      });
    } else {
      toast({
        title: "Livro não encontrado",
        description: "Não foi possível encontrar o livro solicitado.",
        variant: "destructive",
      });
    }
  }, [books, toast]);

  // Resume reading from saved position
  const handleResumeReading = useCallback((bookAbbrev: string, chapter: number, verseNumber: number) => {
    setSelectedBook(bookAbbrev);
    setSelectedChapter(chapter);
    setTargetVerse(verseNumber);
  }, []);

  // Handle verse click to save position
  const handleVerseClick = (verse: { number: number; verse: string }) => {
    saveReadingPosition(verse);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent leading-tight pt-1">
              Bíblia Sagrada
            </h1>
            <DarkModeToggle />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Medite na Palavra de Deus
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Reading Progress Card */}

            {/* Reading Progress Card */}
            <BibleReadingProgress
              key={refreshProgress}
              onResumeReading={handleResumeReading}
              currentBook={selectedBook}
              currentChapter={selectedChapter}
            />

            <VerseSearch onFavoriteAdded={() => setRefreshFavorites(prev => prev + 1)} />

            <Card className="shadow-divine mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  Navegação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Livro</label>
                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {books.map((book) => (
                          <SelectItem key={book.abrev} value={book.abrev}>
                            {book.names[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Capítulo</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
                        disabled={selectedChapter <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Select
                        value={selectedChapter.toString()}
                        onValueChange={(v) => setSelectedChapter(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {Array.from({ length: currentBook?.chapters || 150 }, (_, i) => i + 1).map((ch) => (
                            <SelectItem key={ch} value={ch.toString()}>
                              Capítulo {ch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedChapter(Math.min(currentBook?.chapters || 150, selectedChapter + 1))}
                        disabled={selectedChapter >= (currentBook?.chapters || 150)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="border-b bg-gradient-primary text-primary-foreground">
                <CardTitle className="text-2xl">
                  {chapterData ? `${chapterData.name} ${chapterData.chapter}` : `${currentBook?.names[0] || 'Carregando...'} ${selectedChapter}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingChapter ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : chapterData ? (
                  <div className="space-y-4" aria-live="polite">
                    {chapterData.vers.map((verse) => {
                      const counts = getVerseCounts(verse.number);
                      
                      return (
                        <div 
                          key={verse.number}
                          ref={(el) => { verseRefs.current[verse.number] = el; }}
                          onClick={() => handleVerseClick(verse)}
                          className={`group hover:bg-muted/50 p-3 rounded-lg transition-all cursor-pointer ${getHighlightClass(highlights[verse.number])}`}
                        >
                          <div className="flex gap-3">
                            <span className="text-sm font-bold text-primary mt-1 min-w-[2rem]">
                              {verse.number}
                            </span>
                            <div className="flex-1">
                              <p className="text-base leading-relaxed">
                                {verse.verse}
                              </p>
                            </div>
                          </div>
                          
                          {/* Action bar with counts */}
                          <div 
                            className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 ml-8 sm:ml-11 opacity-0 group-hover:opacity-100 transition-opacity" 
                            aria-live="polite"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); addToFavorites(verse); }}
                              className="gap-1 h-8 px-2 sm:px-3"
                              aria-label={`Favoritar versículo, ${counts.favorites} favoritos`}
                            >
                              <Heart className="h-3.5 w-3.5" />
                              <span className="text-xs">{counts.favorites > 0 ? counts.favorites : ''}</span>
                              <span className="hidden sm:inline text-xs">Favoritar</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); shareVerse(verse); }}
                              className="gap-1 h-8 px-2 sm:px-3"
                              aria-label={`Compartilhar versículo, ${counts.shares} compartilhamentos`}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span className="text-xs">{counts.shares > 0 ? counts.shares : ''}</span>
                              <span className="hidden sm:inline text-xs">Compartilhar</span>
                            </Button>
                            
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                              <VerseComments
                                bookAbbrev={selectedBook}
                                bookName={chapterData.name}
                                chapter={selectedChapter}
                                verseNumber={verse.number}
                                verseText={verse.verse}
                                commentCount={counts.comments}
                              />
                            </div>
                            
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                              <VerseImageShare
                                bookAbbrev={selectedBook}
                                bookName={chapterData.name}
                                chapter={selectedChapter}
                                verseNumber={verse.number}
                                verseText={verse.verse}
                                onShare={refreshInteractions}
                                shareCount={counts.shares}
                              />
                            </div>
                            
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                              <VerseHighlighter
                                bookAbbrev={selectedBook}
                                bookName={chapterData.name}
                                chapter={selectedChapter}
                                verseNumber={verse.number}
                                verseText={verse.verse}
                                onHighlightChange={() => {
                                  loadHighlights();
                                  refreshInteractions();
                                }}
                                highlightCount={counts.highlights}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione um livro e capítulo para começar a leitura.
                  </p>
                )}
              </CardContent>
            </Card>

            <FavoriteVerses refreshTrigger={refreshFavorites} />

            {/* Spiritual Campaigns */}
            <div className="mt-6">
              <SpiritualCampaignsEnhanced onNavigateToPassage={navigateToPassage} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <ReadingPlan />
              <BibleNotes currentBook={currentBook?.names[0]} currentChapter={selectedChapter} />
            </div>

            <Card className="mt-6 bg-gradient-primary text-primary-foreground shadow-glow">
              <CardHeader>
                <CardTitle>Versículo do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg italic">
                  "O Senhor é o meu pastor; de nada terei falta."
                </p>
                <p className="text-sm mt-2 opacity-90">Salmos 23:1</p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Bible;
