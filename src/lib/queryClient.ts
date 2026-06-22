// ============================================
// CONFIGURAÇÃO DE REACT QUERY PARA CACHE
// Otimização de performance no frontend
// ============================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos (tempo de vida do cache do Anthropic)
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos

      // Retry automático em caso de erro
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch apenas quando necessário
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,

      // Suspense para loading states
      suspense: false,
    },
    mutations: {
      // Retry para mutations
      retry: 1,
    },
  },
});

// Keys para organização do cache
export const queryKeys = {
  // Ranking
  ranking: (limit?: number) => ['ranking', limit] as const,
  userRank: (userId: string) => ['user-rank', userId] as const,

  // Quiz
  quizQuestions: (category?: string, difficulty?: string) =>
    ['quiz-questions', category, difficulty] as const,
  quizResults: (userId: string) => ['quiz-results', userId] as const,

  // Devocionais
  devotionals: (category?: string, timeOfDay?: string) =>
    ['devotionals', category, timeOfDay] as const,
  devotionalOfDay: () => ['devotional-of-day'] as const,

  // Estudos
  bibleStudies: (category?: string) => ['bible-studies', category] as const,
  studyById: (id: string) => ['bible-study', id] as const,

  // Desafios
  challenges: () => ['challenges'] as const,
  weeklyChallenges: () => ['weekly-challenges'] as const,
  userChallenges: (userId: string) => ['user-challenges', userId] as const,

  // Gratidão
  gratitudePosts: (limit?: number) => ['gratitude-posts', limit] as const,
  userGratitude: (userId: string) => ['user-gratitude', userId] as const,

  // Perguntas bíblicas
  questions: (category?: string) => ['questions', category] as const,
  questionById: (id: string) => ['question', id] as const,
  answers: (questionId: string) => ['answers', questionId] as const,

  // Usuário
  userProfile: (userId: string) => ['user-profile', userId] as const,
  userStats: (userId: string) => ['user-stats', userId] as const,
  userBadges: (userId: string) => ['user-badges', userId] as const,
} as const;

// Prefetch para dados comuns
export const prefetchCommonData = async () => {
  // Prefetch ranking
  await queryClient.prefetchQuery({
    queryKey: queryKeys.ranking(10),
    queryFn: () => fetch('/api/ranking?limit=10').then(res => res.json()),
  });

  // Prefetch devocional do dia
  await queryClient.prefetchQuery({
    queryKey: queryKeys.devotionalOfDay(),
    queryFn: () => fetch('/api/devotionals/today').then(res => res.json()),
  });

  // Prefetch desafios da semana
  await queryClient.prefetchQuery({
    queryKey: queryKeys.weeklyChallenges(),
    queryFn: () => fetch('/api/challenges/weekly').then(res => res.json()),
  });
};

export default queryClient;
