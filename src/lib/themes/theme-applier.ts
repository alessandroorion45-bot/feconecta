// =====================================================
// APLICADOR DE TEMAS - Sistema completo
// =====================================================
// Aplica todos os design tokens no documento
// Com transições suaves e efeitos premium
// =====================================================

import { ThemeDesignTokens } from './tokens';

// Converte HEX para HSL (para Tailwind)
function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, '');

  // Se for rgba ou linear-gradient, retornar como está
  if (hex.includes('rgba') || hex.includes('linear-gradient')) {
    return hex;
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  return `${h} ${s}% ${lightness}%`;
}

// Aplica os design tokens completos no documento
export function applyThemeTokens(tokens: ThemeDesignTokens, themeName: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // ===== ADICIONAR CLASSE DE TRANSIÇÃO =====
  root.classList.add('theme-transitioning');

  // ===== APLICAR CORES BASE (HSL para Tailwind) =====
  root.style.setProperty('--primary', hexToHSL(tokens.primary));
  root.style.setProperty('--secondary', hexToHSL(tokens.secondary));
  root.style.setProperty('--accent', hexToHSL(tokens.accent));

  // ===== BACKGROUNDS =====
  root.style.setProperty('--theme-background', tokens.background);
  root.style.setProperty('--theme-background-secondary', tokens.backgroundSecondary);
  root.style.setProperty('--theme-surface', tokens.surface);
  root.style.setProperty('--theme-surface-hover', tokens.surfaceHover);
  root.style.setProperty('--theme-overlay', tokens.overlay);
  root.style.setProperty('--background', hexToHSL(extractSolidColor(tokens.background)));

  // ===== BORDERS =====
  root.style.setProperty('--theme-border', tokens.border);
  root.style.setProperty('--theme-border-hover', tokens.borderHover);
  root.style.setProperty('--theme-border-focus', tokens.borderFocus);

  // ===== TEXT =====
  root.style.setProperty('--theme-text', tokens.text);
  root.style.setProperty('--theme-text-secondary', tokens.textSecondary);
  root.style.setProperty('--theme-text-muted', tokens.textMuted);
  root.style.setProperty('--theme-text-on-primary', tokens.textOnPrimary);
  root.style.setProperty('--theme-text-on-accent', tokens.textOnAccent);
  root.style.setProperty('--foreground', hexToHSL(tokens.text));

  // ===== ELEMENTOS INTERATIVOS =====
  root.style.setProperty('--theme-button-primary', tokens.buttonPrimary);
  root.style.setProperty('--theme-button-secondary', tokens.buttonSecondary);
  root.style.setProperty('--theme-button-hover', tokens.buttonHover);
  root.style.setProperty('--theme-input-background', tokens.inputBackground);
  root.style.setProperty('--theme-input-border', tokens.inputBorder);

  // ===== EFEITOS =====
  root.style.setProperty('--theme-glow', tokens.glow);
  root.style.setProperty('--theme-glow-intensity', tokens.glowIntensity);
  root.style.setProperty('--theme-shadow', tokens.shadow);
  root.style.setProperty('--theme-shadow-hover', tokens.shadowHover);

  // ===== GRADIENTES =====
  root.style.setProperty('--theme-gradient-header', tokens.gradientHeader);
  root.style.setProperty('--theme-gradient-sidebar', tokens.gradientSidebar);
  root.style.setProperty('--theme-gradient-card', tokens.gradientCard);

  // ===== COMPONENTES ESPECÍFICOS =====
  root.style.setProperty('--theme-header-background', tokens.headerBackground);
  root.style.setProperty('--theme-sidebar-background', tokens.sidebarBackground);
  root.style.setProperty('--theme-card-background', tokens.cardBackground);
  root.style.setProperty('--theme-modal-background', tokens.modalBackground);
  root.style.setProperty('--theme-tooltip-background', tokens.tooltipBackground);

  // ===== ESTADOS =====
  root.style.setProperty('--theme-success', tokens.success);
  root.style.setProperty('--theme-warning', tokens.warning);
  root.style.setProperty('--theme-error', tokens.error);
  root.style.setProperty('--theme-info', tokens.info);

  // ===== ESPECIAIS =====
  if (tokens.particleColor) {
    root.style.setProperty('--theme-particle-color', tokens.particleColor);
  }
  if (tokens.backdropBlur) {
    root.style.setProperty('--theme-backdrop-blur', tokens.backdropBlur);
  }
  if (tokens.glassMorphism) {
    root.style.setProperty('--theme-glass', tokens.glassMorphism);
  }

  // ===== APLICAR BACKGROUND NO BODY =====
  document.body.style.background = tokens.background;

  // ===== LOG DE DEBUG =====
  console.log('🎨 [Theme] Aplicado:', themeName, tokens);

  // ===== REMOVER CLASSE DE TRANSIÇÃO APÓS ANIMAÇÃO =====
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 500);
}

// Extrai cor sólida de linear-gradient ou rgba
function extractSolidColor(color: string): string {
  if (color.includes('linear-gradient')) {
    // Extrai primeira cor do gradiente
    const match = color.match(/#[0-9a-fA-F]{6}/);
    return match ? match[0] : '#ffffff';
  }
  if (color.includes('rgba')) {
    // Converte rgba para hex (aproximado)
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  return color;
}
