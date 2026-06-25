import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Search, BookMarked, MapPin, User, Scroll, ChevronRight, Eye, Package, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DictionaryEntry {
  id: string;
  term: string;
  category: 'personagem' | 'lugar' | 'tema' | 'objeto' | 'conceito' | 'evento';
  summary: string;
  details: string;
  meaning: string | null;
  origin: string | null;
  historical_context: string | null;
  biblical_context: string | null;
  references: string[];
  appearances_count: number;
  curiosities: string | null;
  related_terms: string[] | null;
  views_count: number;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  personagem: { icon: User, color: "text-blue-500", label: "Personagem" },
  lugar: { icon: MapPin, color: "text-green-500", label: "Lugar" },
  tema: { icon: Scroll, color: "text-purple-500", label: "Tema" },
  objeto: { icon: Package, color: "text-amber-500", label: "Objeto" },
  conceito: { icon: Scroll, color: "text-rose-500", label: "Conceito" },
  evento: { icon: Calendar, color: "text-indigo-500", label: "Evento" },
};

const BibleDictionary = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  // Carregar verbetes do banco
  useEffect(() => {
    loadEntries();
  }, [selectedCategory]);

  const loadEntries = async () => {
    setLoading(true);

    console.log('[BibleDictionary] Carregando verbetes:', { category: selectedCategory });

    let query = supabase
      .from('bible_dictionary')
      .select('*')
      .order('term', { ascending: true });

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('[BibleDictionary] Erro ao carregar:', error);
      toast({
        title: "❌ Erro ao carregar dicionário",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    console.log('[BibleDictionary] Carregados:', data?.length, 'verbetes');

    if (data) {
      setEntries(data as DictionaryEntry[]);
    }

    setLoading(false);
  };

  const incrementViews = async (entryId: string) => {
    // Incrementar visualizações
    await supabase
      .from('bible_dictionary')
      .update({
        views_count: entries.find(e => e.id === entryId)!.views_count + 1
      })
      .eq('id', entryId);
  };

  const filteredEntries = entries.filter(entry =>
    entry.term.toLowerCase().includes(search.toLowerCase()) ||
    entry.summary.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Object.keys(categoryConfig);

  // Visualização de verbete específico
  if (selectedEntry) {
    const config = categoryConfig[selectedEntry.category];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedEntry(null)}>
            ← Voltar ao Dicionário
          </Button>

          <Card className="shadow-divine">
            {/* Header do Verbete */}
            <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg`}>
                  <Icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{selectedEntry.term}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-sm">
                      {config.label}
                    </Badge>
                    {selectedEntry.meaning && (
                      <Badge variant="secondary" className="text-sm">
                        Significado: {selectedEntry.meaning}
                      </Badge>
                    )}
                    {selectedEntry.appearances_count > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {selectedEntry.appearances_count} menções na Bíblia
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Resumo */}
              <div>
                <p className="text-lg text-muted-foreground italic leading-relaxed">
                  {selectedEntry.summary}
                </p>
              </div>

              <Separator />

              {/* Detalhes Principais */}
              <div>
                <h3 className="font-bold text-xl mb-3 flex items-center gap-2 text-primary">
                  📖 Detalhes
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {selectedEntry.details}
                </p>
              </div>

              {/* Origem */}
              {selectedEntry.origin && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-5 border-l-4 border-blue-500">
                  <h3 className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-300">
                    🌍 Origem
                  </h3>
                  <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
                    {selectedEntry.origin}
                  </p>
                </div>
              )}

              {/* Contexto Histórico */}
              {selectedEntry.historical_context && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-5 border-l-4 border-amber-500">
                  <h3 className="font-bold text-lg mb-2 text-amber-700 dark:text-amber-300">
                    📜 Contexto Histórico
                  </h3>
                  <p className="text-amber-900 dark:text-amber-100 leading-relaxed">
                    {selectedEntry.historical_context}
                  </p>
                </div>
              )}

              {/* Contexto Bíblico */}
              {selectedEntry.biblical_context && (
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-5 border-l-4 border-purple-500">
                  <h3 className="font-bold text-lg mb-2 text-purple-700 dark:text-purple-300">
                    ✝️ Contexto Bíblico
                  </h3>
                  <p className="text-purple-900 dark:text-purple-100 leading-relaxed">
                    {selectedEntry.biblical_context}
                  </p>
                </div>
              )}

              {/* Referências Bíblicas */}
              {selectedEntry.references && selectedEntry.references.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-5 border-l-4 border-green-500">
                  <h3 className="font-bold text-lg mb-3 text-green-700 dark:text-green-300">
                    📚 Principais Referências Bíblicas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.references.map((ref, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm font-medium">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Curiosidades */}
              {selectedEntry.curiosities && (
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-lg p-5 border-l-4 border-pink-500">
                  <h3 className="font-bold text-lg mb-2 text-pink-700 dark:text-pink-300">
                    ⭐ Curiosidades
                  </h3>
                  <p className="text-pink-900 dark:text-pink-100 leading-relaxed">
                    {selectedEntry.curiosities}
                  </p>
                </div>
              )}

              {/* Termos Relacionados */}
              {selectedEntry.related_terms && selectedEntry.related_terms.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 text-muted-foreground">
                    🔗 Verbetes Relacionados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.related_terms.map((term, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          // Buscar verbete relacionado
                          const related = entries.find(e => e.term === term);
                          if (related) {
                            setSelectedEntry(related);
                            incrementViews(related.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedEntry.views_count} visualizações
                </span>
                {selectedEntry.appearances_count > 0 && (
                  <span>Aparece {selectedEntry.appearances_count}× na Bíblia</span>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Lista de verbetes
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">
            📖 Dicionário Bíblico
          </h1>
          <p className="text-muted-foreground">
            {entries.length} verbetes sobre personagens, lugares, temas e conceitos bíblicos
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar termo, personagem, lugar ou conceito..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros de Categoria */}
        <Card className="mb-6 shadow-divine">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Categorias:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map(cat => {
                const config = categoryConfig[cat];
                const Icon = config.icon;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Verbetes */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dicionário...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20">
            <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Nenhum verbete encontrado</h2>
            <p className="text-muted-foreground mb-6">Tente outro termo ou categoria</p>
            <Button onClick={() => { setSearch(""); setSelectedCategory(null); }}>
              Limpar Busca
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredEntries.map(entry => {
              const config = categoryConfig[entry.category];
              const Icon = config.icon;

              return (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:shadow-divine transition-all hover:scale-[1.01]"
                  onClick={() => {
                    setSelectedEntry(entry);
                    incrementViews(entry.id);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg">{entry.term}</p>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.summary}
                      </p>
                      {entry.meaning && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Significado: {entry.meaning}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BibleDictionary;
