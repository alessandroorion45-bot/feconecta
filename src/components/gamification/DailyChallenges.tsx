import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Circle, Clock, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyChallenge {
  title: string;
  description: string;
  action: string;
  target: number;
  xp_reward: number;
  icon: string;
  index: number;
  completed: boolean;
  current_progress: number;
}

const DailyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadDailyChallenges();
  }, [user]);

  const loadDailyChallenges = async () => {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // Buscar desafios do dia
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_challenges')
      .select('challenges')
      .eq('challenge_date', today)
      .single();

    if (dailyError || !dailyData) {
      console.error('[DailyChallenges] Erro ao carregar:', dailyError);
      setLoading(false);
      return;
    }

    const todayChallenges = dailyData.challenges as any[];

    if (!user) {
      // Usuário não logado - mostrar desafios sem progresso
      const challengesData = todayChallenges.map((c, idx) => ({
        ...c,
        index: idx,
        completed: false,
        current_progress: 0,
      }));
      setChallenges(challengesData);
      setLoading(false);
      return;
    }

    // Buscar progresso do usuário
    const { data: progressData } = await supabase
      .from('user_daily_challenge_progress')
      .select('challenge_index, completed')
      .eq('user_id', user.id)
      .eq('challenge_date', today);

    // Buscar progresso real baseado em ações do dia
    const { data: xpHistory } = await supabase
      .from('xp_history')
      .select('action_key')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    // Combinar dados
    const challengesWithProgress = todayChallenges.map((challenge, idx) => {
      const userProgress = progressData?.find(p => p.challenge_index === idx);

      // Contar quantas vezes a ação foi feita hoje
      const actionCount = xpHistory?.filter(x => x.action_key === challenge.action).length || 0;

      const currentProgress = Math.min(actionCount, challenge.target);
      const isCompleted = currentProgress >= challenge.target;

      return {
        ...challenge,
        index: idx,
        completed: isCompleted || userProgress?.completed || false,
        current_progress: currentProgress,
      };
    });

    setChallenges(challengesWithProgress);
    setCompletedCount(challengesWithProgress.filter(c => c.completed).length);
    setLoading(false);
  };

  const timeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return formatDistanceToNow(tomorrow, { locale: ptBR, addSuffix: true });
  };

  if (loading) {
    return (
      <Card className="shadow-divine">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const allCompleted = completedCount === challenges.length;

  return (
    <Card className={`shadow-divine ${allCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            🎯 Desafios Diários
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Renova {timeUntilReset()}</span>
          </div>
        </div>

        {allCompleted && (
          <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-4 border-green-500">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              🎉 Parabéns! Você completou todos os desafios de hoje!
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const progress = (challenge.current_progress / challenge.target) * 100;

          return (
            <div
              key={challenge.index}
              className={`p-4 rounded-lg border-2 transition-all ${
                challenge.completed
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-500'
                  : 'bg-muted/50 border-border hover:border-primary'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Ícone e Checkbox */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl">{challenge.icon}</div>
                  {challenge.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500 fill-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-lg">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {challenge.description}
                      </p>
                    </div>
                    <Badge
                      variant={challenge.completed ? 'default' : 'secondary'}
                      className={challenge.completed ? 'bg-green-500' : ''}
                    >
                      +{challenge.xp_reward} XP
                    </Badge>
                  </div>

                  {/* Barra de Progresso */}
                  {!challenge.completed && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso</span>
                        <span className="font-medium">
                          {challenge.current_progress} / {challenge.target}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {challenge.completed && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Completo!
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Resumo */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Total</span>
            <span className="font-bold">
              {completedCount} / {challenges.length} Completos
            </span>
          </div>
          <Progress
            value={(completedCount / challenges.length) * 100}
            className="h-3 mt-2"
          />
        </div>

        {!user && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 Faça login para acompanhar seu progresso nos desafios diários!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;
