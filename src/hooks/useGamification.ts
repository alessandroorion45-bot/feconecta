/**
 * HOOK CENTRAL DE GAMIFICAÇÃO
 *
 * Este hook fornece todas as funções necessárias para o sistema de gamificação:
 * - awardXP: Concede XP ao usuário
 * - updateStreak: Atualiza streak diário
 * - getUserStats: Obtém estatísticas do usuário
 * - getWeeklyChallenges: Obtém desafios semanais
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  GameAction,
  XPReward,
  StreakUpdate,
  UserGamificationData,
  WeeklyChallenge,
  XP_VALUES,
  calculateLevel,
  getTitleFromLevel,
  getProgressToNextLevel,
  getXPForNextLevel,
  calculateFinalScore,
  getStreakEmoji,
} from '@/lib/gamification';

export function useGamification(userId?: string) {
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<UserGamificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const statsFetchKeyRef = useRef<string | null>(null);

  // ============================================
  // FUNÇÃO CENTRAL: AWARD XP (COM MULTIPLICADOR VIP)
  // ============================================
  const awardXP = useCallback(async (
    action: GameAction,
    metadata?: Record<string, any>
  ): Promise<XPReward | null> => {
    if (!userId) {
      console.warn('[Gamification] userId não fornecido para awardXP');
      return null;
    }

    try {
      // Buscar multiplicador VIP do usuário
      const { data: multiplierData } = await (supabase.rpc as any)('get_xp_multiplier', { user_id: userId });
      const vipMultiplier = (multiplierData as number) || 1;

      const baseXP = XP_VALUES[action];
      const finalXP = Math.floor(baseXP * vipMultiplier);

      console.log(`[Gamification] Concedendo XP: ${action} (+${baseXP} XP base × ${vipMultiplier} = ${finalXP} XP final)`);

      // Chamar função do banco de dados
      const { data, error } = await (supabase.rpc as any)('award_xp', {
        p_user_id: userId,
        p_action_key: action,
        p_metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      });

      if (error) {
        console.error('[Gamification] Erro ao conceder XP:', error);
        throw error;
      }

      const reward = (data as any)?.[0] as XPReward;

      console.log('[Gamification] XP concedido:', reward);

      // Atualizar stats locais
      if (userStats) {
        setUserStats({
          ...userStats,
          total_xp: reward.total_xp,
          level: reward.new_level,
          title: reward.new_title,
          final_score: calculateFinalScore(
            reward.total_xp,
            userStats.current_streak,
            userStats.total_achievements
          ),
        });
      }

      // Mostrar notificação de XP ganho
      toast({
        title: `+${reward.xp_earned} XP`,
        description: getActionDescription(action),
        duration: 2000,
      });

      // Se subiu de nível, mostrar notificação especial
      if (reward.level_up) {
        toast({
          title: `🎉 Nível ${reward.new_level}!`,
          description: `Você é agora um ${reward.new_title}!`,
          duration: 5000,
        });
      }

      return reward;
    } catch (error) {
      console.error('[Gamification] Erro inesperado ao conceder XP:', error);
      return null;
    }
  }, [userId, userStats, toast]);

  // ============================================
  // ATUALIZAR STREAK
  // ============================================
  const updateStreak = useCallback(async (): Promise<StreakUpdate | null> => {
    if (!userId) return null;

    try {
      console.log('[Gamification] Atualizando streak...');

      const { data, error } = await (supabase.rpc as any)('update_user_streak', {
        p_user_id: userId,
      });

      if (error) throw error;

      const streak = (data as any)?.[0] as StreakUpdate;

      console.log('[Gamification] Streak atualizado:', streak);

      // Se aumentou o streak, mostrar notificação
      if (streak.streak_increased) {
        const emoji = getStreakEmoji(streak.current_streak);
        toast({
          title: `${emoji} Sequência de ${streak.current_streak} dias!`,
          description: 'Continue assim para ganhar mais XP!',
          duration: 3000,
        });
      }

      // Se atingiu milestone, já ganhou XP automaticamente
      if (streak.milestone_reached) {
        const milestoneXP = XP_VALUES[streak.milestone_reached as GameAction];
        toast({
          title: `🏆 Milestone Alcançado!`,
          description: `+${milestoneXP} XP bônus pela sequência!`,
          duration: 5000,
        });
      }

      // Atualizar stats locais
      if (userStats) {
        setUserStats({
          ...userStats,
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
          final_score: calculateFinalScore(
            userStats.total_xp,
            streak.current_streak,
            userStats.total_achievements
          ),
        });
      }

      return streak;
    } catch (error) {
      console.error('[Gamification] Erro ao atualizar streak:', error);
      return null;
    }
  }, [userId, userStats, toast]);

  // ============================================
  // OBTER ESTATÍSTICAS DO USUÁRIO
  // ============================================
  const getUserStats = useCallback(async (): Promise<UserGamificationData | null> => {
    if (!userId) return null;

    try {
      setLoading(true);

      // Buscar stats do usuário
      const statsQuery = supabase.from('user_stats' as any);
      const { data: stats, error: statsError } = await (statsQuery as any)
        .select('total_xp, level, title, current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      // Se não tem stats, criar registro inicial
      if (!stats) {
        const insertQuery = supabase.from('user_stats' as any);
        const { error: insertError } = await (insertQuery as any)
          .insert({
            user_id: userId,
            total_xp: 0,
            level: 1,
            title: 'Discípulo',
            current_streak: 0,
            longest_streak: 0,
          });

        if (insertError) throw insertError;

        const initialStats: UserGamificationData = {
          total_xp: 0,
          level: 1,
          title: 'Discípulo',
          current_streak: 0,
          longest_streak: 0,
          total_achievements: 0,
          final_score: 0,
        };

        setUserStats(initialStats);
        return initialStats;
      }

      // Contar conquistas
      const achievementsQuery = supabase.from('user_achievements' as any);
      const { count: achievementsCount } = await (achievementsQuery as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const totalAchievements = achievementsCount || 0;

      const userData: UserGamificationData = {
        total_xp: stats.total_xp || 0,
        level: stats.level || 1,
        title: stats.title || 'Discípulo',
        current_streak: stats.current_streak || 0,
        longest_streak: stats.longest_streak || 0,
        total_achievements: totalAchievements,
        final_score: calculateFinalScore(
          stats.total_xp || 0,
          stats.current_streak || 0,
          totalAchievements
        ),
      };

      setUserStats(userData);
      return userData;
    } catch (error) {
      console.error('[Gamification] Erro ao buscar stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ============================================
  // OBTER DESAFIOS SEMANAIS
  // ============================================
  const getWeeklyChallenges = useCallback(async (): Promise<WeeklyChallenge[]> => {
    try {
      // Buscar desafios ativos
      const challengesQuery = supabase.from('weekly_challenges' as any);
      const { data: challenges, error } = await (challengesQuery as any)
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      if (!userId || !challenges) return (challenges as any) || [];

      // Buscar progresso do usuário nos desafios
      const challengeIds = challenges.map((c: any) => c.id);
      const progressQuery = supabase.from('user_challenge_progress' as any);
      const { data: progress } = await (progressQuery as any)
        .select('challenge_id, current_progress, completed')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      // Combinar desafios com progresso
      const challengesWithProgress: WeeklyChallenge[] = (challenges as any).map((challenge: any) => {
        const userProgress = (progress as any)?.find((p: any) => p.challenge_id === challenge.id);

        return {
          ...challenge,
          current_progress: userProgress?.current_progress || 0,
          completed: userProgress?.completed || false,
        };
      });

      return challengesWithProgress;
    } catch (error) {
      console.error('[Gamification] Erro ao buscar desafios:', error);
      return [];
    }
  }, [userId]);

  // ============================================
  // BUSCAR STATS AO MONTAR
  // ============================================
  useEffect(() => {
    if (!userId) {
      statsFetchKeyRef.current = null;
      return;
    }

    const fetchKey = `user:${userId}`;
    if (statsFetchKeyRef.current === fetchKey) {
      return;
    }

    statsFetchKeyRef.current = fetchKey;
    void getUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Removido getUserStats das dependências - o ref guard já previne duplicatas

  // ============================================
  // HELPER: XP PARA PRÓXIMO NÍVEL
  // ============================================
  const getNextLevelInfo = useCallback(() => {
    if (!userStats) return null;

    const xpNeeded = getXPForNextLevel(userStats.level);
    const progress = getProgressToNextLevel(userStats.total_xp, userStats.level);
    const xpRemaining = xpNeeded - userStats.total_xp;

    return {
      currentLevel: userStats.level,
      nextLevel: Math.min(userStats.level + 1, 100),
      currentXP: userStats.total_xp,
      xpForNext: xpNeeded,
      xpRemaining,
      progressPercent: progress,
    };
  }, [userStats]);

  return {
    // Dados
    userStats,
    loading,

    // Funções principais
    awardXP,
    updateStreak,
    getUserStats,
    getWeeklyChallenges,

    // Helpers
    getNextLevelInfo,
  };
}

// ============================================
// HELPER: DESCRIÇÃO DA AÇÃO
// ============================================
function getActionDescription(action: GameAction): string {
  const descriptions: Record<GameAction, string> = {
    daily_devotional: 'Devocional completado',
    bible_study: 'Estudo bíblico finalizado',
    bible_reading: 'Leitura da Bíblia',
    quiz_completed: 'Quiz completado',
    quiz_perfect: 'Quiz perfeito!',
    bible_question_answered: 'Pergunta respondida',
    testimony_shared: 'Testemunho compartilhado',
    prayer_created: 'Oração criada',
    prayer_interceded: 'Intercessão realizada',
    gratitude_post: 'Gratidão publicada',
    comment_posted: 'Comentário enviado',
    worship_favorited: 'Louvor favoritado',
    worship_shared: 'Louvor compartilhado',
    daily_login: 'Login diário',
    streak_milestone_7: 'Sequência de 7 dias!',
    streak_milestone_30: 'Sequência de 30 dias!',
    streak_milestone_100: 'Sequência de 100 dias!',
    streak_milestone_365: 'Sequência de 1 ano!',
    challenge_completed: 'Desafio completado!',
    achievement_unlocked: 'Conquista desbloqueada',
  };

  return descriptions[action] || 'Ação completada';
}
