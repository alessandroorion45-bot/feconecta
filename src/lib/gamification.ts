/**
 * SISTEMA CENTRAL DE GAMIFICAÇÃO
 *
 * Este arquivo contém todas as constantes, tipos e utilitários
 * do sistema unificado de gamificação do FeConecta.
 *
 * Todas as ações do app devem chamar awardXP() para conceder XP ao usuário.
 */

// ============================================
// TIPOS
// ============================================

export type GameAction =
  // Devocional e Estudos
  | 'daily_devotional'
  | 'bible_study'
  | 'bible_reading'
  // Quiz e Perguntas
  | 'quiz_completed'
  | 'quiz_perfect'
  | 'bible_question_answered'
  // Social
  | 'testimony_shared'
  | 'prayer_created'
  | 'prayer_interceded'
  | 'gratitude_post'
  | 'comment_posted'
  // Louvores
  | 'worship_favorited'
  | 'worship_shared'
  // Diário
  | 'daily_login'
  | 'streak_milestone_7'
  | 'streak_milestone_30'
  | 'streak_milestone_100'
  | 'streak_milestone_365'
  // Desafios
  | 'challenge_completed'
  | 'achievement_unlocked';

export interface XPReward {
  xp_earned: number;
  total_xp: number;
  old_level: number;
  new_level: number;
  level_up: boolean;
  old_title: string;
  new_title: string;
}

export interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  streak_increased: boolean;
  milestone_reached: string | null;
}

export interface UserGamificationData {
  total_xp: number;
  level: number;
  title: string;
  current_streak: number;
  longest_streak: number;
  total_achievements: number;
  final_score: number; // XP + Streak Bonus + Achievements
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  icon: string;
  start_date: string;
  end_date: string;
  current_progress?: number;
  completed?: boolean;
}

// ============================================
// CONSTANTES DE XP
// ============================================

export const XP_VALUES: Record<GameAction, number> = {
  // Devocional e Estudos
  daily_devotional: 20,
  bible_study: 30,
  bible_reading: 15,
  // Quiz e Perguntas
  quiz_completed: 15,
  quiz_perfect: 50,
  bible_question_answered: 10,
  // Social
  testimony_shared: 25,
  prayer_created: 15,
  prayer_interceded: 10,
  gratitude_post: 15,
  comment_posted: 5,
  // Louvores
  worship_favorited: 5,
  worship_shared: 10,
  // Diário
  daily_login: 5,
  streak_milestone_7: 50,
  streak_milestone_30: 200,
  streak_milestone_100: 1000,
  streak_milestone_365: 5000,
  // Desafios
  challenge_completed: 100,
  achievement_unlocked: 0, // varia por conquista
};

// ============================================
// CONSTANTES DE NÍVEIS
// ============================================

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 1750,
  7: 2750,
  8: 4000,
  9: 5500,
  10: 7500,
  11: 10000,
  12: 13000,
  13: 16500,
  14: 20500,
  15: 25000,
  16: 30000,
  17: 36000,
  18: 43000,
  19: 51000,
  20: 60000,
  21: 70000,
};

// ============================================
// CONSTANTES DE TÍTULOS
// ============================================

export const TITLES: Record<string, { min: number; max: number; name: string }> = {
  discipulo: { min: 1, max: 10, name: 'Discípulo' },
  servo: { min: 11, max: 20, name: 'Servo' },
  evangelista: { min: 21, max: 30, name: 'Evangelista' },
  obreiro: { min: 31, max: 40, name: 'Obreiro' },
  missionario: { min: 41, max: 50, name: 'Missionário' },
  pastor: { min: 51, max: 70, name: 'Pastor Digital' },
  mestre: { min: 71, max: 90, name: 'Mestre da Palavra' },
  lenda: { min: 91, max: 100, name: 'Lenda da Fé' },
};

// ============================================
// EMOJIS DE STREAK
// ============================================

export const STREAK_EMOJIS: Record<string, string> = {
  1: '🔥',
  7: '🔥🔥',
  30: '🔥🔥🔥',
  100: '👑',
  365: '🏆',
};

