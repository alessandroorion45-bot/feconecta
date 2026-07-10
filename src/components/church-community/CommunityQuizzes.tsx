import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, Loader2, Plus, Clock, Pencil, Trash2, Award, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import QuizFormModal from "./QuizFormModal";
import QuizPlayer from "./QuizPlayer";

const sb = supabase as any;

interface Quiz {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  timer_minutes: number | null;
  passing_score: number;
  question_count: number;
  best_score: number | null;
}

interface CommunityQuizzesProps {
  communityId: string;
  communityName: string;
  userId: string;
  myRole: string | null;
  isAdmin: boolean;
}

const LEADER_ROLES_SET = ["admin", "pastor", "pastora", "lider_geral", "presbitero", "moderador", "lider_ministerio", "evangelista", "missionario", "professor_ebd"];

const CommunityQuizzes = ({ communityId, communityName, userId, myRole, isAdmin }: CommunityQuizzesProps) => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Membro");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [playingQuiz, setPlayingQuiz] = useState<Quiz | null>(null);

  const canCreate = isAdmin || LEADER_ROLES_SET.includes(myRole || "");

  const load = useCallback(async () => {
    const { data: quizRows } = await sb
      .from("community_quizzes")
      .select("*")
      .eq("community_id", communityId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const list: Quiz[] = quizRows || [];
    if (list.length) {
      const [{ data: qCounts }, { data: myAttempts }] = await Promise.all([
        sb.from("community_quiz_questions").select("quiz_id").in("quiz_id", list.map(q => q.id)),
        sb.from("community_quiz_attempts").select("quiz_id, score_percent").eq("user_id", userId).in("quiz_id", list.map(q => q.id)),
      ]);
      const countMap = new Map<string, number>();
      (qCounts || []).forEach((q: any) => countMap.set(q.quiz_id, (countMap.get(q.quiz_id) || 0) + 1));
      const bestMap = new Map<string, number>();
      (myAttempts || []).forEach((a: any) => {
        const cur = bestMap.get(a.quiz_id) || 0;
        if (a.score_percent > cur) bestMap.set(a.quiz_id, a.score_percent);
      });
      list.forEach(q => {
        q.question_count = countMap.get(q.id) || 0;
        q.best_score = bestMap.has(q.id) ? bestMap.get(q.id)! : null;
      });
    }
    setQuizzes(list);
    setLoading(false);
  }, [communityId, userId]);

  useEffect(() => {
    load();
    supabase.from("profiles").select("full_name").eq("id", userId).single()
      .then(({ data }) => { if (data?.full_name) setUserName(data.full_name); });
  }, [load, userId]);

  const removeQuiz = async (quiz: Quiz) => {
    if (!confirm(`Remover a atividade "${quiz.title}"?`)) return;
    const { error } = await sb.from("community_quizzes").update({ is_active: false }).eq("id", quiz.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Atividade removida" });
    load();
  };

  const canManage = (quiz: Quiz) => isAdmin || quiz.created_by === userId || LEADER_ROLES_SET.includes(myRole || "");

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-amber-500" />
            Atividades Bíblicas
          </h3>
          <p className="text-xs text-muted-foreground">Quiz com pontuação, ranking e certificado interno</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setEditingId(null); setShowForm(true); }} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2">
            <Plus className="h-4 w-4" /> Nova Atividade
          </Button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <HelpCircle className="h-10 w-10 mx-auto text-amber-400" />
            <p className="text-muted-foreground">Nenhuma atividade cadastrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quizzes.map((quiz, i) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
              <Card className="h-full border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-background via-background to-amber-50/40 dark:to-amber-950/20 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold leading-tight">{quiz.title}</h4>
                    {quiz.best_score !== null && (
                      <Badge className="shrink-0 gap-1 text-[10px]"><Award className="h-3 w-3" /> {quiz.best_score}%</Badge>
                    )}
                  </div>
                  {quiz.description && <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{quiz.question_count} pergunta{quiz.question_count !== 1 ? "s" : ""}</Badge>
                    {quiz.timer_minutes ? (
                      <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="h-3 w-3" /> {quiz.timer_minutes} min</Badge>
                    ) : null}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      onClick={() => setPlayingQuiz(quiz)}
                      disabled={quiz.question_count === 0}
                    >
                      {quiz.best_score !== null ? "Refazer" : "Responder"}
                    </Button>
                    {canManage(quiz) && (
                      <>
                        <Button size="icon" variant="outline" onClick={() => { setEditingId(quiz.id); setShowForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="text-destructive hover:text-destructive" onClick={() => removeQuiz(quiz)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <QuizFormModal
        open={showForm}
        onOpenChange={setShowForm}
        communityId={communityId}
        userId={userId}
        quizId={editingId}
        onSaved={load}
      />

      <QuizPlayer
        open={!!playingQuiz}
        onOpenChange={(o) => !o && setPlayingQuiz(null)}
        quiz={playingQuiz}
        userId={userId}
        userName={userName}
        communityName={communityName}
        onCompleted={load}
      />
    </div>
  );
};

export default CommunityQuizzes;
