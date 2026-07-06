import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search, Video, Headphones, FileText, Clock, CheckCircle, Eye,
  Heart, Share2, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BibleReferenceModal from "@/components/BibleReferenceModal";

/** Versículo do dia (determinístico pela data — igual para todos) */
const DAILY_VERSES = [
  "João 3:16", "Salmos 23:1", "Filipenses 4:13", "Romanos 8:28",
  "Isaías 41:10", "Provérbios 3:5-6", "Salmos 91:1-2", "Mateus 6:33",
  "Jeremias 29:11", "Josué 1:9", "1 Coríntios 13:4-7", "Salmos 46:1",
  "João 14:6", "Efésios 2:8-9",
];
const verseOfTheDay = () => {
  const day = Math.floor(Date.now() / 86_400_000);
  return DAILY_VERSES[day % DAILY_VERSES.length];
};

interface BibleStudy {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  type: 'video' | 'audio' | 'text';
  duration: string;
  content: string;
  verses: string[];
  application: string;
  reflection_questions: string[];
  views_count: number;
  likes_count: number;
  created_at: string;
}

const typeIcons = {
  video: Video,
  audio: Headphones,
  text: FileText,
};

const typeLabels = {
  video: "Vídeo",
  audio: "Áudio",
  text: "Texto",
};

const CATEGORIES = [
  "Todos",
  "Jesus", "Espírito Santo", "Fé", "Oração", "Perdão", "Ansiedade",
  "Família", "Discipulado", "Santidade", "Evangelismo", "Liderança",
  "Jovens", "Mulheres", "Homens", "Trabalho", "Finanças",
  "Sabedoria", "Esperança", "Amor", "Personagens"
];

