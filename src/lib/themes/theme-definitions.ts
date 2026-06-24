// =====================================================
// TEMAS IMERSIVOS - DEFINIÇÕES COMPLETAS
// =====================================================
// Cada tema cria uma experiência visual única e imersiva
// =====================================================

import { ThemeDesignTokens } from './tokens';

// =====================================================
// 1. TEMA PADRÃO
// =====================================================
export const defaultThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#a78bfa',

  // Backgrounds
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  surface: '#ffffff',
  surfaceHover: '#f3f4f6',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Borders
  border: 'rgba(229, 231, 235, 1)',
  borderHover: 'rgba(99, 102, 241, 0.5)',
  borderFocus: '#6366f1',

  // Text
  text: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textOnPrimary: '#ffffff',
  textOnAccent: '#ffffff',

  // Elementos interativos
  buttonPrimary: '#6366f1',
  buttonSecondary: '#8b5cf6',
  buttonHover: '#4f46e5',
  inputBackground: '#ffffff',
  inputBorder: '#d1d5db',

  // Efeitos
  glow: '#6366f1',
  glowIntensity: '0.3',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowHover: 'rgba(0, 0, 0, 0.15)',

  // Gradientes
  gradient: ['#6366f1', '#8b5cf6'],
  gradientHeader: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  gradientSidebar: 'linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)',
  gradientCard: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',

  // Componentes específicos
  headerBackground: '#ffffff',
  sidebarBackground: '#f9fafb',
  cardBackground: '#ffffff',
  modalBackground: '#ffffff',
  tooltipBackground: '#1f2937',

  // Estados
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Especiais
  particleColor: '#6366f1',
  backdropBlur: '10px',
  glassMorphism: 'rgba(255, 255, 255, 0.1)',
};

// =====================================================
// 2. DARK ROYAL PREMIUM - Luxo absoluto
// =====================================================
export const darkRoyalThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#a855f7',
  secondary: '#c084fc',
  accent: '#fbbf24',

  // Backgrounds - Preto profundo com gradientes misteriosos
  background: '#000000',
  backgroundSecondary: '#0a0a0a',
  surface: 'rgba(10, 10, 10, 0.8)',
  surfaceHover: 'rgba(20, 20, 20, 0.9)',
  overlay: 'rgba(0, 0, 0, 0.9)',

  // Borders - Neon roxo
  border: 'rgba(168, 85, 247, 0.2)',
  borderHover: 'rgba(168, 85, 247, 0.6)',
  borderFocus: '#a855f7',

  // Text - Branco brilhante
  text: '#fafafa',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textOnPrimary: '#000000',
  textOnAccent: '#000000',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #a855f7 0%, #581c87 100%)',
  buttonSecondary: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  buttonHover: '#c084fc',
  inputBackground: 'rgba(10, 10, 10, 0.5)',
  inputBorder: 'rgba(168, 85, 247, 0.3)',

  // Efeitos - Glow roxo neon
  glow: '#a855f7',
  glowIntensity: '0.8',
  shadow: 'rgba(168, 85, 247, 0.3)',
  shadowHover: 'rgba(168, 85, 247, 0.5)',

  // Gradientes - Preto → Roxo → Dourado
  gradient: ['#000000', '#581c87', '#a855f7', '#fbbf24'],
  gradientHeader: 'linear-gradient(135deg, #000000 0%, #581c87 50%, #a855f7 100%)',
  gradientSidebar: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',

  // Componentes específicos - Glass escuro
  headerBackground: 'rgba(0, 0, 0, 0.8)',
  sidebarBackground: 'rgba(0, 0, 0, 0.9)',
  cardBackground: 'rgba(10, 10, 10, 0.6)',
  modalBackground: 'rgba(10, 10, 10, 0.95)',
  tooltipBackground: '#1f2937',

  // Estados
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#a855f7',

  // Especiais
  particleColor: '#a855f7',
  backdropBlur: '20px',
  glassMorphism: 'rgba(168, 85, 247, 0.1)',
};

