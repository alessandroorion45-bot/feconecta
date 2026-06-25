import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import BadgeShowcase from "@/components/gamification/BadgeShowcase";
import DailyChallenges from "@/components/gamification/DailyChallenges";
import Leaderboard from "@/components/gamification/Leaderboard";
import {
  Trophy, TrendingUp, Target, Award, Flame, Star, Zap, Crown
} from "lucide-react";
import { formatLargeNumber, getTitleIcon } from "@/lib/gamification";

const Gamification = () => {
  const { user } = useAuth();
  const { userStats, loading, getNextLevelInfo } = useGamification(user?.id);

  const nextLevelInfo = getNextLevelInfo();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-20">
            <Trophy className="h-20 w-20 mx-auto mb-6 text-yellow-500" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-divine bg-clip-text text-transparent">
              Sistema de Gamificação
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Ganhe XP, desbloqueie badges, suba de nível e compete com outros usuários!
              Faça login para começar sua jornada.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
              <Card className="shadow-divine">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <h3 className="font-bold text-lg mb-2">Ganhe XP</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete devocionais, estudos, quizzes e muito mais para ganhar experiência
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-divine">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                  <h3 className="font-bold text-lg mb-2">Desbloqueie Badges</h3>
                  <p className="text-sm text-muted-foreground">
                    Mais de 30 badges para colecionar, de comum a mítico
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-divine">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-orange-500" />
                  <h3 className="font-bold text-lg mb-2">Compete no Ranking</h3>
                  <p className="text-sm text-muted-foreground">
                    Veja sua posição nos rankings globais e semanais
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Preview dos componentes */}
            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              <DailyChallenges />
              <Leaderboard />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header com Stats do Usuário */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-6">
            🎮 Gamificação
          </h1>

          {loading ? (
            <Card className="shadow-divine">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              </CardContent>
            </Card>
          ) : userStats ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* XP Total */}
              <Card className="shadow-divine bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    <Badge variant="secondary" className="text-lg font-bold">
                      {formatLargeNumber(userStats.total_xp)}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">XP Total</h3>
                  <p className="text-sm text-muted-foreground">
                    Experiência acumulada
                  </p>
                </CardContent>
              </Card>

              {/* Nível */}
              <Card className="shadow-divine bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="h-8 w-8 text-purple-500" />
                    <Badge variant="secondary" className="text-lg font-bold">
                      {userStats.level}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">Nível</h3>
                  <p className="text-sm text-muted-foreground">
                    {getTitleIcon(userStats.title)} {userStats.title}
                  </p>
                </CardContent>
              </Card>

              {/* Sequência */}
              <Card className="shadow-divine bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="h-8 w-8 text-orange-500" />
                    <Badge variant="secondary" className="text-lg font-bold">
                      {userStats.current_streak}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">Sequência</h3>
                  <p className="text-sm text-muted-foreground">
                    Dias consecutivos
                  </p>
                </CardContent>
              </Card>

              {/* Pontuação Final */}
              <Card className="shadow-divine bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="h-8 w-8 text-green-500" />
                    <Badge variant="secondary" className="text-lg font-bold">
                      {formatLargeNumber(userStats.final_score)}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">Pontuação</h3>
                  <p className="text-sm text-muted-foreground">
                    Score total
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Progresso para Próximo Nível */}
          {nextLevelInfo && (
            <Card className="shadow-divine mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      Nível {nextLevelInfo.currentLevel} → {nextLevelInfo.nextLevel}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Faltam {formatLargeNumber(nextLevelInfo.xpRemaining)} XP para o próximo nível
                    </p>
                  </div>
                  <Crown className="h-10 w-10 text-yellow-500" />
                </div>
                <Progress value={nextLevelInfo.progressPercent} className="h-3" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{formatLargeNumber(nextLevelInfo.currentXP)} XP</span>
                  <span>{nextLevelInfo.progressPercent}%</span>
                  <span>{formatLargeNumber(nextLevelInfo.xpForNext)} XP</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs Principais */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Desafios</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Rankings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            <DailyChallenges />
          </TabsContent>

          <TabsContent value="badges">
            <BadgeShowcase />
          </TabsContent>

          <TabsContent value="ranking">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Gamification;
