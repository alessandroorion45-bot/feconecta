/** Sistema de baús do Palavra Viva — recompensa simbólica, sem economia/moeda nova. */

export type ChestTier = 'madeira' | 'prata' | 'ouro' | 'diamante' | 'alianca';

export interface ChestConfig {
  tier: ChestTier;
  label: string;
  icon: string;
  color: string; // gradiente tailwind
  xpBonus: number;
}

export const CHESTS: Record<ChestTier, ChestConfig> = {
  madeira: { tier: 'madeira', label: 'Baú de Madeira', icon: '📦', color: 'from-amber-700 to-amber-900', xpBonus: 5 },
  prata: { tier: 'prata', label: 'Baú de Prata', icon: '🥈', color: 'from-slate-300 to-slate-500', xpBonus: 15 },
  ouro: { tier: 'ouro', label: 'Baú de Ouro', icon: '🥇', color: 'from-amber-400 to-yellow-600', xpBonus: 30 },
  diamante: { tier: 'diamante', label: 'Baú de Diamante', icon: '💎', color: 'from-cyan-300 to-blue-500', xpBonus: 60 },
  alianca: { tier: 'alianca', label: 'Baú da Aliança', icon: '👑', color: 'from-purple-400 via-amber-300 to-purple-600', xpBonus: 120 },
};

/** Determina o tier do baú a partir de estrelas, combo máximo e nível. */
export function determineChestTier(stars: number, maxCombo: number, level: number): ChestTier {
  if (level % 10 === 0 && stars === 3) return 'alianca';
  if (stars === 3 && maxCombo >= 8) return 'diamante';
  if (stars === 3) return 'ouro';
  if (stars === 2) return 'prata';
  return 'madeira';
}

/** Recompensa extra: chance de revelar um fragmento bíblico do tema. */
export function rollsFragment(tier: ChestTier): boolean {
  const chance: Record<ChestTier, number> = {
    madeira: 0.2, prata: 0.4, ouro: 0.7, diamante: 0.9, alianca: 1,
  };
  return Math.random() < chance[tier];
}
