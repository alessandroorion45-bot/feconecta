// =====================================================
// TEMAS IMERSIVOS - SISTEMA COMPLETO
// =====================================================
// Sistema de design tokens completo para experiências visuais únicas
// =====================================================

import { ThemeDesignTokens } from './tokens';
import { applyThemeTokens } from './theme-applier';
import {
  defaultThemeTokens,
  darkRoyalThemeTokens,
  reinoCelestialThemeTokens,
  novaJerusalemThemeTokens,
  tronoGloriaThemeTokens,
  arcaAliancaThemeTokens,
  guerreiroFeThemeTokens,
  monteSiaoThemeTokens,
  jardimEdenThemeTokens,
  diamantePromessaThemeTokens,
  classicoThemeTokens,
  sabedoriaThemeTokens,
  noiteOracaoThemeTokens,
  pentecostesThemeTokens,
} from './theme-definitions';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gradient: string[];
}

export interface ThemeEffects {
  particles?: string;
  glow?: string;
  animation?: string;
  special?: string;
}

export interface Theme {
  key: string;
  name: string;
  description: string;
  colors: ThemeColors;
  effects?: ThemeEffects;
  rarity: 1 | 2 | 3 | 4 | 5;
  tier?: "standard" | "gold" | "platinum";
  cssVars: Record<string, string>; // Variáveis CSS legadas
  designTokens: ThemeDesignTokens; // Design tokens completos
}

// =====================================================
// 1. TEMA PADRÃO
// =====================================================
export const defaultTheme: Theme = {
  key: "default",
  name: "Padrão",
  description: "Tema clássico da plataforma",
  colors: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#a78bfa",
    background: "#ffffff",
    text: "#1f2937",
    gradient: ["#6366f1", "#8b5cf6"],
  },
  rarity: 1,
  cssVars: {
    "--theme-primary": "#6366f1",
    "--theme-secondary": "#8b5cf6",
    "--theme-accent": "#a78bfa",
    "--theme-background": "#ffffff",
    "--theme-text": "#1f2937",
  },
  designTokens: defaultThemeTokens,
};

// =====================================================
// 2. REINO CELESTIAL
// =====================================================
export const reinoCelestialTheme: Theme = {
  key: "reino-celestial",
  name: "Reino Celestial",
  description: "Branco perolado com toques dourados celestiais",
  colors: {
    primary: "#f8f7ff",
    secondary: "#ffd700",
    accent: "#fff9e6",
    background: "#fefefe",
    text: "#2c2c2c",
    gradient: ["#f8f7ff", "#fff9e6", "#ffd700"],
  },
  effects: {
    particles: "stars",
    glow: "soft-gold",
    animation: "gentle-float",
  },
  rarity: 3,
  tier: "standard",
  cssVars: {
    "--theme-primary": "#f8f7ff",
    "--theme-secondary": "#ffd700",
    "--theme-accent": "#fff9e6",
    "--theme-background": "#fefefe",
    "--theme-text": "#2c2c2c",
    "--theme-gradient-start": "#f8f7ff",
    "--theme-gradient-end": "#ffd700",
  },
  designTokens: reinoCelestialThemeTokens,
};

// =====================================================
// 3. NOVA JERUSALÉM
// =====================================================
export const novaJerusalemTheme: Theme = {
  key: "nova-jerusalem",
  name: "Nova Jerusalém",
  description: "Ouro brilhante com cristal translúcido",
  colors: {
    primary: "#ffd700",
    secondary: "#c4b5fd",
    accent: "#fef3c7",
    background: "#fffbeb",
    text: "#1e293b",
    gradient: ["#ffd700", "#fbbf24", "#c4b5fd"],
  },
  effects: {
    particles: "crystals",
    glow: "golden-shine",
    animation: "radiant-pulse",
  },
  rarity: 4,
  tier: "standard",
  cssVars: {
    "--theme-primary": "#ffd700",
    "--theme-secondary": "#c4b5fd",
    "--theme-accent": "#fef3c7",
    "--theme-background": "#fffbeb",
    "--theme-text": "#1e293b",
    "--theme-gradient-start": "#ffd700",
    "--theme-gradient-end": "#c4b5fd",
  },
  designTokens: novaJerusalemThemeTokens,
};