export function getStreakEmoji(streak: number): string {
  if (streak >= 365) return STREAK_EMOJIS[365];
  if (streak >= 100) return STREAK_EMOJIS[100];
  if (streak >= 30) return STREAK_EMOJIS[30];
  if (streak >= 7) return STREAK_EMOJIS[7];
  if (streak >= 1) return STREAK_EMOJIS[1];
  return '';
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Calcula o nível baseado no XP total
 */
export function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 1750) return 5;
  if (xp < 2750) return 6;
  if (xp < 4000) return 7;
  if (xp < 5500) return 8;
  if (xp < 7500) return 9;
  if (xp < 10000) return 10;
  if (xp < 13000) return 11;
  if (xp < 16500) return 12;
  if (xp < 20500) return 13;
  if (xp < 25000) return 14;
  if (xp < 30000) return 15;
  if (xp < 36000) return 16;
  if (xp < 43000) return 17;
  if (xp < 51000) return 18;
  if (xp < 60000) return 19;
  if (xp < 70000) return 20;

  // Acima do nível 20, usa fórmula logarítmica
  const level = 20 + Math.floor((xp - 70000) / 5000);
  return Math.min(level, 100); // máximo nível 100
}

/**
 * Obtém o título baseado no nível
 */
export function getTitleFromLevel(level: number): string {
  if (level >= 91) return 'Lenda da Fé';
  if (level >= 71) return 'Mestre da Palavra';
  if (level >= 51) return 'Pastor Digital';
  if (level >= 41) return 'Missionário';
  if (level >= 31) return 'Obreiro';
  if (level >= 21) return 'Evangelista';
  if (level >= 11) return 'Servo';
  return 'Discípulo';
}

/**
 * Calcula XP necessário para o próximo nível
 */
export function getXPForNextLevel(currentLevel: number): number {
  const nextLevel = Math.min(currentLevel + 1, 100);

  if (nextLevel <= 20) {
    return LEVEL_THRESHOLDS[nextLevel] || 0;
  }

  // Acima do nível 20
  return 70000 + ((nextLevel - 20) * 5000);
}

/**
 * Calcula porcentagem de progresso para o próximo nível
 */
export function getProgressToNextLevel(currentXP: number, currentLevel: number): number {
  const nextLevel = Math.min(currentLevel + 1, 100);

  if (currentLevel >= 100) return 100; // já no máximo

  const currentLevelXP = currentLevel <= 20
    ? LEVEL_THRESHOLDS[currentLevel] || 0
    : 70000 + ((currentLevel - 20) * 5000);

  const nextLevelXP = getXPForNextLevel(currentLevel);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;

  return Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
}

/**
 * Calcula pontuação final para o ranking
 * Fórmula: XP Total + Bônus de Streak + Bônus de Conquistas
 */
export function calculateFinalScore(
  totalXP: number,
  currentStreak: number,
  totalAchievements: number
): number {
  const streakBonus = currentStreak * 10; // 10 pontos por dia de streak
  const achievementBonus = totalAchievements * 50; // 50 pontos por conquista

  return totalXP + streakBonus + achievementBonus;
}

/**
 * Formata número grande (ex: 1000 -> 1K, 1000000 -> 1M)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Cor do nível baseado no título
 */
export function getLevelColor(title: string): string {
  switch (title) {
    case 'Lenda da Fé':
      return 'text-yellow-500';
    case 'Mestre da Palavra':
      return 'text-purple-500';
    case 'Pastor Digital':
      return 'text-blue-500';
    case 'Missionário':
      return 'text-green-500';
    case 'Obreiro':
      return 'text-orange-500';
    case 'Evangelista':
      return 'text-red-500';
    case 'Servo':
      return 'text-gray-500';
    default:
      return 'text-gray-400';
  }
}

/**
 * Ícone do título
 */
export function getTitleIcon(title: string): string {
  switch (title) {
    case 'Lenda da Fé':
      return '🏆';
    case 'Mestre da Palavra':
      return '📚';
    case 'Pastor Digital':
      return '⛪';
    case 'Missionário':
      return '🌍';
    case 'Obreiro':
      return '🛠️';
    case 'Evangelista':
      return '📢';
    case 'Servo':
      return '🙏';
    default:
      return '✝️';
  }
}
