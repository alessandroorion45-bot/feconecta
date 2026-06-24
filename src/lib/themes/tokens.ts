// =====================================================
// DESIGN TOKENS - SISTEMA COMPLETO
// =====================================================
// Todos os tokens visuais que um tema pode customizar
// =====================================================

export interface ThemeDesignTokens {
  // ===== CORES BASE =====
  primary: string;
  secondary: string;
  accent: string;

  // ===== BACKGROUNDS =====
  background: string;           // Fundo principal da aplicação
  backgroundSecondary: string;   // Fundo secundário
  surface: string;               // Superfícies (cards, modais)
  surfaceHover: string;          // Hover em superfícies
  overlay: string;               // Overlays (modais, dropdowns)

  // ===== BORDERS =====
  border: string;                // Bordas padrão
  borderHover: string;           // Bordas em hover
  borderFocus: string;           // Bordas em foco

  // ===== TEXT =====
  text: string;                  // Texto principal
  textSecondary: string;         // Texto secundário
  textMuted: string;             // Texto suave/desabilitado
  textOnPrimary: string;         // Texto sobre cor primária
  textOnAccent: string;          // Texto sobre cor de acento

  // ===== ELEMENTOS INTERATIVOS =====
  buttonPrimary: string;         // Botão primário
  buttonSecondary: string;       // Botão secundário
  buttonHover: string;           // Hover em botões
  inputBackground: string;       // Background de inputs
  inputBorder: string;           // Borda de inputs

  // ===== EFEITOS =====
  glow: string;                  // Cor do glow
  glowIntensity: string;         // Intensidade do glow
  shadow: string;                // Sombras
  shadowHover: string;           // Sombras em hover

  // ===== GRADIENTES =====
  gradient: string[];            // Array de cores para gradiente
  gradientHeader: string;        // Gradiente do header
  gradientSidebar: string;       // Gradiente da sidebar
  gradientCard: string;          // Gradiente de cards premium

  // ===== COMPONENTES ESPECÍFICOS =====
  headerBackground: string;      // Background do header
  sidebarBackground: string;     // Background da sidebar
  cardBackground: string;        // Background de cards
  modalBackground: string;       // Background de modais
  tooltipBackground: string;     // Background de tooltips

  // ===== ESTADOS =====
  success: string;               // Verde de sucesso
  warning: string;               // Amarelo de aviso
  error: string;                 // Vermelho de erro
  info: string;                  // Azul de info

  // ===== ESPECIAIS =====
  particleColor?: string;        // Cor das partículas
  backdropBlur?: string;         // Blur do backdrop
  glassMorphism?: string;        // Efeito glass
}

// =====================================================
// HELPER PARA CRIAR TOKENS COMPLETOS
// =====================================================
export function createDesignTokens(base: Partial<ThemeDesignTokens>): ThemeDesignTokens {
  // Valores padrão baseados nas cores primárias
  const primary = base.primary || '#6366f1';
  const secondary = base.secondary || '#8b5cf6';
  const accent = base.accent || '#a78bfa';
  const background = base.background || '#ffffff';
  const text = base.text || '#1f2937';

  return {
    // Cores base
    primary,
    secondary,
    accent,

    // Backgrounds
    background,
    backgroundSecondary: base.backgroundSecondary || adjustBrightness(background, -5),
    surface: base.surface || '#ffffff',
    surfaceHover: base.surfaceHover || adjustBrightness(background, -10),
    overlay: base.overlay || 'rgba(0, 0, 0, 0.5)',

    // Borders
    border: base.border || adjustOpacity(text, 0.1),
    borderHover: base.borderHover || adjustOpacity(primary, 0.5),
    borderFocus: base.borderFocus || primary,

    // Text
    text,
    textSecondary: base.textSecondary || adjustOpacity(text, 0.7),
    textMuted: base.textMuted || adjustOpacity(text, 0.5),
    textOnPrimary: base.textOnPrimary || '#ffffff',
    textOnAccent: base.textOnAccent || '#ffffff',

    // Elementos interativos
    buttonPrimary: base.buttonPrimary || primary,
    buttonSecondary: base.buttonSecondary || secondary,
    buttonHover: base.buttonHover || adjustBrightness(primary, -10),
    inputBackground: base.inputBackground || background,
    inputBorder: base.inputBorder || adjustOpacity(text, 0.2),

    // Efeitos
    glow: base.glow || primary,
    glowIntensity: base.glowIntensity || '0.5',
    shadow: base.shadow || 'rgba(0, 0, 0, 0.1)',
    shadowHover: base.shadowHover || 'rgba(0, 0, 0, 0.2)',

    // Gradientes
    gradient: base.gradient || [primary, secondary],
    gradientHeader: base.gradientHeader || `linear-gradient(135deg, ${primary}, ${secondary})`,
    gradientSidebar: base.gradientSidebar || `linear-gradient(180deg, ${primary}, ${secondary})`,
    gradientCard: base.gradientCard || `linear-gradient(135deg, ${primary}, ${accent})`,

    // Componentes específicos
    headerBackground: base.headerBackground || background,
    sidebarBackground: base.sidebarBackground || background,
    cardBackground: base.cardBackground || '#ffffff',
    modalBackground: base.modalBackground || '#ffffff',
    tooltipBackground: base.tooltipBackground || text,

    // Estados
    success: base.success || '#10b981',
    warning: base.warning || '#f59e0b',
    error: base.error || '#ef4444',
    info: base.info || '#3b82f6',

    // Especiais
    particleColor: base.particleColor,
    backdropBlur: base.backdropBlur || '10px',
    glassMorphism: base.glassMorphism || 'rgba(255, 255, 255, 0.1)',
  };
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

function adjustOpacity(hex: string, opacity: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16);
  const g = (num >> 8 & 0x00FF);
  const b = (num & 0x0000FF);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