// =====================================================
// 4. TRONO DA GLÓRIA
// =====================================================
export const tronoGloriaTheme: Theme = {
  key: "trono-gloria",
  name: "Trono da Glória",
  description: "Roxo imperial com dourado intenso",
  colors: {
    primary: "#7c3aed",
    secondary: "#fbbf24",
    accent: "#a78bfa",
    background: "#faf5ff",
    text: "#1e1b4b",
    gradient: ["#7c3aed", "#a78bfa", "#fbbf24"],
  },
  effects: {
    particles: "royal-stars",
    glow: "purple-gold",
    animation: "majestic-wave",
  },
  rarity: 4,
  cssVars: {
    "--theme-primary": "#7c3aed",
    "--theme-secondary": "#fbbf24",
    "--theme-accent": "#a78bfa",
    "--theme-background": "#faf5ff",
    "--theme-text": "#1e1b4b",
    "--theme-gradient-start": "#7c3aed",
    "--theme-gradient-end": "#fbbf24",
  },
  designTokens: tronoGloriaThemeTokens,
};

// =====================================================
// 5. ARCA DA ALIANÇA
// =====================================================
export const arcaAliancaTheme: Theme = {
  key: "arca-alianca",
  name: "Arca da Aliança",
  description: "Ouro antigo com madeira nobre",
  colors: {
    primary: "#b45309",
    secondary: "#d97706",
    accent: "#92400e",
    background: "#fef3c7",
    text: "#451a03",
    gradient: ["#d97706", "#b45309", "#92400e"],
  },
  effects: {
    particles: "temple-light",
    glow: "ancient-gold",
    animation: "sacred-shimmer",
  },
  rarity: 3,
  cssVars: {
    "--theme-primary": "#b45309",
    "--theme-secondary": "#d97706",
    "--theme-accent": "#92400e",
    "--theme-background": "#fef3c7",
    "--theme-text": "#451a03",
    "--theme-gradient-start": "#d97706",
    "--theme-gradient-end": "#92400e",
  },
  designTokens: arcaAliancaThemeTokens,
};

// =====================================================
// 6. GUERREIRO DA FÉ
// =====================================================
export const guerreiroFeTheme: Theme = {
  key: "guerreiro-fe",
  name: "Guerreiro da Fé",
  description: "Preto premium com vermelho escuro e ouro metálico",
  colors: {
    primary: "#18181b",
    secondary: "#dc2626",
    accent: "#fbbf24",
    background: "#27272a",
    text: "#fafafa",
    gradient: ["#18181b", "#dc2626", "#fbbf24"],
  },
  effects: {
    particles: "fire-sparks",
    glow: "red-gold",
    animation: "warrior-pulse",
  },
  rarity: 4,
  cssVars: {
    "--theme-primary": "#18181b",
    "--theme-secondary": "#dc2626",
    "--theme-accent": "#fbbf24",
    "--theme-background": "#27272a",
    "--theme-text": "#fafafa",
    "--theme-gradient-start": "#dc2626",
    "--theme-gradient-end": "#fbbf24",
  },
  designTokens: guerreiroFeThemeTokens,
};

// =====================================================
// 7. MONTE SIÃO
// =====================================================
export const monteSiaoTheme: Theme = {
  key: "monte-siao",
  name: "Monte Sião",
  description: "Azul profundo com branco luminoso",
  colors: {
    primary: "#1e3a8a",
    secondary: "#60a5fa",
    accent: "#dbeafe",
    background: "#eff6ff",
    text: "#1e3a8a",
    gradient: ["#1e3a8a", "#3b82f6", "#60a5fa"],
  },
  effects: {
    particles: "clouds",
    glow: "sky-blue",
    animation: "mountain-breeze",
  },
  rarity: 3,
  cssVars: {
    "--theme-primary": "#1e3a8a",
    "--theme-secondary": "#60a5fa",
    "--theme-accent": "#dbeafe",
    "--theme-background": "#eff6ff",
    "--theme-text": "#1e3a8a",
    "--theme-gradient-start": "#1e3a8a",
    "--theme-gradient-end": "#60a5fa",
  },
  designTokens: monteSiaoThemeTokens,
};

