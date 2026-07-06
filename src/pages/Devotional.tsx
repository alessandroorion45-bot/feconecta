import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Heart, Share2, ChevronLeft, ChevronRight, BookOpen, Sun, Moon, Sunset,
  Calendar, Search, Shuffle, Check, MessageCircle, Bookmark, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Devotional {
  id: string;
  title: string;
  date: string;
  verse_text: string;
  verse_reference: string;
  reflection: string;
  application: string | null;
  prayer: string;
  challenge: string | null;
  category: string;
  time_of_day: 'manha' | 'tarde' | 'noite';
}

const CATEGORIES = [
  "Todos",
  "Fé", "Esperança", "Amor", "Família", "Casamento", "Perdão",
  "Ansiedade", "Depressão", "Trabalho", "Liderança", "Sabedoria",
  "Prosperidade", "Santidade", "Jovens", "Crianças", "Mulheres",
  "Homens", "Missões", "Evangelismo", "Espírito Santo", "Oração", "Gratidão"
];

const Devotional = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { awardXP } = useGamification(user?.id);

  // Estados
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [timeOfDay, setTimeOfDay] = useState<'manha' | 'tarde' | 'noite' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [completedToday, setCompletedToday] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  const current = devotionals[currentIndex];

  // Carregar devocionais do banco
  useEffect(() => {
    loadDevotionals();
    loadUserProgress();
  }, [selectedCategory, timeOfDay]);

  const loadDevotionals = async () => {
    setLoading(true);

    console.log('[Devotional] Carregando devocionais:', { category: selectedCategory, timeOfDay });

    const buildQuery = (orderCol: string) => {
      let query = (supabase as any)
        .from('devotionals')
        .select('*')
        .order(orderCol, { ascending: false });

      if (selectedCategory !== "Todos") {
        query = query.eq('category', selectedCategory.toLowerCase());
      }
      if (timeOfDay !== 'all') {
        query = query.eq('time_of_day', timeOfDay);
      }
      return query.limit(100);
    };

    // A tabela remota pode não ter a coluna "date" — cai para created_at
    let { data, error } = await buildQuery('date');
    if (error) {
      console.warn('[Devotional] Coluna date ausente, ordenando por created_at:', error.message);
      ({ data, error } = await buildQuery('created_at'));
    }
    if (error) {
      // Último recurso: sem ordenação
      console.warn('[Devotional] Recarregando sem ordenação:', error.message);
      ({ data, error } = await (supabase as any).from('devotionals').select('*').limit(100));
    }

    if (error) {
      console.error('[Devotional] Erro ao carregar:', error);
      toast({
        title: "❌ Erro ao carregar devocionais",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    console.log('[Devotional] Carregados:', data?.length, 'devocionais');

    if (data && data.length > 0) {
      setDevotionals(data as Devotional[]);
      setCurrentIndex(0);
    } else {
      toast({
        title: "📚 Nenhum devocional encontrado",
        description: "Tente outro filtro ou categoria",
      });
    }

    setLoading(false);
  };

  const loadUserProgress = async () => {
    if (!user) return;

    // Conclusões do usuário (tolerante à tabela ainda não existir)
    const { data, error } = await (supabase as any)
      .from('devotional_completions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(365);

    if (error || !data) return;

    setTotalCompleted(data.length);

    const today = new Date().toDateString();
    setCompletedToday(data.some((c: any) => new Date(c.completed_at).toDateString() === today));

    // Sequência de dias consecutivos
    const days = [...new Set(data.map((c: any) => new Date(c.completed_at).toDateString()))];
    let s = 0;
    const cursor = new Date();
    if (!days.includes(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.includes(cursor.toDateString())) {
      s++;
      cursor.setDate(cursor.getDate() - 1);
    }
    setStreak(s);
  };

  const markAsComplete = async () => {
    if (completedToday || !user || !current) return;

    setCompletedToday(true);

    // Persiste a conclusão (com a reflexão pessoal, se escrita)
    const { error } = await (supabase as any)
      .from('devotional_completions')
      .insert({
        user_id: user.id,
        devotional_id: current.id,
        reflection: notes.trim() || null,
      });

    if (error && error.code !== '23505') {
      console.warn('[Devotional] Conclusão não persistida (aplicar APLICAR_DEVOCIONAL_SQL.sql):', error.message);
    } else {
      setTotalCompleted(prev => prev + 1);
      setStreak(prev => prev + (completedToday ? 0 : 1));
    }

    // XP da gamificação (ação já existente: daily_devotional)
    void awardXP('daily_devotional');

    // TODO: Adicionar action 'devotional_completed' no sistema de gamificação
    // await awardXP('devotional_completed');

    toast({
      title: "✅ Devocional completado!",
      description: "Continue firme na fé! Volte amanhã para mais 🙏",
      className: "bg-green-50 border-green-200",
    });
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
      toast({ title: "Removido dos favoritos", description: "Devocional removido." });
    } else {
      newFavorites.add(id);
      toast({
        title: "⭐ Adicionado aos favoritos",
        description: "Devocional salvo na sua coleção.",
        className: "bg-green-50 border-green-200",
      });
    }
    setFavorites(newFavorites);
  };

  const shareDevotional = async () => {
    const text = `"${current.verse_text}"\n\n${current.verse_reference}\n\n${current.reflection}\n\n✨ Devocional Diário - Aliança`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Devocional - ${current.title}`, text });
        toast({
          title: "📤 Compartilhado com sucesso!",
          description: "+10 XP por compartilhar",
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copiado!",
        description: "Devocional copiado para a área de transferência.",
      });
    }
  };

  const getRandomDevotional = () => {
    const randomIndex = Math.floor(Math.random() * devotionals.length);
    setCurrentIndex(randomIndex);
    toast({
      title: "🎲 Devocional Aleatório",
      description: "Escolhido especialmente para você!",
    });
  };

  const getTimeIcon = (time: string) => {
    if (time === 'manha') return <Sun className="h-4 w-4 text-yellow-500" />;
    if (time === 'tarde') return <Sunset className="h-4 w-4 text-orange-500" />;
    return <Moon className="h-4 w-4 text-blue-500" />;
  };

  const getTimeLabel = (time: string) => {
    if (time === 'manha') return 'Manhã';
    if (time === 'tarde') return 'Tarde';
    return 'Noite';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando devocionais...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Nenhum devocional encontrado</h2>
            <p className="text-muted-foreground mb-6">Tente ajustar os filtros ou categorias</p>
            <Button onClick={() => { setSelectedCategory("Todos"); setTimeOfDay('all'); }}>
              Ver Todos os Devocionais
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header com Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">
            ✨ Devocional Diário
          </h1>
          <p className="text-muted-foreground">Alimento espiritual para cada dia</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>

        {/* Filtros e Pesquisa */}
        <Card className="mb-6 shadow-divine">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={timeOfDay} onValueChange={(v: any) => setTimeOfDay(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Horários</SelectItem>
                    <SelectItem value="manha">☀️ Manhã</SelectItem>
                    <SelectItem value="tarde">🌅 Tarde</SelectItem>
                    <SelectItem value="noite">🌙 Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={getRandomDevotional}>
                <Shuffle className="h-4 w-4 mr-2" />
                Aleatório
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              {devotionals.length} devocionais disponíveis
            </p>
          </CardContent>
        </Card>

        {/* Card Principal do Devocional */}
        <Card className="shadow-divine overflow-hidden mb-6">
          {/* Header com Versículo */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {current.category.toUpperCase()}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 flex items-center gap-1">
                {getTimeIcon(current.time_of_day)}
                {getTimeLabel(current.time_of_day)}
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{current.title}</h2>

            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-90 animate-pulse" />

            <blockquote className="text-lg sm:text-xl italic font-medium leading-relaxed mb-4">
              "{current.verse_text}"
            </blockquote>

            <p className="text-sm font-semibold opacity-90">{current.verse_reference}</p>
          </div>

          {/* Conteúdo */}
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Reflexão */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                💭 Reflexão
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {current.reflection}
              </p>
            </div>

            {/* Aplicação Prática */}
            {current.application && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">
                  🎯 Aplicação Prática
                </h3>
                <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
                  {current.application}
                </p>
              </div>
            )}

            {/* Desafio do Dia */}
            {current.challenge && (
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-6 border-l-4 border-orange-500">
                <h3 className="font-bold text-lg mb-3 text-orange-700 dark:text-orange-300">
                  ⚡ Desafio do Dia
                </h3>
                <p className="text-orange-900 dark:text-orange-100 leading-relaxed font-medium">
                  {current.challenge}
                </p>
              </div>
            )}

            {/* Oração */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                🙏 Oração do Dia
              </h3>
              <p className="text-purple-900 dark:text-purple-100 italic leading-relaxed text-lg">
                {current.prayer}
              </p>
            </div>

            {/* Anotações Pessoais */}
            <div className="border-t pt-6">
              <Button
                variant="outline"
                size="sm"
                className="mb-3"
                onClick={() => setShowNotes(!showNotes)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {showNotes ? "Ocultar" : "Adicionar"} Anotações Pessoais
              </Button>

              {showNotes && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Escreva suas reflexões, orações ou aprendizados sobre este devocional..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <Button size="sm">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Salvar Anotação
                  </Button>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
              {/* Progresso do usuário */}
              {user && (streak > 0 || totalCompleted > 0) && (
                <div className="flex gap-2 flex-wrap mb-3">
                  <Badge variant="secondary" className="gap-1">
                    🔥 {streak} {streak === 1 ? "dia" : "dias"} seguidos
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    ✅ {totalCompleted} concluídos
                  </Badge>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={completedToday ? "default" : "outline"}
                  size="sm"
                  onClick={markAsComplete}
                  disabled={completedToday || !user}
                  className="transition-all"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {completedToday ? "✓ Completado" : "Marcar como Lido"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(current.id)}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${
                      favorites.has(current.id) ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  Favoritar
                </Button>

                <Button variant="outline" size="sm" onClick={shareDevotional}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Navegação */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(i => i - 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center px-3 text-sm text-muted-foreground">
                  {currentIndex + 1} / {devotionals.length}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentIndex === devotionals.length - 1}
                  onClick={() => setCurrentIndex(i => i + 1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progresso Espiritual */}
        <Card className="shadow-divine">
          <CardHeader>
            <CardTitle className="text-lg">📊 Seu Progresso Espiritual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">1</p>
                <p className="text-xs text-muted-foreground">Dias de Sequência</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{favorites.size}</p>
                <p className="text-xs text-muted-foreground">Favoritos</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">7</p>
                <p className="text-xs text-muted-foreground">Devocionais Lidos</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">140 XP</p>
                <p className="text-xs text-muted-foreground">Ganhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Devotional;
