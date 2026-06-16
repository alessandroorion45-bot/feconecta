import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, Share2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const devotionals = [
  {
    id: 1,
    date: "16 de Março, 2026",
    verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reference: "João 3:16",
    reflection: "O amor de Deus é incondicional e eterno. Ele não esperou que fôssemos perfeitos para nos amar — Ele nos amou primeiro. Hoje, permita que esse amor transforme seu coração e suas atitudes para com os outros.",
    prayer: "Senhor, obrigado pelo Teu amor imensurável. Ajuda-me a compartilhar esse amor com todos ao meu redor. Que eu seja reflexo da Tua graça hoje. Amém.",
    category: "Amor",
  },
  {
    id: 2,
    date: "15 de Março, 2026",
    verse: "O Senhor é o meu pastor; de nada terei falta. Em verdes pastagens me faz repousar e me conduz a águas tranquilas.",
    reference: "Salmos 23:1-2",
    reflection: "Em meio à correria do dia a dia, Deus nos convida a descansar em Seus braços. Ele cuida de cada detalhe da nossa vida. Confie no Seu cuidado e encontre paz.",
    prayer: "Pai celestial, eu confio em Ti como meu pastor. Guia-me pelos caminhos da justiça e dá-me paz em meio às tempestades. Amém.",
    category: "Confiança",
  },
  {
    id: 3,
    date: "14 de Março, 2026",
    verse: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    reflection: "Não é sobre nossa própria força, mas sobre a força que vem de Cristo. Quando nos sentimos fracos, Ele nos sustenta. Cada desafio é uma oportunidade de experimentar o poder de Deus.",
    prayer: "Jesus, fortalece-me para enfrentar cada desafio com fé e coragem. Sei que em Ti sou mais que vencedor. Amém.",
    category: "Força",
  },
];

const Devotional = () => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);

  const current = devotionals[currentIndex];

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    toast({
      title: favorites.includes(id) ? "Removido dos favoritos" : "Adicionado aos favoritos ⭐",
      description: favorites.includes(id) ? "Devocional removido." : "Devocional salvo nos seus favoritos.",
    });
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: `Devocional - ${current.reference}`, text: `"${current.verse}" - ${current.reference}\n\n${current.reflection}` });
    } else {
      navigator.clipboard.writeText(`"${current.verse}" - ${current.reference}\n\n${current.reflection}`);
      toast({ title: "Copiado!", description: "Devocional copiado para a área de transferência." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Devocional Diário</h1>
          <p className="text-muted-foreground">Alimento espiritual para cada dia</p>
        </div>

        <Card className="shadow-divine overflow-hidden">
          <div className="bg-gradient-primary p-6 text-primary-foreground text-center">
            <Badge variant="secondary" className="mb-3">{current.category}</Badge>
            <p className="text-sm opacity-80 mb-2">{current.date}</p>
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-90" />
            <p className="text-lg sm:text-xl italic font-medium leading-relaxed">"{current.verse}"</p>
            <p className="text-sm mt-3 opacity-90 font-semibold">{current.reference}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Reflexão
              </h3>
              <p className="text-muted-foreground leading-relaxed">{current.reflection}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🙏 Oração do Dia</h3>
              <p className="text-muted-foreground italic leading-relaxed">{current.prayer}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleFavorite(current.id)}>
                  <Heart className={`h-4 w-4 mr-1 ${favorites.includes(current.id) ? "fill-red-500 text-red-500" : ""}`} />
                  Favoritar
                </Button>
                <Button variant="outline" size="sm" onClick={share}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Compartilhar
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" disabled={currentIndex === devotionals.length - 1} onClick={() => setCurrentIndex(i => i + 1)}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Devocionais Anteriores</h2>
          <div className="grid gap-4">
            {devotionals.map((d, i) => (
              <Card key={d.id} className={`cursor-pointer hover:shadow-divine transition-shadow ${i === currentIndex ? "ring-2 ring-primary" : ""}`} onClick={() => setCurrentIndex(i)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d.reference}</p>
                    <p className="text-sm text-muted-foreground">{d.date}</p>
                  </div>
                  <Badge variant="outline">{d.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Devotional;