// =====================================================
// 8. JARDIM DO ÉDEN
// =====================================================
export const jardimEdenTheme: Theme = {
  key: "jardim-eden",
  name: "Jardim do Éden",
  description: "Verde esmeralda com natureza viva",
  colors: {
    primary: "#059669",
    secondary: "#10b981",
    accent: "#d1fae5",
    background: "#f0fdf4",
    text: "#064e3b",
    gradient: ["#059669", "#10b981", "#6ee7b7"],
  },
  effects: {
    particles: "leaves",
    glow: "nature-green",
    animation: "garden-bloom",
  },
  rarity: 4,
  tier: "gold",
  cssVars: {
    "--theme-primary": "#059669",
    "--theme-secondary": "#10b981",
    "--theme-accent": "#d1fae5",
    "--theme-background": "#f0fdf4",
    "--theme-text": "#064e3b",
    "--theme-gradient-start": "#059669",
    "--theme-gradient-end": "#10b981",
  },
  designTokens: jardimEdenThemeTokens,
};

// =====================================================
// 9. DIAMANTE DA PROMESSA
// =====================================================
export const diamantePromessaTheme: Theme = {
  key: "diamante-promessa",
  name: "Diamante da Promessa",
  description: "Azul cristal com efeitos glassmorphism",
  colors: {
    primary: "#0ea5e9",
    secondary: "#38bdf8",
    accent: "#e0f2fe",
    background: "#f0f9ff",
    text: "#0c4a6e",
    gradient: ["#0ea5e9", "#38bdf8", "#7dd3fc"],
  },
  effects: {
    particles: "diamond-sparkles",
    glow: "crystal-shine",
    animation: "glass-refract",
  },
  rarity: 5,
  tier: "gold",
  cssVars: {
    "--theme-primary": "#0ea5e9",
    "--theme-secondary": "#38bdf8",
    "--theme-accent": "#e0f2fe",
    "--theme-background": "#f0f9ff",
    "--theme-text": "#0c4a6e",
    "--theme-gradient-start": "#0ea5e9",
    "--theme-gradient-end": "#38bdf8",
  },
  designTokens: diamantePromessaThemeTokens,
};

// =====================================================
// 10. DARK ROYAL PREMIUM (MAIS RARO)
// =====================================================
export const darkRoyalTheme: Theme = {
  key: "dark-royal",
  name: "Dark Royal Premium",
  description: "Preto absoluto com roxo neon e dourado brilhante. O tema mais raro.",
  colors: {
    primary: "#000000",
    secondary: "#a855f7",
    accent: "#fbbf24",
    background: "#0a0a0a",
    text: "#fafafa",
    gradient: ["#000000", "#581c87", "#a855f7", "#fbbf24"],
  },
  effects: {
    particles: "neon-stars",
    glow: "purple-gold-neon",
    animation: "royal-pulse",
    special: "aurora-effect",
  },
  rarity: 5,
  tier: "platinum",
  cssVars: {
    "--theme-primary": "#000000",
    "--theme-secondary": "#a855f7",
    "--theme-accent": "#fbbf24",
    "--theme-background": "#0a0a0a",
    "--theme-text": "#fafafa",
    "--theme-gradient-start": "#a855f7",
    "--theme-gradient-end": "#fbbf24",
  },
  designTokens: darkRoyalThemeTokens,
};

// =====================================================
// 11. CLÁSSICO
// =====================================================
export const classicoTheme: Theme = {
  key: "classico",
  name: "Clássico",
  description: "Minimalista, leve e elegante — branco limpo, poucas sombras",
  colors: {
    primary: "#475569",
    secondary: "#94a3b8",
    accent: "#64748b",
    background: "#ffffff",
    text: "#1e293b",
    gradient: ["#475569", "#94a3b8"],
  },
  effects: {
    animation: "subtle-fade",
  },
  rarity: 1,
  cssVars: {
    "--theme-primary": "#475569",
    "--theme-secondary": "#94a3b8",
    "--theme-accent": "#64748b",
    "--theme-background": "#ffffff",
    "--theme-text": "#1e293b",
  },
  designTokens: classicoThemeTokens,
};

