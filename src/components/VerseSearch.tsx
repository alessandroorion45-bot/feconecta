import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, Share2, X } from "lucide-react";
import { bibleApi } from "@/services/bibleApi";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface VerseSearchProps {
  onFavoriteAdded?: () => void;
}

const VerseSearch = ({ onFavoriteAdded }: VerseSearchProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Digite uma referência",
        description: "Ex: João 3:16",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await bibleApi.searchVerse(searchQuery);
      if (result) {
        setSearchResult(result);
        await checkIfFavorite(result);
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async (result: SearchResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorite_verses')
      .select('id')
      .eq('user_id', user.id)
      .eq('book_name', result.book)
      .eq('chapter', result.chapter)
      .eq('verse_number', result.verse)
      .single();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!searchResult) return;

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
      if (isFavorite) {
        await supabase
          .from('favorite_verses')
          .delete()
          .eq('user_id', user.id)
          .eq('book_name', searchResult.book)
          .eq('chapter', searchResult.chapter)
          .eq('verse_number', searchResult.verse);

        setIsFavorite(false);
        toast({
          title: "Removido dos favoritos",
          description: "Versículo removido com sucesso.",
        });
      } else {
        const bookEntry = Object.entries({
          'GN': 'Gênesis', 'EX': 'Êxodo', 'LV': 'Levítico', 'NM': 'Números', 
          'DT': 'Deuteronômio', 'JS': 'Josué', 'JZ': 'Juízes', 'RT': 'Rute',
          '1SM': '1 Samuel', '2SM': '2 Samuel', '1RS': '1 Reis', '2RS': '2 Reis',
          '1CR': '1 Crônicas', '2CR': '2 Crônicas', 'ED': 'Esdras', 'NE': 'Neemias',
          'ET': 'Ester', 'JB': 'Jó', 'SL': 'Salmos', 'PV': 'Provérbios',
          'EC': 'Eclesiastes', 'CT': 'Cânticos', 'IS': 'Isaías', 'JR': 'Jeremias',
          'LM': 'Lamentações', 'EZ': 'Ezequiel', 'DN': 'Daniel', 'OS': 'Oséias',
          'JL': 'Joel', 'AM': 'Amós', 'OB': 'Obadias', 'JN': 'Jonas',
          'MQ': 'Miquéias', 'NA': 'Naum', 'HC': 'Habacuque', 'SF': 'Sofonias',
          'AG': 'Ageu', 'ZC': 'Zacarias', 'ML': 'Malaquias', 'MT': 'Mateus',
          'MC': 'Marcos', 'LC': 'Lucas', 'JO': 'João', 'AT': 'Atos',
          'RM': 'Romanos', '1CO': '1 Coríntios', '2CO': '2 Coríntios', 'GL': 'Gálatas',
          'EF': 'Efésios', 'FP': 'Filipenses', 'CL': 'Colossenses', '1TS': '1 Tessalonicenses',
          '2TS': '2 Tessalonicenses', '1TM': '1 Timóteo', '2TM': '2 Timóteo', 'TT': 'Tito',
          'FM': 'Filemom', 'HB': 'Hebreus', 'TG': 'Tiago', '1PE': '1 Pedro',
          '2PE': '2 Pedro', '1JO': '1 João', '2JO': '2 João', '3JO': '3 João',
          'JD': 'Judas', 'AP': 'Apocalipse'
        }).find(([, name]) => name === searchResult.book);

        const abbrev = bookEntry ? bookEntry[0] : 'GN';

        await supabase
          .from('favorite_verses')
          .insert({
            user_id: user.id,
            book_name: searchResult.book,
            book_abbrev: abbrev,
            chapter: searchResult.chapter,
            verse_number: searchResult.verse,
            verse_text: searchResult.text,
          });

        setIsFavorite(true);
        toast({
          title: "Adicionado aos favoritos",
          description: "Versículo salvo com sucesso.",
        });
        onFavoriteAdded?.();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const shareVerse = () => {
    if (!searchResult) return;

    const text = `${searchResult.book} ${searchResult.chapter}:${searchResult.verse}\n"${searchResult.text}"`;
    const shareData = {
      title: 'Versículo da Bíblia',
      text: text,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // Fallback: copiar para clipboard
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

  return (
    <Card className="shadow-divine mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Buscar Versículo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ex: João 3:16"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {searchResult && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-bold text-primary mb-2">
                  {searchResult.book} {searchResult.chapter}:{searchResult.verse}
                </h3>
                <p className="text-base leading-relaxed">{searchResult.text}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchResult(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFavorite}
                className="gap-2"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareVerse}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerseSearch;