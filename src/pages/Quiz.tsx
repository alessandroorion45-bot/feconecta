import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Target, Zap, Crown, Award, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  { value: "personagens", label: "Personagens" },
  { value: "milagres", label: "Milagres" },
  { value: "profetas", label: "Profetas" },
  { value: "evangelhos", label: "Evangelhos" },
  { value: "cartas", label: "Cartas" },
  { value: "apocalipse", label: "Apocalipse" },
  { value: "vida_crista", label: "Vida Cristã" },
  { value: "batalha_espiritual", label: "Batalha Espiritual" },
  { value: "louvor", label: "Louvor" },
];

const Quiz = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

  useEffect(() => { loadRanking(); }, []);

  const loadRanking = async () => {
    const { data } = await supabase
      .from("quiz_scores")
      .select("*, profiles:user_id(username, full_name, avatar_url)")
      .order("total_points", { ascending: false })
      .limit(20);
    if (data) setRanking(data as any);
  };

  const startQuiz = async () => {
    setLoading(true);
    let query = supabase.from("quiz_questions").select("*").eq("difficulty", selectedDifficulty);
    if (selectedCategory !== "all") query = query.eq("category", selectedCategory);

    const { data } = await query;
    setLoading(false);

    if (!data || data.length === 0) {
      toast({ title: "Sem perguntas disponíveis", description: "Tente outro nível ou tema.", variant: "destructive" });
      return;
    }

    // Shuffle and pick 10
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setScore({ points: 0, correct: 0, total: 0 });
    setQuizStarted(true);
    setQuizFinished(false);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !user) return;
    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    const newScore = {
      points: score.points + (correct ? currentQuestion.points : 0),
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);

    // Save answer
    await supabase.from("quiz_user_answers").insert({
      user_id: user.id, question_id: currentQuestion.id,
      user_answer: selectedAnswer, is_correct: correct,
      points_earned: correct ? currentQuestion.points : 0,
    });

    if (correct) {
      toast({ title: "🎉 Correto!", description: `+${currentQuestion.points} pontos` });
    } else {
      toast({ title: "❌ Incorreto", description: `Resposta: ${currentQuestion.correct_answer}`, variant: "destructive" });
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz finished - save score
      setQuizFinished(true);
      setQuizStarted(false);

      if (user) {
        const { data: existing } = await supabase.from("quiz_scores").select("*").eq("user_id", user.id).single();
        if (existing) {
          await supabase.from("quiz_scores").update({
            total_points: existing.total_points + score.points,
            total_correct: existing.total_correct + score.correct,
            total_answered: existing.total_answered + score.total,
            current_level: selectedDifficulty,
          }).eq("user_id", user.id);
        } else {
          await supabase.from("quiz_scores").insert({
            user_id: user.id, total_points: score.points,
            total_correct: score.correct, total_answered: score.total,
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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Quiz Bíblico 📖</h1>
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
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-3xl font-bold text-primary">{score.correct}</p><p className="text-sm text-muted-foreground">Acertos</p></div>
                    <div><p className="text-3xl font-bold">{score.total}</p><p className="text-sm text-muted-foreground">Total</p></div>
                    <div><p className="text-3xl font-bold text-accent">{score.points}</p><p className="text-sm text-muted-foreground">Pontos</p></div>
                  </div>
                  <p className="text-lg">{score.correct >= 7 ? "Excelente! 🌟" : score.correct >= 5 ? "Muito bem! 👏" : "Continue estudando! 📖"}</p>
                  <Button onClick={() => setQuizFinished(false)} className="bg-gradient-primary text-primary-foreground">
                    Jogar Novamente
                  </Button>
                </CardContent>
              </Card>
            )}

            {!quizStarted && !quizFinished && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {[{ key: "iniciante", label: "🟢 Iniciante", desc: "Perguntas básicas", pts: 10, icon: Target },
                    { key: "profissional", label: "🔵 Profissional", desc: "Perguntas intermediárias", pts: 20, icon: Zap },
                    { key: "especialista", label: "🔴 Especialista", desc: "Perguntas avançadas", pts: 30, icon: Crown }].map(d => (
                    <Card key={d.key} className={`cursor-pointer transition-all hover:shadow-divine ${selectedDifficulty === d.key ? `ring-2 ring-primary` : ""}`} onClick={() => setSelectedDifficulty(d.key)}>
                      <CardHeader className="text-center">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getDifficultyColor(d.key)} flex items-center justify-center mx-auto mb-3`}>
                          <d.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-lg">{d.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">{d.desc}</p>
                        <Badge variant="outline">{d.pts} pts/acerto</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="max-w-xs mx-auto">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="text-center">
                  <Button size="lg" onClick={startQuiz} disabled={loading} className="bg-gradient-primary text-primary-foreground shadow-glow">
                    <Trophy className="mr-2 h-5 w-5" /> {loading ? "Carregando..." : "Começar Quiz"}
                  </Button>
                </div>
              </div>
            )}

            {quizStarted && currentQuestion && (
              <Card className="max-w-3xl mx-auto shadow-divine">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`bg-gradient-to-r ${getDifficultyColor(selectedDifficulty)} text-white`}>
                      {selectedDifficulty.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">Pergunta {currentQuestionIndex + 1}/{questions.length}</span>
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
                      let cls = "w-full justify-start text-left h-auto py-4 px-6";
                      if (showResult) {
                        if (isCorrectOpt) cls += " bg-green-100 dark:bg-green-900/30 border-green-500";
                        else if (isSelected && !isCorrect) cls += " bg-red-100 dark:bg-red-900/30 border-red-500";
                      } else if (isSelected) cls += " bg-primary/10 border-primary";

                      return (
                        <Button key={opt} variant="outline" className={cls} onClick={() => handleAnswerSelect(opt)} disabled={showResult}>
                          <span className="font-bold mr-3">{opt})</span> {currentQuestion[key] as string}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground"><Award className="inline h-4 w-4 mr-1" /> Pontos: <span className="font-bold">{score.points}</span></div>
                    {!showResult ? (
                      <Button onClick={submitAnswer} disabled={!selectedAnswer} className="bg-gradient-primary text-primary-foreground">Confirmar</Button>
                    ) : (
                      <Button onClick={nextQuestion} className="bg-gradient-primary text-primary-foreground">
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
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Ranking Geral</CardTitle></CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum jogador ainda. Seja o primeiro!</p>
                ) : (
                  <div className="space-y-3">
                    {ranking.map((r, i) => (
                      <div key={r.user_id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-8 text-center">
                          {i === 0 && <Crown className="h-6 w-6 text-yellow-500 mx-auto" />}
                          {i === 1 && <Trophy className="h-6 w-6 text-gray-400 mx-auto" />}
                          {i === 2 && <Award className="h-6 w-6 text-orange-600 mx-auto" />}
                          {i > 2 && <span className="text-muted-foreground font-bold">#{i + 1}</span>}
                        </div>
                        <Avatar><AvatarImage src={r.profiles?.avatar_url || undefined} /><AvatarFallback>{r.profiles?.full_name?.[0] || "?"}</AvatarFallback></Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{r.profiles?.full_name || r.profiles?.username}</p>
                          <p className="text-xs text-muted-foreground">{r.total_correct}/{r.total_answered} corretas</p>
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
