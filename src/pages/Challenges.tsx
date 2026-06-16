import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Clock, CheckCircle, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DailyBiblicalChallenges from "@/components/DailyBiblicalChallenges";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  challenge_type: string;
  requirement_value: number;
  points_reward: number;
  badge_reward: string | null;
  end_date: string;
  user_progress?: {
    current_progress: number;
    is_completed: boolean;
  };
}

const Challenges = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChallenges(user.id);
    }
  }, [user]);

  const loadChallenges = async (userId: string) => {
    setLoading(true);

    // Load active challenges
    const { data: challengesData } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .order("end_date", { ascending: true });

    if (challengesData) {
      // Load user progress for these challenges
      const { data: progressData } = await supabase
        .from("user_challenges")
        .select("challenge_id, current_progress, is_completed")
        .eq("user_id", userId);

      const progressMap = new Map(
        progressData?.map(p => [p.challenge_id, p]) || []
      );

      const enrichedChallenges = challengesData.map(challenge => ({
        ...challenge,
        user_progress: progressMap.get(challenge.id),
      }));

      setChallenges(enrichedChallenges);
    }

    setLoading(false);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getProgressPercentage = (challenge: Challenge) => {
    if (!challenge.user_progress) return 0;
    return Math.min(
      (challenge.user_progress.current_progress / challenge.requirement_value) * 100,
      100
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <p className="text-center text-muted-foreground">Carregando desafios...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <Card className="shadow-divine mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Desafios
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete desafios para ganhar pontos extras e subir no ranking!
            </p>
          </CardHeader>
        </Card>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Desafio Diário</span>
              <span className="sm:hidden">Diário</span>
            </TabsTrigger>
            <TabsTrigger value="temporary" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Temporários</span>
              <span className="sm:hidden">Temporários</span>
            </TabsTrigger>
          </TabsList>

          {/* Desafios Bíblicos Diários */}
          <TabsContent value="daily">
            {user && <DailyBiblicalChallenges userId={user.id} />}
          </TabsContent>

          {/* Desafios Temporários */}
          <TabsContent value="temporary">
            <div className="grid gap-6">
              {challenges.map((challenge) => {
                const progress = challenge.user_progress?.current_progress || 0;
                const isCompleted = challenge.user_progress?.is_completed || false;
                const progressPercentage = getProgressPercentage(challenge);

                return (
                  <Card
                    key={challenge.id}
                    className={`shadow-divine transition-all ${
                      isCompleted
                        ? "border-green-500/50 bg-green-500/5"
                        : "hover:shadow-glow"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl sm:text-5xl">{challenge.icon}</div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap">
                                <span className="truncate">{challenge.title}</span>
                                {isCompleted && (
                                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {challenge.description}
                              </p>
                            </div>
                            
                            <Badge variant="outline" className="gap-1 shrink-0 self-start">
                              <Clock className="h-3 w-3" />
                              {getTimeRemaining(challenge.end_date)}
                            </Badge>
                          </div>

                          <div className="space-y-3 mt-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progresso</span>
                                <span className="font-semibold">
                                  {progress} / {challenge.requirement_value}
                                </span>
                              </div>
                              <Progress value={progressPercentage} className="h-3" />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="gap-1">
                                  <Trophy className="h-3 w-3" />
                                  +{challenge.points_reward} pontos
                                </Badge>
                                {challenge.badge_reward && (
                                  <Badge variant="secondary" className="gap-1">
                                    🏅 {challenge.badge_reward}
                                  </Badge>
                                )}
                              </div>

                              {isCompleted && (
                                <span className="text-sm font-semibold text-green-500">
                                  ✓ Completado!
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {challenges.length === 0 && (
                <Card className="shadow-divine">
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum desafio temporário ativo no momento.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Enquanto isso, complete os desafios bíblicos diários!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Challenges;
