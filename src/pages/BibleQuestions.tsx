import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, ThumbsUp, CheckCircle2, Send, HelpCircle, ChevronLeft, Trash2, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Question {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  likes_count: number;
  answers_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null; username: string };
}

interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  is_best: boolean;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null; username: string };
}

const CATEGORIES = ["Geral", "Teologia", "Profecia", "Vida Cristã", "Família", "Oração", "Louvor", "Batalha Espiritual", "Evangelismo"];

const BibleQuestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("Geral");
  const [newTags, setNewTags] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "unanswered">("recent");
  const [submitting, setSubmitting] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => { loadQuestions(); }, [sortBy]);

  const loadQuestions = async () => {
    setLoading(true);
    let query = supabase.from("bible_questions").select("*, profiles:user_id(full_name, avatar_url, username)");
    
    if (sortBy === "recent") query = query.order("created_at", { ascending: false });
    else if (sortBy === "popular") query = query.order("likes_count", { ascending: false });
    else if (sortBy === "unanswered") query = query.eq("answers_count", 0).order("created_at", { ascending: false });

    const { data } = await query.limit(50);
    if (data) setQuestions(data as unknown as Question[]);
    setLoading(false);
  };

  const loadAnswers = async (questionId: string) => {
    const { data } = await supabase
      .from("bible_question_answers")
      .select("*, profiles:user_id(full_name, avatar_url, username)")
      .eq("question_id", questionId)
      .order("is_best", { ascending: false })
      .order("likes_count", { ascending: false });
    if (data) setAnswers(data as unknown as Answer[]);

    // Load user likes
    if (user) {
      const { data: likes } = await supabase
        .from("bible_question_likes")
        .select("answer_id, question_id")
        .eq("user_id", user.id);
      if (likes) {
        const ids = new Set<string>();
        likes.forEach(l => { if (l.answer_id) ids.add(l.answer_id); if (l.question_id) ids.add(l.question_id); });
        setUserLikes(ids);
      }
    }
  };

  const openQuestion = (q: Question) => {
    setSelectedQuestion(q);
    loadAnswers(q.id);
  };

  const submitQuestion = async () => {
    if (!user || !newTitle.trim() || !newBody.trim()) {
      toast({
        title: "⚠️ Campos obrigatórios",
        description: "Preencha título e corpo da pergunta",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    console.log('[BibleQuestions] Publicando pergunta:', {
      user_id: user.id,
      title: newTitle.trim(),
      category: newCategory,
      tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
    });

    const { data, error } = await supabase.from("bible_questions").insert({
      user_id: user.id,
      title: newTitle.trim(),
      body: newBody.trim(),
      category: newCategory,
      tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
    }).select();

    setSubmitting(false);

    if (error) {
      console.error('[BibleQuestions] Erro ao publicar:', error);
      toast({
        title: "❌ Erro ao publicar pergunta",
        description: error.message || "Verifique sua conexão e tente novamente",
        variant: "destructive",
      });
      return;
    }

    console.log('[BibleQuestions] Pergunta publicada com sucesso:', data);

    toast({
      title: "✅ Pergunta publicada!",
      description: "Sua dúvida foi compartilhada com a comunidade (+5 XP)",
      className: "bg-green-50 border-green-200",
    });

    setNewTitle("");
    setNewBody("");
    setNewTags("");
    setShowNewQuestion(false);
    loadQuestions();
  };

  const submitAnswer = async () => {
    if (!user || !newAnswer.trim() || !selectedQuestion) {
      toast({
        title: "⚠️ Campo obrigatório",
        description: "Digite sua resposta antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    console.log('[BibleQuestions] Enviando resposta:', {
      question_id: selectedQuestion.id,
      user_id: user.id,
      content_length: newAnswer.trim().length,
    });

    const { data, error } = await supabase.from("bible_question_answers").insert({
      question_id: selectedQuestion.id,
      user_id: user.id,
      content: newAnswer.trim(),
    }).select();

    setSubmitting(false);

    if (error) {
      console.error('[BibleQuestions] Erro ao responder:', error);
      toast({
        title: "❌ Erro ao enviar resposta",
        description: error.message || "Verifique sua conexão e tente novamente",
        variant: "destructive",
      });
      return;
    }

    console.log('[BibleQuestions] Resposta enviada com sucesso:', data);

    toast({
      title: "✅ Resposta enviada!",
      description: "Obrigado por ajudar a comunidade (+3 XP)",
      className: "bg-green-50 border-green-200",
    });

    setNewAnswer("");
    loadAnswers(selectedQuestion.id);
    loadQuestions();
  };

  const toggleLikeAnswer = async (answerId: string) => {
    if (!user) return;
    if (userLikes.has(answerId)) {
      await supabase.from("bible_question_likes").delete().eq("user_id", user.id).eq("answer_id", answerId);
      setUserLikes(prev => { const n = new Set(prev); n.delete(answerId); return n; });
      setAnswers(a => a.map(ans => ans.id === answerId ? { ...ans, likes_count: ans.likes_count - 1 } : ans));
    } else {
      await supabase.from("bible_question_likes").insert({ user_id: user.id, answer_id: answerId });
      setUserLikes(prev => new Set(prev).add(answerId));
      setAnswers(a => a.map(ans => ans.id === answerId ? { ...ans, likes_count: ans.likes_count + 1 } : ans));
    }
  };

  const toggleBestAnswer = async (answerId: string) => {
    if (!user || !selectedQuestion || selectedQuestion.user_id !== user.id) return;
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    // Unset all best, then toggle
    await supabase.from("bible_question_answers").update({ is_best: false }).eq("question_id", selectedQuestion.id);
    if (!answer.is_best) {
      await supabase.from("bible_question_answers").update({ is_best: true }).eq("id", answerId);
    }
    loadAnswers(selectedQuestion.id);
    toast({ title: answer.is_best ? "Destaque removido" : "Melhor resposta marcada! ✅" });
  };

  const deleteAnswer = async (answerId: string) => {
    await supabase.from("bible_question_answers").delete().eq("id", answerId);
    loadAnswers(selectedQuestion!.id);
    loadQuestions();
    toast({ title: "Resposta removida" });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  // Detail view
  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedQuestion(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Card className="shadow-divine mb-6">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedQuestion.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{selectedQuestion.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{selectedQuestion.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedQuestion.profiles?.full_name} • {formatDate(selectedQuestion.created_at)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-3">{selectedQuestion.body}</p>
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedQuestion.category}</Badge>
                {selectedQuestion.tags?.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <h3 className="font-semibold text-lg mb-4">
            {answers.length} Resposta{answers.length !== 1 ? "s" : ""}
          </h3>

          {answers.map(a => (
            <Card key={a.id} className={`mb-3 ${a.is_best ? "ring-2 ring-green-500" : ""}`}>
              <CardContent className="p-4">
                {a.is_best && <Badge className="mb-2 bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Melhor Resposta</Badge>}
                <div className="flex items-start gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={a.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{a.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">{a.content}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant={userLikes.has(a.id) ? "default" : "ghost"} size="sm" onClick={() => toggleLikeAnswer(a.id)}>
                    <ThumbsUp className="h-4 w-4 mr-1" /> {a.likes_count}
                  </Button>
                  {user?.id === selectedQuestion.user_id && (
                    <Button variant="ghost" size="sm" onClick={() => toggleBestAnswer(a.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> {a.is_best ? "Remover destaque" : "Melhor resposta"}
                    </Button>
                  )}
                  {(user?.id === a.user_id || user?.id === selectedQuestion.user_id) && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAnswer(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {answers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Seja o primeiro a responder!</p>
            </div>
          )}

          <Card className="mt-4">
            <CardContent className="p-4">
              <Textarea placeholder="Escreva sua resposta..." value={newAnswer} onChange={e => setNewAnswer(e.target.value)} className="mb-3" />
              <Button onClick={submitAnswer} disabled={!newAnswer.trim() || submitting}>
                <Send className="h-4 w-4 mr-2" /> {submitting ? "Enviando..." : "Responder"}
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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Perguntas Bíblicas</h1>
          <p className="text-muted-foreground">Tire dúvidas e aprenda com a comunidade</p>
        </div>

        <Button className="w-full mb-4" onClick={() => setShowNewQuestion(!showNewQuestion)}>
          <HelpCircle className="h-4 w-4 mr-2" /> Fazer uma Pergunta
        </Button>

        {showNewQuestion && (
          <Card className="mb-6 shadow-divine">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Título da pergunta" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Textarea placeholder="Detalhe sua dúvida..." value={newBody} onChange={e => setNewBody(e.target.value)} />
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Tags separadas por vírgula (ex: fé, salvação)" value={newTags} onChange={e => setNewTags(e.target.value)} />
              <Button onClick={submitQuestion} disabled={!newTitle.trim() || !newBody.trim() || submitting}>
                <Send className="h-4 w-4 mr-2" /> {submitting ? "Publicando..." : "Publicar"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sort */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>Recentes</Button>
          <Button variant={sortBy === "popular" ? "default" : "outline"} size="sm" onClick={() => setSortBy("popular")}>Mais curtidas</Button>
          <Button variant={sortBy === "unanswered" ? "default" : "outline"} size="sm" onClick={() => setSortBy("unanswered")}>Sem resposta</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma pergunta ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {questions.map(q => (
              <Card key={q.id} className="cursor-pointer hover:shadow-divine transition-shadow" onClick={() => openQuestion(q)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{q.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{q.profiles?.full_name} • {formatDate(q.created_at)}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                        {q.tags?.slice(0, 2).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm shrink-0">
                      <div className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {q.answers_count}</div>
                      <div className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {q.likes_count}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BibleQuestions;