// =====================================================
// 3. REINO CELESTIAL - Céu divino
// =====================================================
export const reinoCelestialThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#ffd700',
  secondary: '#f8f7ff',
  accent: '#fff9e6',

  // Backgrounds - Branco celestial
  background: 'linear-gradient(180deg, #fefefe 0%, #f8f7ff 100%)',
  backgroundSecondary: '#f8f7ff',
  surface: 'rgba(255, 255, 255, 0.9)',
  surfaceHover: 'rgba(248, 247, 255, 0.95)',
  overlay: 'rgba(255, 255, 255, 0.9)',

  // Borders - Dourado suave
  border: 'rgba(255, 215, 0, 0.2)',
  borderHover: 'rgba(255, 215, 0, 0.5)',
  borderFocus: '#ffd700',

  // Text
  text: '#2c2c2c',
  textSecondary: '#4a4a4a',
  textMuted: '#6b7280',
  textOnPrimary: '#2c2c2c',
  textOnAccent: '#2c2c2c',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #ffd700 0%, #f8f7ff 100%)',
  buttonSecondary: '#fff9e6',
  buttonHover: '#ffd700',
  inputBackground: 'rgba(255, 255, 255, 0.8)',
  inputBorder: 'rgba(255, 215, 0, 0.3)',

  // Efeitos - Glow dourado suave
  glow: '#ffd700',
  glowIntensity: '0.4',
  shadow: 'rgba(255, 215, 0, 0.15)',
  shadowHover: 'rgba(255, 215, 0, 0.25)',

  // Gradientes
  gradient: ['#f8f7ff', '#fff9e6', '#ffd700'],
  gradientHeader: 'linear-gradient(135deg, #fefefe 0%, #f8f7ff 50%, #fff9e6 100%)',
  gradientSidebar: 'linear-gradient(180deg, #f8f7ff 0%, #fefefe 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(248, 247, 255, 0.5) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(254, 254, 254, 0.95)',
  sidebarBackground: '#f8f7ff',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  modalBackground: '#ffffff',
  tooltipBackground: '#ffd700',

  // Estados
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#3b82f6',

  // Especiais
  particleColor: '#ffd700',
  backdropBlur: '15px',
  glassMorphism: 'rgba(255, 255, 255, 0.3)',
};

// =====================================================
// 4. NOVA JERUSALÉM - Cidade dourada
// =====================================================
export const novaJerusalemThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#ffd700',
  secondary: '#fbbf24',
  accent: '#c4b5fd',

  // Backgrounds - Dourado cristalino
  background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
  backgroundSecondary: '#fef3c7',
  surface: 'rgba(255, 251, 235, 0.9)',
  surfaceHover: 'rgba(254, 243, 199, 0.95)',
  overlay: 'rgba(255, 215, 0, 0.3)',

  // Borders - Cristal dourado
  border: 'rgba(255, 215, 0, 0.3)',
  borderHover: 'rgba(255, 215, 0, 0.6)',
  borderFocus: '#ffd700',

  // Text
  text: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textOnPrimary: '#1e293b',
  textOnAccent: '#ffffff',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #ffd700 0%, #fbbf24 100%)',
  buttonSecondary: '#c4b5fd',
  buttonHover: '#fbbf24',
  inputBackground: 'rgba(255, 255, 255, 0.7)',
  inputBorder: 'rgba(255, 215, 0, 0.4)',

  // Efeitos - Brilho cristalino
  glow: '#ffd700',
  glowIntensity: '0.6',
  shadow: 'rgba(255, 215, 0, 0.2)',
  shadowHover: 'rgba(255, 215, 0, 0.4)',

  // Gradientes
  gradient: ['#ffd700', '#fbbf24', '#c4b5fd'],
  gradientHeader: 'linear-gradient(135deg, #ffd700 0%, #fbbf24 50%, #c4b5fd 100%)',
  gradientSidebar: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(196, 181, 253, 0.2) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(255, 251, 235, 0.95)',
  sidebarBackground: '#fef3c7',
  cardBackground: 'rgba(255, 255, 255, 0.7)',
  modalBackground: '#fffbeb',
  tooltipBackground: '#ffd700',

  // Estados
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#c4b5fd',

  // Especiais
  particleColor: '#ffd700',
  backdropBlur: '12px',
  glassMorphism: 'rgba(255, 215, 0, 0.15)',
};

