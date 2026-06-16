import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookMarked, MapPin, User, Scroll, ChevronRight } from "lucide-react";

type DictionaryEntry = {
  id: number;
  term: string;
  category: "personagem" | "lugar" | "tema" | "objeto" | "conceito";
  summary: string;
  details: string;
  references: string[];
};

const entries: DictionaryEntry[] = [
  { id: 1, term: "Abraão", category: "personagem", summary: "Pai da fé e patriarca do povo de Israel.", details: "Abraão foi chamado por Deus para deixar sua terra e seguir para uma terra prometida. Sua fé foi testada quando Deus pediu que sacrificasse seu filho Isaque. É considerado o pai de muitas nações e um exemplo supremo de fé e obediência.", references: ["Gênesis 12:1-3", "Hebreus 11:8-12", "Romanos 4:3"] },
  { id: 2, term: "Gólgota", category: "lugar", summary: "Local da crucificação de Jesus Cristo.", details: "Gólgota, também chamado de 'Lugar da Caveira', foi o monte onde Jesus foi crucificado. Ficava fora dos muros de Jerusalém e era um local comum de execuções romanas. Ali, Jesus consumou a obra da redenção da humanidade.", references: ["Mateus 27:33", "Marcos 15:22", "João 19:17"] },
  { id: 3, term: "Graça", category: "conceito", summary: "Favor imerecido de Deus para com a humanidade.", details: "A graça é o amor e a misericórdia de Deus dados gratuitamente, sem que possamos merecê-los. É pela graça que somos salvos, através da fé. A graça nos capacita a viver uma vida que agrada a Deus.", references: ["Efésios 2:8-9", "Romanos 3:24", "Tito 2:11"] },
  { id: 4, term: "Arca da Aliança", category: "objeto", summary: "Caixa sagrada que guardava os Dez Mandamentos.", details: "A Arca da Aliança era um baú de madeira de acácia revestido de ouro, construído por ordem de Deus. Guardava as tábuas da lei, a vara de Arão e o maná. Era o objeto mais sagrado do Tabernáculo e do Templo.", references: ["Êxodo 25:10-22", "Hebreus 9:4", "1 Reis 8:9"] },
  { id: 5, term: "Justificação", category: "tema", summary: "Ato de Deus de declarar o pecador justo pela fé.", details: "Justificação é o ato judicial de Deus pelo qual Ele declara justo o pecador que crê em Jesus Cristo. Não é baseada em obras humanas, mas na obra consumada de Cristo na cruz. É recebida pela fé.", references: ["Romanos 5:1", "Romanos 3:28", "Gálatas 2:16"] },
  { id: 6, term: "Moisés", category: "personagem", summary: "Libertador de Israel e mediador da Lei.", details: "Moisés foi chamado por Deus para libertar o povo de Israel da escravidão no Egito. Conduziu o povo pelo deserto durante 40 anos e recebeu os Dez Mandamentos no Monte Sinai. É uma das figuras mais importantes da Bíblia.", references: ["Êxodo 3:1-12", "Deuteronômio 34:10", "Hebreus 11:24-28"] },
  { id: 7, term: "Jerusalém", category: "lugar", summary: "Cidade santa e centro da fé judaico-cristã.", details: "Jerusalém é a cidade onde o Templo de Salomão foi construído e onde Jesus foi crucificado e ressuscitou. É considerada a cidade mais importante da Bíblia, mencionada mais de 800 vezes nas Escrituras.", references: ["Salmos 122:6", "Mateus 23:37", "Apocalipse 21:2"] },
  { id: 8, term: "Santificação", category: "tema", summary: "Processo de ser separado e transformado por Deus.", details: "Santificação é o processo contínuo pelo qual o crente é transformado à imagem de Cristo pelo Espírito Santo. Envolve separação do pecado e dedicação a Deus em todas as áreas da vida.", references: ["1 Tessalonicenses 4:3", "Hebreus 12:14", "Romanos 6:22"] },
];

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  personagem: { icon: User, color: "text-blue-500", label: "Personagem" },
  lugar: { icon: MapPin, color: "text-green-500", label: "Lugar" },
  tema: { icon: Scroll, color: "text-purple-500", label: "Tema" },
  objeto: { icon: BookMarked, color: "text-amber-500", label: "Objeto" },
  conceito: { icon: Scroll, color: "text-rose-500", label: "Conceito" },
};

const BibleDictionary = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.term.toLowerCase().includes(search.toLowerCase()) || e.summary.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const categories = Object.keys(categoryConfig);

  if (selectedEntry) {
    const config = categoryConfig[selectedEntry.category];
    const Icon = config.icon;
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedEntry(null)}>
            ← Voltar
          </Button>
          <Card className="shadow-divine">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{selectedEntry.term}</CardTitle>
                  <Badge variant="outline" className="mt-1">{config.label}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">{selectedEntry.details}</p>
              <div>
                <h3 className="font-semibold mb-2">📖 Referências Bíblicas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.references.map(ref => (
                    <Badge key={ref} variant="secondary">{ref}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Dicionário Bíblico</h1>
          <p className="text-muted-foreground">Explore termos, personagens e lugares da Bíblia</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar termo, personagem ou lugar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>Todos</Button>
          {categories.map(cat => {
            const config = categoryConfig[cat];
            return (
              <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
                {config.label}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-3">
          {filtered.map(entry => {
            const config = categoryConfig[entry.category];
            const Icon = config.icon;
            return (
              <Card key={entry.id} className="cursor-pointer hover:shadow-divine transition-shadow" onClick={() => setSelectedEntry(entry)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{entry.term}</p>
                    <p className="text-sm text-muted-foreground truncate">{entry.summary}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum termo encontrado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BibleDictionary;