const BibleStudies = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { awardXP } = useGamification(user?.id);

  // Estados
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'audio' | 'text'>('all');
  const [selectedStudy, setSelectedStudy] = useState<BibleStudy | null>(null);
  const [completedStudies, setCompletedStudies] = useState<Set<string>>(new Set());
  const [likedStudies, setLikedStudies] = useState<Set<string>>(new Set());
  const [refModal, setRefModal] = useState<string | null>(null);

  // Carregar estudos do banco
  useEffect(() => {
    loadStudies();
    if (user) {
      loadUserProgress();
    }
  }, [selectedCategory, selectedType, user]);

  const loadStudies = async () => {
    setLoading(true);

    console.log('[BibleStudies] Carregando estudos:', { category: selectedCategory, type: selectedType });

    let query = supabase
      .from('bible_studies')
      .select('*')
      .order('views_count', { ascending: false });

    if (selectedCategory !== "Todos") {
      query = query.eq('category', selectedCategory);
    }

    if (selectedType !== 'all') {
      query = query.eq('type', selectedType);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('[BibleStudies] Erro ao carregar:', error);
      toast({
        title: "❌ Erro ao carregar estudos",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    console.log('[BibleStudies] Carregados:', data?.length, 'estudos');

    if (data) {
      setStudies(data as BibleStudy[]);
    }

    setLoading(false);
  };

  const loadUserProgress = async () => {
    if (!user) return;

    console.log('[BibleStudies] Carregando progresso do usuário');

    const { data, error } = await (supabase as any)
      .from('user_study_completions')
      .select('study_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[BibleStudies] Erro ao carregar progresso:', error);
      return;
    }

    if (data) {
      const completed = new Set(data.map(c => c.study_id));
      setCompletedStudies(completed);
    }
  };

  const markStudyAsComplete = async (studyId: string) => {
    if (completedStudies.has(studyId) || !user) return;

    console.log('[BibleStudies] Marcando estudo como completo:', studyId);

    const { error } = await (supabase as any)
      .from('user_study_completions')
      .insert({
        user_id: user.id,
        study_id: studyId,
      });

    if (error) {
      console.error('[BibleStudies] Erro ao marcar como completo:', error);
      toast({
        title: "❌ Erro ao salvar progresso",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCompletedStudies(prev => new Set([...prev, studyId]));

    // XP da gamificação (ação bible_study já existente)
    void awardXP('bible_study');

    toast({
      title: "✅ Estudo completado!",
      description: "Continue aprofundando seu conhecimento da Palavra! 📖 +XP",
      className: "bg-green-50 border-green-200",
    });
  };

  const incrementViews = async (studyId: string) => {
    // Incrementar visualizações (o builder do Supabase não tem .catch
    // antes do await — usar try/await)
    try {
      const { error } = await (supabase.rpc as any)('increment', {
        row_id: studyId,
        table_name: 'bible_studies',
        column_name: 'views_count',
      });
      if (error) throw error;
    } catch {
      // Fallback se a RPC não existir no banco
      const study = studies.find(s => s.id === studyId);
      if (study) {
        await supabase
          .from('bible_studies' as any)
          .update({ views_count: study.views_count + 1 } as any)
          .eq('id', studyId);
      }
    }
  };

  const toggleLike = (studyId: string) => {
    const newLikes = new Set(likedStudies);
    if (newLikes.has(studyId)) {
      newLikes.delete(studyId);
      toast({ title: "Removido dos favoritos" });
    } else {
      newLikes.add(studyId);
      toast({
        title: "⭐ Adicionado aos favoritos",
        description: "Estudo salvo na sua coleção.",
        className: "bg-green-50 border-green-200",
      });
    }
    setLikedStudies(newLikes);
  };

  const shareStudy = async (study: BibleStudy) => {
    const text = `📖 ${study.title}\n\n${study.description}\n\n🔗 FeConecta - Aliança`;

    if (navigator.share) {
      try {
        await navigator.share({ title: study.title, text });
        toast({ title: "📤 Compartilhado com sucesso!" });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copiado!",
        description: "Link copiado para a área de transferência.",
      });
    }
  };

  const filteredStudies = studies.filter(study =>
    study.title.toLowerCase().includes(search.toLowerCase()) ||
    study.description.toLowerCase().includes(search.toLowerCase()) ||
    study.author.toLowerCase().includes(search.toLowerCase())
  );

  // Visualização de estudo específico
  if (selectedStudy) {
    const TypeIcon = typeIcons[selectedStudy.type];
    const isCompleted = completedStudies.has(selectedStudy.id);

    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedStudy(null)}>
            ← Voltar para Estudos
          </Button>

          <Card className="shadow-divine">
            {/* Header do Estudo */}
            <CardHeader className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {typeLabels[selectedStudy.type]}
                </Badge>
                <Badge variant="outline">{selectedStudy.category}</Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedStudy.duration}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {selectedStudy.views_count} visualizações
                </Badge>
              </div>

              <CardTitle className="text-2xl sm:text-3xl mb-2">{selectedStudy.title}</CardTitle>
              <p className="text-muted-foreground">Por {selectedStudy.author}</p>
              <p className="text-muted-foreground italic mt-2">{selectedStudy.description}</p>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* Versículos Base */}
              {selectedStudy.verses && selectedStudy.verses.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 border-l-4 border-blue-500">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    📖 Versículos Base
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudy.verses.map((verse, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRefModal(verse)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-3 py-1.5 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/70 hover:scale-105 transition-all"
                        title="Clique para ler na Bíblia"
                      >
                        📖 {verse}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-2">
                    Toque em uma referência para ler o texto sem sair do estudo
                  </p>
                </div>
              )}

              {/* Conteúdo Principal */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                  📚 Conteúdo do Estudo
                </h3>
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <div className="leading-relaxed whitespace-pre-line text-muted-foreground">
                    {selectedStudy.content}
                  </div>
                </div>
              </div>

              {/* Aplicação Prática */}
              {selectedStudy.application && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-lg p-6 border-l-4 border-orange-500">
                  <h3 className="font-bold text-lg mb-3 text-orange-700 dark:text-orange-300">
                    🎯 Aplicação Prática
                  </h3>
                  <div className="text-orange-900 dark:text-orange-100 whitespace-pre-line leading-relaxed">
                    {selectedStudy.application}
                  </div>
                </div>
              )}

              {/* Perguntas para Reflexão */}
              {selectedStudy.reflection_questions && selectedStudy.reflection_questions.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 rounded-lg p-6 border-l-4 border-green-500">
                  <h3 className="font-bold text-lg mb-4 text-green-700 dark:text-green-300">
                    🤔 Perguntas para Reflexão
                  </h3>
                  <div className="space-y-3">
                    {selectedStudy.reflection_questions.map((question, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-green-600 dark:text-green-400 font-bold">{idx + 1}.</span>
                        <p className="text-green-900 dark:text-green-100 flex-1">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Ações */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={isCompleted ? "default" : "outline"}
                    onClick={() => markStudyAsComplete(selectedStudy.id)}
                    disabled={isCompleted || !user}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isCompleted ? "✓ Completado" : "Marcar como Completo"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => toggleLike(selectedStudy.id)}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${
                        likedStudies.has(selectedStudy.id) ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    Favoritar
                  </Button>

                  <Button variant="outline" onClick={() => shareStudy(selectedStudy)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {completedStudies.size} estudos completados
                </p>
              </div>

              {/* Você também pode gostar */}
              {(() => {
                const related = studies
                  .filter(s => s.id !== selectedStudy.id && s.category === selectedStudy.category)
                  .slice(0, 3);
                if (related.length === 0) return null;
                return (
                  <div className="border-t pt-6">
                    <h3 className="font-bold text-lg mb-3">✨ Você também pode gostar</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {related.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedStudy(s);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-left rounded-lg border p-3 hover:border-primary/50 hover:shadow-md transition-all"
                        >
                          <p className="font-medium text-sm line-clamp-2">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                          {completedStudies.has(s.id) && (
                            <Badge variant="secondary" className="mt-2 text-[10px]">✓ Concluído</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Modal de referência bíblica */}
          {refModal && (
            <BibleReferenceModal
              open={!!refModal}
              onOpenChange={(o) => !o && setRefModal(null)}
              reference={refModal}
            />
          )}
        </main>
      </div>
    );
  }

  // Lista de estudos
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">
            📚 Estudos Bíblicos
          </h1>
          <p className="text-muted-foreground">
            {studies.length} estudos profundos para crescimento espiritual
          </p>
        </div>

        {/* Versículo do Dia */}
        <button
          onClick={() => setRefModal(verseOfTheDay())}
          className="w-full mb-6 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 px-5 py-4 text-left hover:shadow-md hover:border-primary/40 transition-all group"
        >
          <p className="text-xs font-semibold text-primary mb-1">✨ VERSÍCULO DO DIA</p>
          <p className="font-medium flex items-center justify-between gap-2">
            📖 {verseOfTheDay()}
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              Toque para ler →
            </span>
          </p>
        </button>

        {/* Barra de Pesquisa */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudo, autor ou tema..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <Card className="mb-6 shadow-divine">
          <CardContent className="p-4">
            {/* Categorias */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Categorias:</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tipos */}
            <div>
              <p className="text-sm font-medium mb-2">Formato:</p>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={selectedType === 'text' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('text')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Texto
                </Button>
                <Button
                  variant={selectedType === 'video' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('video')}
                >
                  <Video className="h-4 w-4 mr-1" />
                  Vídeo
                </Button>
                <Button
                  variant={selectedType === 'audio' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('audio')}
                >
                  <Headphones className="h-4 w-4 mr-1" />
                  Áudio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Estudos */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando estudos...</p>
            </div>
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Nenhum estudo encontrado</h2>
            <p className="text-muted-foreground mb-6">Tente ajustar os filtros ou busca</p>
            <Button onClick={() => { setSearch(""); setSelectedCategory("Todos"); setSelectedType('all'); }}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudies.map(study => {
              const TypeIcon = typeIcons[study.type];
              const isCompleted = completedStudies.has(study.id);

              return (
                <Card
                  key={study.id}
                  className="cursor-pointer hover:shadow-divine transition-all hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedStudy(study);
                    incrementViews(study.id);
                  }}
                >
                  <CardContent className="p-4">
                    {isCompleted && (
                      <Badge variant="default" className="mb-2 bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {typeLabels[study.type]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {study.category}
                      </Badge>
                    </div>

                    <p className="font-semibold text-lg mb-1 line-clamp-2">{study.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">{study.author}</p>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {study.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {study.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {study.views_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de referência bíblica (versículo do dia) */}
        {refModal && (
          <BibleReferenceModal
            open={!!refModal}
            onOpenChange={(o) => !o && setRefModal(null)}
            reference={refModal}
          />
        )}
      </main>
    </div>
  );
};

export default BibleStudies;
