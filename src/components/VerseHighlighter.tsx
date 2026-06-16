import { useState, useEffect } from 'react';
import { Highlighter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-300/50', border: 'border-yellow-400' },
  { name: 'Azul', value: 'blue', bg: 'bg-blue-300/50', border: 'border-blue-400' },
  { name: 'Verde', value: 'green', bg: 'bg-green-300/50', border: 'border-green-400' },
  { name: 'Vermelho', value: 'red', bg: 'bg-red-300/50', border: 'border-red-400' },
];

interface Highlight {
  id: string;
  verse_number: number;
  highlight_color: string;
}

interface VerseHighlighterProps {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  onHighlightChange?: () => void;
  highlightCount?: number;
}

export const useVerseHighlights = (bookAbbrev: string, chapter: number) => {
  const [highlights, setHighlights] = useState<Record<number, string>>({});

  const loadHighlights = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('bible_verse_highlights')
      .select('verse_number, highlight_color')
      .eq('user_id', user.id)
      .eq('book_abbrev', bookAbbrev)
      .eq('chapter', chapter);

    if (data) {
      const highlightMap: Record<number, string> = {};
      data.forEach(h => {
        highlightMap[h.verse_number] = h.highlight_color;
      });
      setHighlights(highlightMap);
    }
  };

  useEffect(() => {
    loadHighlights();
  }, [bookAbbrev, chapter]);

  return { highlights, loadHighlights };
};

export const getHighlightClass = (color: string | undefined): string => {
  if (!color) return '';
  const colorObj = HIGHLIGHT_COLORS.find(c => c.value === color);
  return colorObj ? colorObj.bg : '';
};

const VerseHighlighter = ({
  bookAbbrev,
  bookName,
  chapter,
  verseNumber,
  verseText,
  onHighlightChange,
  highlightCount = 0,
}: VerseHighlighterProps) => {
  const { toast } = useToast();
  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadCurrentHighlight = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('bible_verse_highlights')
        .select('highlight_color')
        .eq('user_id', user.id)
        .eq('book_abbrev', bookAbbrev)
        .eq('chapter', chapter)
        .eq('verse_number', verseNumber)
        .single();

      if (data) {
        setCurrentColor(data.highlight_color);
      }
    };
    loadCurrentHighlight();
  }, [bookAbbrev, chapter, verseNumber]);

  const handleHighlight = async (color: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para marcar versículos.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentColor === color) {
        // Remove highlight
        await supabase
          .from('bible_verse_highlights')
          .delete()
          .eq('user_id', user.id)
          .eq('book_abbrev', bookAbbrev)
          .eq('chapter', chapter)
          .eq('verse_number', verseNumber);
        
        setCurrentColor(null);
        toast({
          title: "Marcação removida",
          description: "A marcação foi removida do versículo.",
        });
      } else {
        // Upsert highlight
        await supabase
          .from('bible_verse_highlights')
          .upsert({
            user_id: user.id,
            book_abbrev: bookAbbrev,
            book_name: bookName,
            chapter: chapter,
            verse_number: verseNumber,
            verse_text: verseText,
            highlight_color: color,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,book_abbrev,chapter,verse_number',
          });

        setCurrentColor(color);
        toast({
          title: "Versículo marcado",
          description: "Sua marcação foi salva com sucesso.",
        });
      }

      onHighlightChange?.();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeHighlight = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('bible_verse_highlights')
      .delete()
      .eq('user_id', user.id)
      .eq('book_abbrev', bookAbbrev)
      .eq('chapter', chapter)
      .eq('verse_number', verseNumber);

    setCurrentColor(null);
    onHighlightChange?.();
    setIsOpen(false);
    toast({
      title: "Marcação removida",
      description: "A marcação foi removida do versículo.",
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 h-8 px-2 sm:px-3"
          aria-label={`Marcar versículo, ${highlightCount} marcações`}
        >
          <Highlighter className="h-3.5 w-3.5" />
          <span className="text-xs">{highlightCount > 0 ? highlightCount : ''}</span>
          <span className="hidden sm:inline text-xs">{currentColor ? 'Editar' : 'Marcar'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Escolha uma cor:
          </p>
          <div className="flex gap-2 flex-wrap">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleHighlight(color.value)}
                className={`w-8 h-8 rounded-full ${color.bg} ${color.border} border-2 transition-transform hover:scale-110 ${
                  currentColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                title={color.name}
              />
            ))}
          </div>
          {currentColor && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-destructive hover:text-destructive"
              onClick={removeHighlight}
            >
              <X className="h-3 w-3 mr-1" />
              Remover marcação
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VerseHighlighter;
