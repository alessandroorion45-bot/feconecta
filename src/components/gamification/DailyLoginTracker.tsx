/**
 * DAILY LOGIN TRACKER
 *
 * Componente invisível que rastreia o login diário do usuário
 * e atualiza o streak automaticamente.
 *
 * Deve ser montado uma vez no App.tsx
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';

export function DailyLoginTracker() {
  const { user } = useAuth();
  const { awardXP, updateStreak } = useGamification(user?.id);
  const hasTrackedToday = useRef(false);

  useEffect(() => {
    if (!user || hasTrackedToday.current) return;

    const trackDailyLogin = async () => {
      try {
        console.log('[DailyLogin] Rastreando login diário...');

        // 1. Atualizar streak (já concede XP de milestones automaticamente)
        const streakResult = await updateStreak();

        if (streakResult) {
          console.log('[DailyLogin] Streak atualizado:', streakResult);

          // 2. Dar XP de login diário (apenas se não perdeu streak)
          if (streakResult.streak_increased || streakResult.current_streak > 0) {
            await awardXP('daily_login');
          }
        }

        // Marcar como rastreado hoje
        hasTrackedToday.current = true;
        localStorage.setItem('last_daily_login', new Date().toDateString());

      } catch (error) {
        console.error('[DailyLogin] Erro ao rastrear login:', error);
      }
    };

    // Verificar se já rastreou hoje
    const lastLogin = localStorage.getItem('last_daily_login');
    const today = new Date().toDateString();

    if (lastLogin !== today) {
      trackDailyLogin();
    } else {
      hasTrackedToday.current = true;
    }
  }, [user, awardXP, updateStreak]);

  return null; // Componente invisível
}
