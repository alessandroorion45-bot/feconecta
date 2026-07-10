import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, Loader2, Save, Plus, Trash2, GripVertical, X } from "lucide-react";
import { QUESTION_TYPES, TIMER_OPTIONS, type QuestionType } from "@/lib/quizTypes";

const sb = supabase as any;

interface QuestionDraft {
  tempId: string;
  type: QuestionType;
  question_text: string;
  points: number;
  mcOptions: string[];
  mcCorrectIndex: number;
  tfCorrect: boolean;
  cvAnswer: string;
  coItems: string[];
  assocPairs: { left: string; right: string }[];
}

const newQuestion = (type: QuestionType = "multiple_choice"): QuestionDraft => ({
  tempId: crypto.randomUUID(),
  type,
  question_text: "",
  points: 10,
  mcOptions: ["", "", "", ""],
  mcCorrectIndex: 0,
  tfCorrect: true,
  cvAnswer: "",
  coItems: ["", "", ""],
  assocPairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }],
});

interface QuizFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  quizId?: string | null;
  onSaved: () => void;
}

const QuizFormModal = ({ open, onOpenChange, communityId, userId, quizId, onSaved }: QuizFormModalProps) => {
  const { toast } = useToast();
  const isEditing = !!quizId;
  const [saving, setSaving] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);

  useEffect(() => {
    if (!open) return;
    if (quizId) {
      setLoadingQuiz(true);
      (async () => {
        const [{ data: quiz }, { data: qs }] = await Promise.all([
          sb.from("community_quizzes").select("*").eq("id", quizId).single(),
          sb.from("community_quiz_questions").select("*").eq("quiz_id", quizId).order("order_index"),
        ]);
        if (quiz) {
          setTitle(quiz.title || "");
          setDescription(quiz.description || "");
          setTimerMinutes(quiz.timer_minutes || 0);
          setPassingScore(quiz.passing_score || 70);
        }
        setQuestions((qs || []).map((q: any) => {
          const d = newQuestion(q.type);
          d.tempId = q.id;
          d.question_text = q.question_text;
          d.points = q.points;
          if (q.type === "multiple_choice") {
            d.mcOptions = q.options?.length ? q.options : d.mcOptions;
            d.mcCorrectIndex = q.correct_answer?.correct_index ?? 0;
          } else if (q.type === "true_false") {
            d.tfCorrect = q.correct_answer?.correct_bool ?? true;
          } else if (q.type === "complete_verse") {
            d.cvAnswer = q.correct_answer?.answer || "";
          } else if (q.type === "chronological_order") {
            d.coItems = q.options?.length ? q.options : d.coItems;
          } else if (q.type === "association") {
            d.assocPairs = q.options?.length ? q.options : d.assocPairs;
          }
          return d;
        }));
        setLoadingQuiz(false);
      })();
    } else {
      setTitle("");
      setDescription("");
      setTimerMinutes(0);
      setPassingScore(70);
      setQuestions([newQuestion()]);
    }
  }, [open, quizId]);

  const updateQuestion = (tempId: string, patch: Partial<QuestionDraft>) => {
    setQuestions(prev => prev.map(q => (q.tempId === tempId ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => setQuestions(prev => [...prev, newQuestion()]);
  const removeQuestion = (tempId: string) => setQuestions(prev => prev.filter(q => q.tempId !== tempId));

  const validate = (): string | null => {
    if (!title.trim()) return "Dê um título pra atividade.";
    if (questions.length === 0) return "Adicione pelo menos uma pergunta.";
    for (const q of questions) {
      if (!q.question_text.trim()) return "Toda pergunta precisa de um enunciado.";
      if (q.type === "multiple_choice" && q.mcOptions.filter(o => o.trim()).length < 2) return "Múltipla escolha precisa de pelo menos 2 alternativas.";
      if (q.type === "complete_verse" && !q.cvAnswer.trim()) return "Informe a resposta correta do versículo.";
      if (q.type === "chronological_order" && q.coItems.filter(i => i.trim()).length < 2) return "Ordem cronológica precisa de pelo menos 2 itens.";
      if (q.type === "association" && q.assocPairs.filter(p => p.left.trim() && p.right.trim()).length < 2) return "Associação precisa de pelo menos 2 pares.";
    }
    return null;
  };

  const save = async () => {
    const error = validate();
    if (error) {
      toast({ title: "Revise a atividade", description: error, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let id = quizId;
      const quizPayload = {
        title: title.trim(),
        description: description.trim() || null,
        timer_minutes: timerMinutes || null,
        passing_score: passingScore,
      };

      if (isEditing && id) {
        const { error: updErr } = await sb.from("community_quizzes").update(quizPayload).eq("id", id);
        if (updErr) throw updErr;
        await sb.from("community_quiz_questions").delete().eq("quiz_id", id);
      } else {
        const { data, error: insErr } = await sb.from("community_quizzes").insert({
          community_id: communityId, created_by: userId, ...quizPayload,
        }).select().single();
        if (insErr) throw insErr;
        id = data.id;
      }

      const rows = questions.map((q, index) => {
        let options: any = [];
        let correct_answer: any = null;
        if (q.type === "multiple_choice") {
          options = q.mcOptions.filter(o => o.trim());
          correct_answer = { correct_index: q.mcCorrectIndex };
        } else if (q.type === "true_false") {
          correct_answer = { correct_bool: q.tfCorrect };
        } else if (q.type === "complete_verse") {
          correct_answer = { answer: q.cvAnswer.trim() };
        } else if (q.type === "chronological_order") {
          options = q.coItems.filter(i => i.trim());
          correct_answer = { order: options.map((_: any, i: number) => i) };
        } else if (q.type === "association") {
          options = q.assocPairs.filter(p => p.left.trim() && p.right.trim());
          correct_answer = { mapping: options.map((_: any, i: number) => i) };
        }
        return {
          quiz_id: id,
          order_index: index,
          type: q.type,
          question_text: q.question_text.trim(),
          options,
          correct_answer,
          points: q.points,
        };
      });

      const { error: qErr } = await sb.from("community_quiz_questions").insert(rows);
      if (qErr) throw qErr;

      toast({ title: isEditing ? "✅ Atividade atualizada!" : "✅ Atividade criada!" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <BookOpenCheck className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>{isEditing ? "Editar Atividade Bíblica" : "Nova Atividade Bíblica"}</DialogTitle>
          </div>
          <DialogDescription>Monte um quiz com pontuação, ranking e certificado interno.</DialogDescription>
        </DialogHeader>

        {loadingQuiz ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Quiz sobre o Livro de Êxodo" value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} className="resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tempo limite</Label>
                <Select value={String(timerMinutes)} onValueChange={(v) => setTimerMinutes(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMER_OPTIONS.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nota mínima pro certificado (%)</Label>
                <Input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} disabled={saving} />
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Perguntas ({questions.length})</h4>
              </div>

              {questions.map((q, qIndex) => (
                <Card key={q.tempId} className="border-dashed">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-muted-foreground shrink-0">#{qIndex + 1}</span>
                      <Select value={q.type} onValueChange={(v) => updateQuestion(q.tempId, { type: v as QuestionType })}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number" min={1} max={100} value={q.points}
                        onChange={(e) => updateQuestion(q.tempId, { points: Number(e.target.value) })}
                        className="h-8 w-16 text-xs" title="Pontos"
                      />
                      {questions.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeQuestion(q.tempId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Textarea
                      placeholder={q.type === "complete_verse" ? 'Ex: "Porque Deus amou o mundo de tal maneira que deu o seu Filho ______."' : "Enunciado da pergunta"}
                      rows={2}
                      value={q.question_text}
                      onChange={(e) => updateQuestion(q.tempId, { question_text: e.target.value })}
                      className="resize-none text-sm"
                    />

                    {q.type === "multiple_choice" && (
                      <RadioGroup value={String(q.mcCorrectIndex)} onValueChange={(v) => updateQuestion(q.tempId, { mcCorrectIndex: Number(v) })} className="space-y-2">
                        {q.mcOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <RadioGroupItem value={String(i)} id={`${q.tempId}-opt-${i}`} />
                            <Input
                              placeholder={`Alternativa ${i + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const next = [...q.mcOptions];
                                next[i] = e.target.value;
                                updateQuestion(q.tempId, { mcOptions: next });
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                        <p className="text-[11px] text-muted-foreground pl-6">Marque a alternativa correta.</p>
                      </RadioGroup>
                    )}

                    {q.type === "true_false" && (
                      <RadioGroup value={String(q.tfCorrect)} onValueChange={(v) => updateQuestion(q.tempId, { tfCorrect: v === "true" })} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="true" id={`${q.tempId}-true`} />
                          <Label htmlFor={`${q.tempId}-true`}>Certo</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="false" id={`${q.tempId}-false`} />
                          <Label htmlFor={`${q.tempId}-false`}>Errado</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {q.type === "complete_verse" && (
                      <Input
                        placeholder="Resposta correta (a palavra/trecho que falta)"
                        value={q.cvAnswer}
                        onChange={(e) => updateQuestion(q.tempId, { cvAnswer: e.target.value })}
                        className="h-8 text-sm"
                      />
                    )}

                    {q.type === "chronological_order" && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground">Digite os itens já na ordem correta — eles aparecerão embaralhados pro participante.</p>
                        {q.coItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <Input
                              value={item}
                              onChange={(e) => {
                                const next = [...q.coItems];
                                next[i] = e.target.value;
                                updateQuestion(q.tempId, { coItems: next });
                              }}
                              className="h-8 text-sm flex-1"
                            />
                            {q.coItems.length > 2 && (
                              <button type="button" onClick={() => updateQuestion(q.tempId, { coItems: q.coItems.filter((_, idx) => idx !== i) })}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateQuestion(q.tempId, { coItems: [...q.coItems, ""] })}>
                          <Plus className="h-3 w-3 mr-1" /> Item
                        </Button>
                      </div>
                    )}

                    {q.type === "association" && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground">Pares corretos — a coluna da direita aparecerá embaralhada pro participante.</p>
                        {q.assocPairs.map((pair, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              placeholder="Item"
                              value={pair.left}
                              onChange={(e) => {
                                const next = [...q.assocPairs];
                                next[i] = { ...next[i], left: e.target.value };
                                updateQuestion(q.tempId, { assocPairs: next });
                              }}
                              className="h-8 text-sm flex-1"
                            />
                            <span className="text-xs text-muted-foreground">↔</span>
                            <Input
                              placeholder="Correspondente"
                              value={pair.right}
                              onChange={(e) => {
                                const next = [...q.assocPairs];
                                next[i] = { ...next[i], right: e.target.value };
                                updateQuestion(q.tempId, { assocPairs: next });
                              }}
                              className="h-8 text-sm flex-1"
                            />
                            {q.assocPairs.length > 2 && (
                              <button type="button" onClick={() => updateQuestion(q.tempId, { assocPairs: q.assocPairs.filter((_, idx) => idx !== i) })}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateQuestion(q.tempId, { assocPairs: [...q.assocPairs, { left: "", right: "" }] })}>
                          <Plus className="h-3 w-3 mr-1" /> Par
                        </Button>
                      </div>
                    )}

                    {q.type === "discursive" && (
                      <p className="text-[11px] text-muted-foreground italic">Resposta livre — não entra na pontuação automática.</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar pergunta
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || loadingQuiz} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizFormModal;
