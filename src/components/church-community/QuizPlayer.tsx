import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AvatarPro } from "@/components/AvatarPro";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, ArrowUp, ArrowDown, Award, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { QUESTION_TYPE_LABEL, gradeAnswer, shuffleWithOriginalIndex, type QuizQuestion } from "@/lib/quizTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const sb = supabase as any;

interface QuizMeta {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  timer_minutes: number | null;
  passing_score: number;
}

interface QuizPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: QuizMeta | null;
  userId: string;
  userName: string;
  communityName: string;
  onCompleted: () => void;
}

type Stage = "intro" | "loading" | "playing" | "submitting" | "results";

interface RankingRow {
  user_id: string;
  score_percent: number;
  completed_at: string;
  full_name: string;
  avatar_url: string | null;
}

const QuizPlayer = ({ open, onOpenChange, quiz, userId, userName, communityName, onCompleted }: QuizPlayerProps) => {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [choOrder, setChoOrder] = useState<Record<string, { item: string; originalIndex: number }[]>>({});
  const [assocShuffled, setAssocShuffled] = useState<Record<string, { item: { left: string; right: string }; originalIndex: number }[]>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [result, setResult] = useState<{ scorePercent: number; correctCount: number; totalGradable: number } | null>(null);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStage("intro");
      setAnswers({});
      setResult(null);
      submittedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  const startQuiz = async () => {
    if (!quiz) return;
    setStage("loading");
    const { data, error } = await sb.from("community_quiz_questions").select("*").eq("quiz_id", quiz.id).order("order_index");
    if (error || !data?.length) {
      toast({ title: "Erro ao carregar perguntas", variant: "destructive" });
      setStage("intro");
      return;
    }
    setQuestions(data);

    const cho: Record<string, any> = {};
    const assoc: Record<string, any> = {};
    data.forEach((q: QuizQuestion) => {
      if (q.type === "chronological_order") cho[q.id] = shuffleWithOriginalIndex(q.options || []);
      if (q.type === "association") assoc[q.id] = shuffleWithOriginalIndex(q.options || []);
    });
    setChoOrder(cho);
    setAssocShuffled(assoc);
    setAnswers({});
    submittedRef.current = false;

    if (quiz.timer_minutes) {
      setSecondsLeft(quiz.timer_minutes * 60);
    } else {
      setSecondsLeft(null);
    }
    setStage("playing");
  };

  useEffect(() => {
    if (stage !== "playing" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    timerRef.current = setInterval(() => setSecondsLeft(s => (s !== null ? s - 1 : s)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft === null]);

  const setAnswer = (questionId: string, value: any) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const moveOrderItem = (questionId: string, index: number, dir: -1 | 1) => {
    setChoOrder(prev => {
      const list = [...(prev[questionId] || [])];
      const j = index + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[index], list[j]] = [list[j], list[index]];
      return { ...prev, [questionId]: list };
    });
  };

  const submit = async () => {
    if (submittedRef.current || !quiz) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("submitting");

    // Monta as respostas finais (ordem/associação vêm do estado de embaralhamento)
    const finalAnswers: Record<string, any> = { ...answers };
    questions.forEach(q => {
      if (q.type === "chronological_order") {
        finalAnswers[q.id] = (choOrder[q.id] || []).map(x => x.originalIndex);
      }
    });

    let correctCount = 0;
    let totalGradable = 0;
    let earnedPoints = 0;
    let totalPoints = 0;
    questions.forEach(q => {
      const graded = gradeAnswer(q, finalAnswers[q.id]);
      if (graded === null) return; // discursiva
      totalGradable += 1;
      totalPoints += q.points;
      if (graded) {
        correctCount += 1;
        earnedPoints += q.points;
      }
    });
    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    try {
      const { error } = await sb.from("community_quiz_attempts").insert({
        quiz_id: quiz.id,
        community_id: quiz.community_id,
        user_id: userId,
        score_percent: scorePercent,
        correct_count: correctCount,
        total_gradable: totalGradable,
        answers: finalAnswers,
      });
      if (error) throw error;

      const { data: attempts } = await sb
        .from("community_quiz_attempts")
        .select("user_id, score_percent, completed_at")
        .eq("quiz_id", quiz.id)
        .order("score_percent", { ascending: false })
        .order("completed_at", { ascending: true })
        .limit(100);

      const bestByUser = new Map<string, { user_id: string; score_percent: number; completed_at: string }>();
      (attempts || []).forEach((a: any) => {
        const existing = bestByUser.get(a.user_id);
        if (!existing || a.score_percent > existing.score_percent) bestByUser.set(a.user_id, a);
      });
      const top = [...bestByUser.values()].sort((a, b) => b.score_percent - a.score_percent).slice(0, 10);
      const ids = top.map(t => t.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
        : { data: [] as any[] };
      const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      setRanking(top.map(t => ({
        user_id: t.user_id,
        score_percent: t.score_percent,
        completed_at: t.completed_at,
        full_name: pMap.get(t.user_id)?.full_name || "Membro",
        avatar_url: pMap.get(t.user_id)?.avatar_url || null,
      })));

      setResult({ scorePercent, correctCount, totalGradable });
      setStage("results");
      onCompleted();
    } catch (err: any) {
      toast({ title: "Erro ao enviar respostas", description: err.message, variant: "destructive" });
      setStage("playing");
      submittedRef.current = false;
    }
  };

  const timeLabel = useMemo(() => {
    if (secondsLeft === null) return null;
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  if (!quiz) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {stage === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle>{quiz.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}
              <div className="flex gap-2 flex-wrap">
                {quiz.timer_minutes ? (
                  <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> {quiz.timer_minutes} min</Badge>
                ) : (
                  <Badge variant="secondary">Sem tempo limite</Badge>
                )}
                <Badge variant="secondary">Nota mínima: {quiz.passing_score}%</Badge>
              </div>
              <Button onClick={startQuiz} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                Começar
              </Button>
            </div>
          </>
        )}

        {stage === "loading" && (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        )}

        {(stage === "playing" || stage === "submitting") && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle>{quiz.title}</DialogTitle>
                {timeLabel && (
                  <Badge variant={secondsLeft !== null && secondsLeft < 60 ? "destructive" : "secondary"} className="gap-1 shrink-0">
                    <Clock className="h-3 w-3" /> {timeLabel}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            <div className="space-y-5">
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">{i + 1}. </span>
                    {q.question_text}
                    <span className="ml-1.5 text-[10px] text-muted-foreground align-middle">{QUESTION_TYPE_LABEL[q.type].emoji}</span>
                  </p>

                  {q.type === "multiple_choice" && (
                    <RadioGroup value={answers[q.id] !== undefined ? String(answers[q.id]) : ""} onValueChange={(v) => setAnswer(q.id, Number(v))} className="space-y-1.5">
                      {(q.options || []).map((opt: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <RadioGroupItem value={String(idx)} id={`${q.id}-${idx}`} />
                          <Label htmlFor={`${q.id}-${idx}`} className="font-normal">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.type === "true_false" && (
                    <RadioGroup value={answers[q.id] !== undefined ? String(answers[q.id]) : ""} onValueChange={(v) => setAnswer(q.id, v === "true")} className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="true" id={`${q.id}-true`} />
                        <Label htmlFor={`${q.id}-true`}>Certo</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="false" id={`${q.id}-false`} />
                        <Label htmlFor={`${q.id}-false`}>Errado</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {q.type === "complete_verse" && (
                    <Input placeholder="Sua resposta" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
                  )}

                  {q.type === "chronological_order" && (
                    <div className="space-y-1.5">
                      {(choOrder[q.id] || []).map((x, idx) => (
                        <div key={x.originalIndex} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="flex-1 text-sm">{x.item}</span>
                          <button type="button" disabled={idx === 0} onClick={() => moveOrderItem(q.id, idx, -1)} className="disabled:opacity-30">
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" disabled={idx === (choOrder[q.id]?.length || 0) - 1} onClick={() => moveOrderItem(q.id, idx, 1)} className="disabled:opacity-30">
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "association" && (
                    <div className="space-y-1.5">
                      {(q.options || []).map((pair: { left: string; right: string }, leftIdx: number) => (
                        <div key={leftIdx} className="flex items-center gap-2">
                          <span className="text-sm flex-1">{pair.left}</span>
                          <Select
                            value={answers[q.id]?.[leftIdx] !== undefined ? String(answers[q.id][leftIdx]) : ""}
                            onValueChange={(v) => {
                              const current = answers[q.id] || [];
                              const next = [...current];
                              next[leftIdx] = Number(v);
                              setAnswer(q.id, next);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {(assocShuffled[q.id] || []).map(x => (
                                <SelectItem key={x.originalIndex} value={String(x.originalIndex)}>{x.item.right}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "discursive" && (
                    <Textarea rows={3} placeholder="Sua resposta" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} className="resize-none" />
                  )}
                </div>
              ))}

              <Button onClick={submit} disabled={stage === "submitting"} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                {stage === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Enviar respostas
              </Button>
            </div>
          </>
        )}

        {stage === "results" && result && (
          <>
            <DialogHeader>
              <DialogTitle>Resultado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">{result.scorePercent}%</p>
                <p className="text-sm text-muted-foreground">{result.correctCount} de {result.totalGradable} corretas</p>
              </div>

              {result.scorePercent >= quiz.passing_score ? (
                <div className="rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 p-5 text-center space-y-2">
                  <Award className="h-10 w-10 mx-auto text-amber-500" />
                  <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400">Certificado de Conclusão</p>
                  <p className="font-serif text-lg font-semibold">{userName}</p>
                  <p className="text-sm text-muted-foreground">concluiu a atividade</p>
                  <p className="font-medium">"{quiz.title}"</p>
                  <p className="text-xs text-muted-foreground">com aproveitamento de {result.scorePercent}% — {communityName}</p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Nota mínima para o certificado: {quiz.passing_score}%. Tente novamente!
                </div>
              )}

              {ranking.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-500" /> Ranking</p>
                  <div className="space-y-1.5">
                    {ranking.map((r, i) => (
                      <div key={r.user_id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${r.user_id === userId ? "bg-primary/10" : "bg-muted/40"}`}>
                        <span className="text-xs font-medium w-5 text-center">{i + 1}º</span>
                        <AvatarPro src={r.avatar_url} name={r.full_name} size="xs" clickable={false} />
                        <span className="text-xs flex-1 truncate">{r.full_name}</span>
                        <span className="text-xs font-semibold">{r.score_percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuizPlayer;
