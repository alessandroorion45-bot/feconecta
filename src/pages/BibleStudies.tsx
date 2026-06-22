import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Video, Headphones, FileText, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";

type StudyType = "video" | "audio" | "text";
type Study = { id: number; title: string; author: string; description: string; category: string; type: StudyType; duration: string; content: string; date: string };

const studies: Study[] = [
  { id: 1, title: "O Sermão do Monte", author: "Pr. André Valadão", description: "Um estudo profundo sobre Mateus 5-7 e como aplicar os ensinamentos de Jesus no dia a dia.", category: "Fé", type: "video", duration: "45 min", content: "O Sermão do Monte é considerado o maior discurso de Jesus registrado nos Evangelhos. Nele, Jesus apresenta os princípios do Reino de Deus, começando pelas Bem-aventuranças...", date: "15 Mar 2026" },
  { id: 2, title: "A Família segundo a Bíblia", author: "Pra. Denise Seixas", description: "Como construir uma família alicerçada nos princípios bíblicos.", category: "Família", type: "text", duration: "15 min de leitura", content: "A família é a primeira instituição criada por Deus. Em Gênesis, vemos que Deus criou o homem e a mulher para se complementarem e juntos glorificarem a Deus...", date: "14 Mar 2026" },
  { id: 3, title: "Oração Eficaz", author: "Pr. Cláudio Duarte", description: "Princípios para uma vida de oração poderosa e transformadora.", category: "Oração", type: "audio", duration: "30 min", content: "A oração é o canal de comunicação entre nós e Deus. Jesus nos ensinou que devemos orar sem cessar e com fé. Tiago 5:16 diz que 'a oração do justo é poderosa e eficaz'...", date: "13 Mar 2026" },
  { id: 4, title: "O Jovem e os Desafios da Fé", author: "Pr. Felipe Heiderich", description: "Como manter a fé firme em um mundo cheio de distrações e pressões.", category: "Jovens", type: "video", duration: "35 min", content: "Ser jovem e cristão nos dias de hoje é um desafio. Daniel foi um jovem que manteve sua fé em meio a uma cultura pagã. Podemos aprender com seu exemplo...", date: "12 Mar 2026" },
  { id: 5, title: "Discipulado: O Chamado de Jesus", author: "Pr. Luciano Subirá", description: "O que significa ser discípulo de Cristo e como discipular outros.", category: "Discipulado", type: "text", duration: "20 min de leitura", content: "Em Mateus 28:19, Jesus nos ordena: 'Ide e fazei discípulos de todas as nações.' Discipulado não é apenas ensinar, é caminhar junto, compartilhar vida...", date: "11 Mar 2026" },
  { id: 6, title: "Adoração que Transforma", author: "Pra. Ana Paula Valadão", description: "O poder da adoração verdadeira na vida do cristão.", category: "Fé", type: "audio", duration: "25 min", content: "Adoração vai muito além de cantar músicas na igreja. É um estilo de vida. Em João 4:23, Jesus diz que o Pai procura adoradores que o adorem em espírito e em verdade...", date: "10 Mar 2026" },
];

const typeIcons: Record<StudyType, React.ElementType> = { video: Video, audio: Headphones, text: FileText };
const typeLabels: Record<StudyType, string> = { video: "Vídeo", audio: "Áudio", text: "Texto" };

const BibleStudies = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { awardXP } = useGamification(user?.id);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [completedStudies, setCompletedStudies] = useState<number[]>([]);

  const categories = [...new Set(studies.map(s => s.category))];
  const filtered = useMemo(() => studies.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || s.category === selectedCategory;
    return matchSearch && matchCat;
  }), [search, selectedCategory]);

  const markStudyAsComplete = async (studyId: number) => {
    if (completedStudies.includes(studyId)) return;

    setCompletedStudies([...completedStudies, studyId]);

    // Conceder XP por completar estudo bíblico
    if (user) {
      await awardXP('bible_study_completed');
    }

    toast({
      title: "Estudo completado! 📖",
      description: "+30 XP concedidos. Continue estudando a Palavra!",
    });
  };

  if (selectedStudy) {
    const TypeIcon = typeIcons[selectedStudy.type];
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedStudy(null)}>← Voltar</Button>
          <Card className="shadow-divine">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline"><TypeIcon className="h-3 w-3 mr-1 inline" /> {typeLabels[selectedStudy.type]}</Badge>
                <Badge variant="outline">{selectedStudy.category}</Badge>
                <Badge variant="secondary"><Clock className="h-3 w-3 mr-1 inline" /> {selectedStudy.duration}</Badge>
              </div>
              <CardTitle className="text-2xl">{selectedStudy.title}</CardTitle>
              <p className="text-muted-foreground">por {selectedStudy.author} • {selectedStudy.date}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground italic">{selectedStudy.description}</p>
              <div className="bg-muted/50 rounded-lg p-6">
                <p className="leading-relaxed">{selectedStudy.content}</p>
              </div>
              <Button
                variant={completedStudies.includes(selectedStudy.id) ? "default" : "outline"}
                className="w-full"
                onClick={() => markStudyAsComplete(selectedStudy.id)}
                disabled={completedStudies.includes(selectedStudy.id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {completedStudies.includes(selectedStudy.id) ? "Estudo Completado ✓" : "Marcar como completado"}
              </Button>
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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Estudos Bíblicos</h1>
          <p className="text-muted-foreground">Pregações e estudos para crescimento espiritual</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar estudo ou autor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>Todos</Button>
          {categories.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(study => {
            const TypeIcon = typeIcons[study.type];
            return (
              <Card key={study.id} className="cursor-pointer hover:shadow-divine transition-shadow" onClick={() => setSelectedStudy(study)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs"><TypeIcon className="h-3 w-3 mr-1 inline" /> {typeLabels[study.type]}</Badge>
                    <Badge variant="secondary" className="text-xs">{study.category}</Badge>
                  </div>
                  <p className="font-semibold">{study.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{study.author}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{study.description}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span><Clock className="h-3 w-3 inline mr-1" />{study.duration}</span>
                    <span>{study.date}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default BibleStudies;