// =====================================================
// 5. TRONO DA GLÓRIA - Realeza imperial
// =====================================================
export const tronoGloriaThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#7c3aed',
  secondary: '#a78bfa',
  accent: '#fbbf24',

  // Backgrounds - Roxo imperial
  background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)',
  backgroundSecondary: '#f3e8ff',
  surface: 'rgba(250, 245, 255, 0.9)',
  surfaceHover: 'rgba(243, 232, 255, 0.95)',
  overlay: 'rgba(124, 58, 237, 0.2)',

  // Borders - Dourado real
  border: 'rgba(124, 58, 237, 0.2)',
  borderHover: 'rgba(251, 191, 36, 0.6)',
  borderFocus: '#fbbf24',

  // Text
  text: '#1e1b4b',
  textSecondary: '#3730a3',
  textMuted: '#6366f1',
  textOnPrimary: '#ffffff',
  textOnAccent: '#1e1b4b',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  buttonSecondary: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  buttonHover: '#6d28d9',
  inputBackground: 'rgba(255, 255, 255, 0.8)',
  inputBorder: 'rgba(124, 58, 237, 0.3)',

  // Efeitos - Glow roxo-dourado
  glow: '#7c3aed',
  glowIntensity: '0.5',
  shadow: 'rgba(124, 58, 237, 0.2)',
  shadowHover: 'rgba(124, 58, 237, 0.4)',

  // Gradientes
  gradient: ['#7c3aed', '#a78bfa', '#fbbf24'],
  gradientHeader: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #fbbf24 100%)',
  gradientSidebar: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(250, 245, 255, 0.95)',
  sidebarBackground: '#f3e8ff',
  cardBackground: 'rgba(255, 255, 255, 0.7)',
  modalBackground: '#faf5ff',
  tooltipBackground: '#7c3aed',

  // Estados
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#7c3aed',

  // Especiais
  particleColor: '#7c3aed',
  backdropBlur: '15px',
  glassMorphism: 'rgba(124, 58, 237, 0.1)',
};

// =====================================================
// 6. ARCA DA ALIANÇA - Templo sagrado
// =====================================================
export const arcaAliancaThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#b45309',
  secondary: '#d97706',
  accent: '#92400e',

  // Backgrounds - Madeira nobre com ouro antigo
  background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
  backgroundSecondary: '#fde68a',
  surface: 'rgba(254, 243, 199, 0.9)',
  surfaceHover: 'rgba(253, 230, 138, 0.95)',
  overlay: 'rgba(180, 83, 9, 0.3)',

  // Borders - Ouro antigo
  border: 'rgba(180, 83, 9, 0.3)',
  borderHover: 'rgba(217, 119, 6, 0.6)',
  borderFocus: '#d97706',

  // Text
  text: '#451a03',
  textSecondary: '#78350f',
  textMuted: '#92400e',
  textOnPrimary: '#ffffff',
  textOnAccent: '#ffffff',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
  buttonSecondary: '#92400e',
  buttonHover: '#c2410c',
  inputBackground: 'rgba(255, 255, 255, 0.6)',
  inputBorder: 'rgba(180, 83, 9, 0.4)',

  // Efeitos - Glow dourado antigo
  glow: '#d97706',
  glowIntensity: '0.5',
  shadow: 'rgba(180, 83, 9, 0.3)',
  shadowHover: 'rgba(180, 83, 9, 0.5)',

  // Gradientes
  gradient: ['#d97706', '#b45309', '#92400e'],
  gradientHeader: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)',
  gradientSidebar: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(146, 64, 14, 0.1) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(254, 243, 199, 0.95)',
  sidebarBackground: '#fde68a',
  cardBackground: 'rgba(255, 255, 255, 0.6)',
  modalBackground: '#fef3c7',
  tooltipBackground: '#92400e',

  // Estados
  success: '#10b981',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#d97706',

  // Especiais
  particleColor: '#d97706',
  backdropBlur: '12px',
  glassMorphism: 'rgba(217, 119, 6, 0.1)',
};

// =====================================================
// 7. GUERREIRO DA FÉ - Força e determinação
// =====================================================
export const guerreiroFeThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#dc2626',
  secondary: '#18181b',
  accent: '#fbbf24',

  // Backgrounds - Preto com vermelho
  background: '#18181b',
  backgroundSecondary: '#27272a',
  surface: 'rgba(39, 39, 42, 0.9)',
  surfaceHover: 'rgba(63, 63, 70, 0.95)',
  overlay: 'rgba(24, 24, 27, 0.9)',

  // Borders - Vermelho de guerra
  border: 'rgba(220, 38, 38, 0.3)',
  borderHover: 'rgba(220, 38, 38, 0.6)',
  borderFocus: '#dc2626',

  // Text
  text: '#fafafa',
  textSecondary: '#e5e5e5',
  textMuted: '#a1a1aa',
  textOnPrimary: '#ffffff',
  textOnAccent: '#18181b',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
  buttonSecondary: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  buttonHover: '#b91c1c',
  inputBackground: 'rgba(39, 39, 42, 0.7)',
  inputBorder: 'rgba(220, 38, 38, 0.4)',

  // Efeitos - Glow vermelho-dourado
  glow: '#dc2626',
  glowIntensity: '0.6',
  shadow: 'rgba(220, 38, 38, 0.3)',
  shadowHover: 'rgba(220, 38, 38, 0.5)',

  // Gradientes
  gradient: ['#18181b', '#dc2626', '#fbbf24'],
  gradientHeader: 'linear-gradient(135deg, #18181b 0%, #dc2626 50%, #fbbf24 100%)',
  gradientSidebar: 'linear-gradient(180deg, #18181b 0%, #27272a 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(24, 24, 27, 0.95)',
  sidebarBackground: '#27272a',
  cardBackground: 'rgba(39, 39, 42, 0.7)',
  modalBackground: '#18181b',
  tooltipBackground: '#dc2626',

  // Estados
  success: '#10b981',
  warning: '#fbbf24',
  error: '#dc2626',
  info: '#3b82f6',

  // Especiais
  particleColor: '#dc2626',
  backdropBlur: '15px',
  glassMorphism: 'rgba(220, 38, 38, 0.1)',
};

// =====================================================
// 8. MONTE SIÃO - Montanhas celestiais
// =====================================================
export const monteSiaoThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#1e3a8a',
  secondary: '#3b82f6',
  accent: '#60a5fa',

  // Backgrounds - Azul profundo
  background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
  backgroundSecondary: '#dbeafe',
  surface: 'rgba(239, 246, 255, 0.9)',
  surfaceHover: 'rgba(219, 234, 254, 0.95)',
  overlay: 'rgba(30, 58, 138, 0.2)',

  // Borders - Azul céu
  border: 'rgba(30, 58, 138, 0.2)',
  borderHover: 'rgba(59, 130, 246, 0.5)',
  borderFocus: '#3b82f6',

  // Text
  text: '#1e3a8a',
  textSecondary: '#1e40af',
  textMuted: '#3b82f6',
  textOnPrimary: '#ffffff',
  textOnAccent: '#ffffff',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  buttonSecondary: '#60a5fa',
  buttonHover: '#1e40af',
  inputBackground: 'rgba(255, 255, 255, 0.8)',
  inputBorder: 'rgba(30, 58, 138, 0.3)',

  // Efeitos - Glow azul céu
  glow: '#3b82f6',
  glowIntensity: '0.4',
  shadow: 'rgba(30, 58, 138, 0.15)',
  shadowHover: 'rgba(30, 58, 138, 0.3)',

  // Gradientes
  gradient: ['#1e3a8a', '#3b82f6', '#60a5fa'],
  gradientHeader: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
  gradientSidebar: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(239, 246, 255, 0.95)',
  sidebarBackground: '#dbeafe',
  cardBackground: 'rgba(255, 255, 255, 0.7)',
  modalBackground: '#eff6ff',
  tooltipBackground: '#1e3a8a',

  // Estados
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Especiais
  particleColor: '#3b82f6',
  backdropBlur: '12px',
  glassMorphism: 'rgba(59, 130, 246, 0.1)',
};

// =====================================================
// 9. JARDIM DO ÉDEN - Natureza viva
// =====================================================
export const jardimEdenThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#059669',
  secondary: '#10b981',
  accent: '#6ee7b7',

  // Backgrounds - Verde esmeralda
  background: 'linear-gradient(180deg, #f0fdf4 0%, #d1fae5 100%)',
  backgroundSecondary: '#d1fae5',
  surface: 'rgba(240, 253, 244, 0.9)',
  surfaceHover: 'rgba(209, 250, 229, 0.95)',
  overlay: 'rgba(5, 150, 105, 0.2)',

  // Borders - Verde natureza
  border: 'rgba(5, 150, 105, 0.2)',
  borderHover: 'rgba(16, 185, 129, 0.5)',
  borderFocus: '#10b981',

  // Text
  text: '#064e3b',
  textSecondary: '#065f46',
  textMuted: '#059669',
  textOnPrimary: '#ffffff',
  textOnAccent: '#064e3b',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  buttonSecondary: '#6ee7b7',
  buttonHover: '#047857',
  inputBackground: 'rgba(255, 255, 255, 0.7)',
  inputBorder: 'rgba(5, 150, 105, 0.3)',

  // Efeitos - Glow verde natureza
  glow: '#10b981',
  glowIntensity: '0.4',
  shadow: 'rgba(5, 150, 105, 0.15)',
  shadowHover: 'rgba(5, 150, 105, 0.3)',

  // Gradientes
  gradient: ['#059669', '#10b981', '#6ee7b7'],
  gradientHeader: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #6ee7b7 100%)',
  gradientSidebar: 'linear-gradient(180deg, #f0fdf4 0%, #d1fae5 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(110, 231, 183, 0.1) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(240, 253, 244, 0.95)',
  sidebarBackground: '#d1fae5',
  cardBackground: 'rgba(255, 255, 255, 0.7)',
  modalBackground: '#f0fdf4',
  tooltipBackground: '#064e3b',

  // Estados
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Especiais
  particleColor: '#10b981',
  backdropBlur: '12px',
  glassMorphism: 'rgba(16, 185, 129, 0.1)',
};

// =====================================================
// 10. DIAMANTE DA PROMESSA - Cristal premium
// =====================================================
export const diamantePromessaThemeTokens: ThemeDesignTokens = {
  // Cores base
  primary: '#0ea5e9',
  secondary: '#38bdf8',
  accent: '#7dd3fc',

  // Backgrounds - Azul cristal
  background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
  backgroundSecondary: '#e0f2fe',
  surface: 'rgba(240, 249, 255, 0.8)',
  surfaceHover: 'rgba(224, 242, 254, 0.9)',
  overlay: 'rgba(14, 165, 233, 0.2)',

  // Borders - Cristal azul
  border: 'rgba(14, 165, 233, 0.2)',
  borderHover: 'rgba(56, 189, 248, 0.5)',
  borderFocus: '#38bdf8',

  // Text
  text: '#0c4a6e',
  textSecondary: '#075985',
  textMuted: '#0ea5e9',
  textOnPrimary: '#ffffff',
  textOnAccent: '#0c4a6e',

  // Elementos interativos
  buttonPrimary: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  buttonSecondary: '#7dd3fc',
  buttonHover: '#0284c7',
  inputBackground: 'rgba(255, 255, 255, 0.6)',
  inputBorder: 'rgba(14, 165, 233, 0.3)',

  // Efeitos - Glow cristalino
  glow: '#38bdf8',
  glowIntensity: '0.5',
  shadow: 'rgba(14, 165, 233, 0.2)',
  shadowHover: 'rgba(14, 165, 233, 0.4)',

  // Gradientes
  gradient: ['#0ea5e9', '#38bdf8', '#7dd3fc'],
  gradientHeader: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
  gradientSidebar: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
  gradientCard: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(125, 211, 252, 0.1) 100%)',

  // Componentes específicos
  headerBackground: 'rgba(240, 249, 255, 0.9)',
  sidebarBackground: '#e0f2fe',
  cardBackground: 'rgba(255, 255, 255, 0.5)',
  modalBackground: '#f0f9ff',
  tooltipBackground: '#0c4a6e',

  // Estados
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#0ea5e9',

  // Especiais
  particleColor: '#38bdf8',
  backdropBlur: '20px',
  glassMorphism: 'rgba(14, 165, 233, 0.15)',
};
