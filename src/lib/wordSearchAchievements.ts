import type { ChestTier } from './wordSearchChests';

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

/** Espelha o catálogo semeado em APLICAR_PALAVRA_VIVA_SQL.sql — mantenha os dois em sincronia. */
export const WORD_SEARCH_ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_word', name: 'Primeiro Acerto', description: 'Encontre sua primeira palavra bíblica', icon: '🏆', xpReward: 10 },
  { key: 'first_level', name: 'Explorador da Palavra', description: 'Complete seu primeiro nível', icon: '📖', xpReward: 20 },
  { key: 'combo_5', name: 'Sequência de Fé', description: 'Alcance um combo x5', icon: '🔥', xpReward: 30 },
  { key: 'combo_10', name: 'Chama Ardente', description: 'Alcance um combo x10', icon: '🔥', xpReward: 60 },
  { key: 'level_10', name: 'Caçador Bíblico', description: 'Alcance o nível 10', icon: '👑', xpReward: 100 },
  { key: 'level_25', name: 'Guardião das Escrituras', description: 'Alcance o nível 25', icon: '📜', xpReward: 250 },
  { key: 'words_100', name: 'Semeador', description: 'Encontre 100 palavras no total', icon: '🌿', xpReward: 80 },
  { key: 'words_500', name: 'Mestre do Êxodo', description: 'Encontre 500 palavras no total', icon: '🌾', xpReward: 300 },
  { key: 'themes_10', name: 'Peregrino Fiel', description: 'Complete níveis em 10 temas diferentes', icon: '🗺️', xpReward: 120 },
  { key: 'diamond_chest', name: 'Tesouro Revelado', description: 'Abra um baú de diamante', icon: '💎', xpReward: 150 },
  { key: 'covenant_chest', name: 'Guardião da Aliança', description: 'Abra um baú da Aliança', icon: '👑', xpReward: 300 },
];

export interface AchievementContext {
  isFirstWordEver: boolean;
  isFirstLevelEver: boolean;
  maxComboThisLevel: number;
  level: number;
  totalWordsFound: number;
  distinctThemesCompleted: number;
  chestTier: ChestTier;
  alreadyUnlocked: Set<string>;
}

/** Retorna as chaves de conquistas recém-desbloqueadas nesta jogada (ainda não persistidas). */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  const earned: string[] = [];
  const unlock = (key: string) => {
    if (!ctx.alreadyUnlocked.has(key)) earned.push(key);
  };

  if (ctx.isFirstWordEver) unlock('first_word');
  if (ctx.isFirstLevelEver) unlock('first_level');
  if (ctx.maxComboThisLevel >= 5) unlock('combo_5');
  if (ctx.maxComboThisLevel >= 10) unlock('combo_10');
  if (ctx.level >= 10) unlock('level_10');
  if (ctx.level >= 25) unlock('level_25');
  if (ctx.totalWordsFound >= 100) unlock('words_100');
  if (ctx.totalWordsFound >= 500) unlock('words_500');
  if (ctx.distinctThemesCompleted >= 10) unlock('themes_10');
  if (ctx.chestTier === 'diamante') unlock('diamond_chest');
  if (ctx.chestTier === 'alianca') unlock('covenant_chest');

  return earned;
}