// =====================================================
// 12. SABEDORIA
// =====================================================
export const sabedoriaTheme: Theme = {
  key: "sabedoria",
  name: "Sabedoria",
  description: "Azul profundo e cinza claro — elegância e conforto de leitura",
  colors: {
    primary: "#1e40af",
    secondary: "#64748b",
    accent: "#3b82f6",
    background: "#f8fafc",
    text: "#1e293b",
    gradient: ["#1e40af", "#3b82f6", "#64748b"],
  },
  effects: {
    glow: "soft-blue",
    animation: "calm-focus",
  },
  rarity: 3,
  tier: "standard",
  cssVars: {
    "--theme-primary": "#1e40af",
    "--theme-secondary": "#64748b",
    "--theme-accent": "#3b82f6",
    "--theme-background": "#f8fafc",
    "--theme-text": "#1e293b",
    "--theme-gradient-start": "#1e40af",
    "--theme-gradient-end": "#64748b",
  },
  designTokens: sabedoriaThemeTokens,
};

// =====================================================
// 13. NOITE DE ORAÇÃO
// =====================================================
export const noiteOracaoTheme: Theme = {
  key: "noite-oracao",
  name: "Noite de Oração",
  description: "Roxo profundo e azul escuro — glow violeta, atmosfera silenciosa",
  colors: {
    primary: "#7c3aed",
    secondary: "#4c1d95",
    accent: "#a78bfa",
    background: "#0f0a1a",
    text: "#f5f3ff",
    gradient: ["#0f0a1a", "#4c1d95", "#7c3aed", "#a78bfa"],
  },
  effects: {
    particles: "candlelight",
    glow: "violet-glow",
    animation: "silent-breathe",
  },
  rarity: 4,
  tier: "gold",
  cssVars: {
    "--theme-primary": "#7c3aed",
    "--theme-secondary": "#4c1d95",
    "--theme-accent": "#a78bfa",
    "--theme-background": "#0f0a1a",
    "--theme-text": "#f5f3ff",
    "--theme-gradient-start": "#4c1d95",
    "--theme-gradient-end": "#a78bfa",
  },
  designTokens: noiteOracaoThemeTokens,
};

// =====================================================
// 14. PENTECOSTES
// =====================================================
export const pentecostesTheme: Theme = {
  key: "pentecostes",
  name: "Pentecostes",
  description: "Vermelho, laranja e dourado — energia e pequenas partículas de fogo",
  colors: {
    primary: "#dc2626",
    secondary: "#f97316",
    accent: "#fbbf24",
    background: "#fff7ed",
    text: "#7c2d12",
    gradient: ["#dc2626", "#f97316", "#fbbf24"],
  },
  effects: {
    particles: "fire-sparks",
    glow: "flame-gold",
    animation: "pentecost-flicker",
  },
  rarity: 4,
  tier: "gold",
  cssVars: {
    "--theme-primary": "#dc2626",
    "--theme-secondary": "#f97316",
    "--theme-accent": "#fbbf24",
    "--theme-background": "#fff7ed",
    "--theme-text": "#7c2d12",
    "--theme-gradient-start": "#dc2626",
    "--theme-gradient-end": "#fbbf24",
  },
  designTokens: pentecostesThemeTokens,
};

// =====================================================
// MAPA DE TEMAS
// =====================================================
export const themes: Record<string, Theme> = {
  "default": defaultTheme,
  "reino-celestial": reinoCelestialTheme,
  "nova-jerusalem": novaJerusalemTheme,
  "trono-gloria": tronoGloriaTheme,
  "arca-alianca": arcaAliancaTheme,
  "guerreiro-fe": guerreiroFeTheme,
  "monte-siao": monteSiaoTheme,
  "jardim-eden": jardimEdenTheme,
  "diamante-promessa": diamantePromessaTheme,
  "dark-royal": darkRoyalTheme,
  "classico": classicoTheme,
  "sabedoria": sabedoriaTheme,
  "noite-oracao": noiteOracaoTheme,
  "pentecostes": pentecostesTheme,
};

// =====================================================
// UTILITÁRIOS
// =====================================================

export function getTheme(key: string): Theme {
  return themes[key] || defaultTheme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  // Usar o novo sistema de design tokens completo
  applyThemeTokens(theme.designTokens, theme.name);
}

export function getAllThemes(): Theme[] {
  return Object.values(themes);
}

export function getThemesByRarity(rarity: number): Theme[] {
  return Object.values(themes).filter((t) => t.rarity === rarity);
}

export function getThemesByTier(tier: "standard" | "gold" | "platinum"): Theme[] {
  return Object.values(themes).filter((t) => t.tier === tier);
}
