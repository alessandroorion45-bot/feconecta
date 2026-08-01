import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { QUIZ_FALLBACK } from "@/lib/quizBank";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { Trophy, Target, Zap, Crown, Award, TrendingUp, Timer, Flame, Check, Sparkles, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarPro } from "@/components/AvatarPro";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  category: string;
  points: number;
  explanation?: string | null;
  bible_reference?: string | null;
}

interface RankingUser {
  user_id: string;
  total_points: number;
  total_correct: number;
  total_answered: number;
  current_level: string;
  profiles: { username: string; full_name: string; avatar_url: string | null };
}

const CATEGORIES = [
  { value: "all", label: "Todos os temas" },
  { value: "jesus", label: "Jesus Cristo" },
  { value: "evangelhos", label: "Evangelhos" },
  { value: "antigo_testamento", label: "Antigo Testamento" },
  { value: "novo_testamento", label: "Novo Testamento" },
  { value: "profetas", label: "Profetas" },
];

const TIMER_SECONDS = 30;

const Quiz = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { awardXP } = useGamification(user?.id);

  const [selectedDifficulty, setSelectedDifficulty] = useState("iniciante");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ points: 0, correct: 0, total: 0 });
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Gamificação
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => { loadRanking(); }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || showResult) return;

    // ✅ Usar setTimeLeft com callback para evitar dependência de timeLeft
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, showResult]); // ✅ Removido timeLeft para evitar re-criação do interval

  const loadRanking = async () => {
    // Sem join embutido (falha quando o FK não existe no remoto);
    // perfis são buscados em lote separadamente
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .order("total_points", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[Quiz] Erro ao carregar ranking:", error);
      return;
    }
    if (!data?.length) {
      setRanking([]);
      return;
    }

    const userIds = [...new Set(data.map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    setRanking(data.map((r: any) => ({
      ...r,
      profiles: profileMap.get(r.user_id) || { username: "usuario", full_name: "Jogador", avatar_url: null },
    })));
  };

  const startQuiz = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para jogar o quiz",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    let query = supabase.from("quiz_questions").select("*").eq("difficulty", selectedDifficulty);
    if (selectedCategory !== "all") query = query.eq("category", selectedCategory);

    const { data, error } = await query;
    setLoading(false);

    // O quiz NUNCA falha ao iniciar: se o banco estiver vazio ou com
    // erro, usa o banco local de perguntas (mesmo nível)
    let pool: Question[] = (data as Question[]) || [];
    if (error || pool.length === 0) {
      if (error) console.error('[Quiz] Erro ao buscar perguntas, usando banco local:', error);
      pool = QUIZ_FALLBACK.filter(q => q.difficulty === selectedDifficulty);
      if (selectedCategory !== "all") {
        const byCategory = pool.filter(q => q.category === selectedCategory);
        if (byCategory.length >= 3) pool = byCategory;
      }
    }

    if (pool.length === 0) {
      toast({
        title: "Sem perguntas disponíveis",
        description: "Tente outro nível ou tema.",
        variant: "destructive"
      });
      return;
    }

    // Shuffle and pick 10
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setScore({ points: 0, correct: 0, total: 0 });
    setCombo(0);
    setMaxCombo(0);
    setQuizStarted(true);
    setQuizFinished(false);
    setShowResult(false);
    setSelectedAnswer(null);
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(true);
  };

  const handleTimeout = () => {
    if (showResult) return;

    setIsCorrect(false);
    setShowResult(true);
    setTimerActive(false);
    setCombo(0); // Perde combo no timeout

    const newScore = {
      ...score,
      total: score.total + 1,
    };
    setScore(newScore);

    toast({
      title: "⏰ Tempo esgotado!",
      description: "Você não respondeu a tempo.",
      variant: "destructive"
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !user) return;

    setTimerActive(false);
    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    // Calcular pontos com multiplicador de combo
    let pointsEarned = 0;
    let newCombo = combo;

    if (correct) {
      newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      // Multiplicador de combo: +10% por combo (máximo 3x)
      const comboMultiplier = Math.min(1 + (newCombo * 0.1), 3);
      pointsEarned = Math.floor(currentQuestion.points * comboMultiplier);

      // Bônus de tempo: resposta rápida (+20% se sobrar >20s)
      if (timeLeft > 20) {
        pointsEarned = Math.floor(pointsEarned * 1.2);
      }

      // Bônus de sequência: marcos de 5 e 10 acertos seguidos
      if (newCombo === 5) {
        pointsEarned += 50;
        toast({ title: "🔥 5 acertos seguidos!", description: "+50 pontos de bônus!" });
      } else if (newCombo === 10) {
        pointsEarned += 100;
        toast({ title: "🏆 10 acertos seguidos!", description: "+100 pontos de bônus! Incrível!" });
      }
    } else {
      newCombo = 0;
      setCombo(0);
    }

    const newScore = {
      points: score.points + pointsEarned,
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);

    // Save answer (perguntas do banco local não têm registro no servidor)
    if (!currentQuestion.id.startsWith("local-")) {
      await supabase.from("quiz_user_answers").insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        user_answer: selectedAnswer,
        is_correct: correct,
        points_earned: pointsEarned,
      });
    }

    // Conceder XP pela resposta correta
    if (correct) {
      await awardXP('bible_question_answered');

      let message = `+${pointsEarned} pontos`;
      if (newCombo > 1) message += ` | 🔥 ${newCombo}x combo!`;
      if (timeLeft > 20) message += ` | ⚡ Bônus de velocidade!`;

      toast({ title: "🎉 Correto!", description: message });
    } else {
      toast({
        title: "❌ Incorreto",
        description: `Resposta correta: ${currentQuestion.correct_answer}`,
        variant: "destructive"
      });
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(TIMER_SECONDS);
      setTimerActive(true);
    } else {
      // Quiz finished - save score
      setQuizFinished(true);
      setQuizStarted(false);
      setTimerActive(false);

      // Conceder XP final
      if (user) {
        // XP por completar quiz
        await awardXP('quiz_completed');

        // XP bônus se acertou 100%
        if (score.correct === questions.length) {
          await awardXP('quiz_perfect');
        }

        const { data: existing } = await supabase.from("quiz_scores").select("*").eq("user_id", user.id).maybeSingle();
        if (existing) {
          await supabase.from("quiz_scores").update({
            total_points: existing.total_points + score.points,
            total_correct: existing.total_correct + score.correct,
            total_answered: existing.total_answered + score.total,
            current_level: selectedDifficulty,
          }).eq("user_id", user.id);
        } else {
          await supabase.from("quiz_scores").insert({
            user_id: user.id,
            total_points: score.points,
            total_correct: score.correct,
            total_answered: score.total,
            current_level: selectedDifficulty,
          });
        }
        loadRanking();
      }
    }
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "iniciante": return "from-green-500 to-green-600";
      case "profissional": return "from-blue-500 to-blue-600";
      case "especialista": return "from-red-500 to-red-600";
      default: return "from-primary to-primary-glow";
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">
            Quiz Bíblico 📖
          </h1>
          <p className="text-muted-foreground">Teste seus conhecimentos sobre a Palavra de Deus</p>
        </div>

        <Tabs defaultValue="quiz" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="quiz">Jogar Quiz</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="quiz">
            {quizFinished && !quizStarted && (
              <Card className="max-w-xl mx-auto shadow-divine mb-8">
                <CardHeader className="text-center bg-gradient-primary text-primary-foreground rounded-t-lg">
                  <Trophy className="h-12 w-12 mx-auto mb-2" />
                  <CardTitle className="text-2xl">Quiz Concluído! 🎊</CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-bold text-primary">{score.correct}</p>
                      <p className="text-sm text-muted-foreground">Acertos</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-accent">{score.points}</p>
                      <p className="text-sm text-muted-foreground">Pontos</p>
                    </div>
                  </div>

                  {maxCombo > 1 && (
                    <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
                      <p className="text-sm font-medium">🔥 Maior Combo: {maxCombo}x</p>
                    </div>
                  )}

                  <p className="text-lg">
                    {score.correct === questions.length ? "Perfeito! 🌟🌟🌟" :
                     score.correct >= 7 ? "Excelente! 🌟" :
                     score.correct >= 5 ? "Muito bem! 👏" : "Continue estudando! 📖"}
                  </p>
                  <Button onClick={() => setQuizFinished(false)} className="bg-gradient-primary text-primary-foreground">
                    Jogar Novamente
                  </Button>
                </CardContent>
              </Card>
            )}

            {!quizStarted && !quizFinished && (
              <div className="space-y-7">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  Escolha o seu nível
                </p>
                <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
                  {[
                    { key: "iniciante", label: "Iniciante", emoji: "🟢", desc: "Perguntas básicas", pts: 10, icon: Target, glow: "16,185,129", ring: "ring-emerald-400", grad: "from-emerald-400 to-green-600" },
                    { key: "profissional", label: "Profissional", emoji: "🔵", desc: "Perguntas intermediárias", pts: 20, icon: Zap, glow: "59,130,246", ring: "ring-blue-400", grad: "from-sky-400 to-blue-600" },
                    { key: "especialista", label: "Especialista", emoji: "🔴", desc: "Perguntas avançadas", pts: 30, icon: Crown, glow: "239,68,68", ring: "ring-red-400", grad: "from-rose-400 to-red-600" },
                  ].map(d => {
                    const active = selectedDifficulty === d.key;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setSelectedDifficulty(d.key)}
                        className={`group relative text-left rounded-3xl transition-all duration-300 focus:outline-none ${active ? "scale-[1.03]" : "hover:-translate-y-1.5"}`}
                      >
                        {/* glow por trás quando selecionado */}
                        {active && (
                          <span
                            className="absolute -inset-2 rounded-[28px] blur-xl -z-10"
                            style={{ background: `radial-gradient(circle, rgba(${d.glow},0.40), transparent 70%)` }}
                            aria-hidden
                          />
                        )}
                        <div
                          className="relative h-full rounded-3xl p-6 text-center overflow-hidden transition-all duration-300"
                          style={{
                            background: `linear-gradient(160deg, rgba(${d.glow},0.10), rgba(${d.glow},0.02) 62%), hsl(var(--card))`,
                            border: active ? `2px solid rgb(${d.glow})` : "1px solid hsl(var(--border) / 0.7)",
                            boxShadow: active
                              ? `0 18px 42px -14px rgba(${d.glow},0.55)`
                              : "0 4px 16px -10px rgba(15,23,42,0.18)",
                          }}
                        >
                          {/* halo suave atrás do ícone */}
                          <span
                            className="pointer-events-none absolute left-1/2 top-4 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl transition-opacity duration-300"
                            style={{ background: `radial-gradient(circle, rgba(${d.glow},0.35), transparent 70%)`, opacity: active ? 0.9 : 0 }}
                            aria-hidden
                          />

                          {/* check de selecionado */}
                          {active && (
                            <span
                              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white/70"
                              style={{ background: `rgb(${d.glow})` }}
                            >
                              <Check className="h-4 w-4" strokeWidth={3} />
                            </span>
                          )}

                          <div
                            className={`relative w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br ${d.grad} flex items-center justify-center mx-auto mb-4 ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${active ? "scale-105" : ""}`}
                            style={{ boxShadow: `0 10px 28px -6px rgba(${d.glow},0.6)` }}
                          >
                            <span className="absolute -top-1 -left-1 h-6 w-6 rounded-full bg-white/40 blur-md" aria-hidden />
                            <d.icon className="relative h-8 w-8 text-white" strokeWidth={2.2} />
                          </div>

                          <h3
                            className="text-lg font-extrabold tracking-tight transition-colors"
                            style={{ color: active ? `rgb(${d.glow})` : undefined }}
                          >
                            {d.label}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 mb-4">{d.desc}</p>

                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                            style={{ background: `linear-gradient(135deg, rgb(${d.glow}), rgba(${d.glow},0.65))` }}
                          >
                            +{d.pts} pts / acerto
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Seleção de tema */}
                <div className="max-w-sm mx-auto">
                  <label className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                    <BookOpen className="h-3.5 w-3.5" /> Tema das perguntas
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Tema" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chips de mecânica */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" /> Combo multiplica pontos
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                    <Zap className="h-3.5 w-3.5" /> Bônus de velocidade
                  </span>
                </div>

                {/* Botão começar */}
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={startQuiz}
                    disabled={loading}
                    className="h-14 px-10 text-base gap-2 !bg-gradient-to-r !from-primary !via-purple-600 !to-indigo-600 text-white shadow-glow rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:shadow-primary/40"
                  >
                    <Trophy className="h-5 w-5" />
                    {loading ? "Carregando..." : "Começar Quiz"}
                  </Button>
                </div>
              </div>
            )}

            {quizStarted && currentQuestion && (
              <Card className="max-w-3xl mx-auto shadow-divine">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`bg-gradient-to-r ${getDifficultyColor(selectedDifficulty)} text-white`}>
                        {selectedDifficulty.toUpperCase()}
                      </Badge>
                      {combo > 1 && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse">
                          <Flame className="h-3 w-3 mr-1" />
                          {combo}x COMBO!
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
                        <Timer className="h-4 w-4" />
                        <span className="font-bold">{timeLeft}s</span>
                      </div>
                      <span className="text-sm font-medium">
                        {currentQuestionIndex + 1}/{questions.length}
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} className="mb-4" />
                  <CardTitle className="text-xl sm:text-2xl">{currentQuestion.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {(["A", "B", "C", "D"] as const).map(opt => {
                      const key = `option_${opt.toLowerCase()}` as keyof Question;
                      const isSelected = selectedAnswer === opt;
                      const isCorrectOpt = currentQuestion.correct_answer === opt;
                      let cls = "w-full justify-start text-left h-auto py-4 px-6 transition-all";

                      if (showResult) {
                        if (isCorrectOpt) cls += " bg-green-100 dark:bg-green-900/30 border-green-500 border-2";
                        else if (isSelected && !isCorrect) cls += " bg-red-100 dark:bg-red-900/30 border-red-500 border-2";
                      } else if (isSelected) cls += " bg-primary/10 border-primary border-2";

                      return (
                        <Button
                          key={opt}
                          variant="outline"
                          className={cls}
                          onClick={() => handleAnswerSelect(opt)}
                          disabled={showResult}
                        >
                          <span className="font-bold mr-3">{opt})</span>
                          {currentQuestion[key] as string}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Aprendizado: explicação e referência bíblica */}
                  {showResult && (currentQuestion.explanation || currentQuestion.bible_reference) && (
                    <div className={`rounded-lg border-l-4 p-4 mb-4 ${
                      isCorrect
                        ? "bg-green-50 dark:bg-green-900/15 border-green-500"
                        : "bg-amber-50 dark:bg-amber-900/15 border-amber-500"
                    }`}>
                      <p className="text-sm font-semibold mb-1">
                        {isCorrect ? "✅ Correto!" : "📖 Aprenda com esta:"}
                      </p>
                      {currentQuestion.explanation && (
                        <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        {currentQuestion.bible_reference && (
                          <span className="text-xs font-semibold text-primary">
                            📖 {currentQuestion.bible_reference}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => navigate("/bible")}
                        >
                          📖 Ler na Bíblia
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="inline h-4 w-4" />
                        <span className="font-bold">{score.points}</span> pontos
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="inline h-4 w-4" />
                        <span className="font-bold">{score.correct}</span> acertos
                      </div>
                    </div>

                    {!showResult ? (
                      <Button
                        onClick={submitAnswer}
                        disabled={!selectedAnswer}
                        className="bg-gradient-primary text-primary-foreground"
                      >
                        Confirmar
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        className="bg-gradient-primary text-primary-foreground"
                      >
                        {currentQuestionIndex < questions.length - 1 ? "Próxima →" : "Finalizar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Ranking Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum jogador ainda. Seja o primeiro!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ranking.map((r, i) => (
                      <div
                        key={r.user_id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-8 text-center">
                          {i === 0 && <Crown className="h-6 w-6 text-yellow-500 mx-auto" />}
                          {i === 1 && <Trophy className="h-6 w-6 text-gray-400 mx-auto" />}
                          {i === 2 && <Award className="h-6 w-6 text-orange-600 mx-auto" />}
                          {i > 2 && <span className="text-muted-foreground font-bold">#{i + 1}</span>}
                        </div>
                        <AvatarPro
                          src={r.profiles?.avatar_url}
                          name={r.profiles?.full_name || r.profiles?.username}
                          userId={r.user_id}
                          size="sm"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{r.profiles?.full_name || r.profiles?.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.total_correct}/{r.total_answered} corretas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{r.total_points} pts</p>
                          <Badge variant="outline" className="text-xs">{r.current_level}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Quiz;
