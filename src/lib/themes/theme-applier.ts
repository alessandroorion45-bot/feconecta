// =====================================================
// APLICADOR DE TEMAS - Sistema unificado
// =====================================================
// Aplica os design tokens do tema em TODAS as variáveis
// CSS consumidas pelo Tailwind/shadcn — não só um subconjunto.
// Isso garante que bg-card, text-muted-foreground, border-border,
// bg-destructive, bg-gradient-primary, shadow-divine etc respondam
// ao tema ativo em qualquer componente, sem precisar tocar em cada um.
// =====================================================

import { ThemeDesignTokens } from './tokens';

interface HSL {
  h: number;
  s: number;
  l: number;
}

/** Converte hex, rgb()/rgba() ou o primeiro tom de um linear-gradient para HSL. */
function toHSL(color: string, fallback: HSL = { h: 220, s: 30, l: 50 }): HSL {
  if (!color) return fallback;

  let c = color.trim();

  if (c.startsWith('linear-gradient')) {
    const match = c.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
    if (!match) return fallback;
    c = match[0];
  }

  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
    if (hex.length < 6) return fallback;
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return rgbToHSL(r, g, b);
  }

  const rgbaMatch = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbaMatch) {
    const r = parseFloat(rgbaMatch[1]) / 255;
    const g = parseFloat(rgbaMatch[2]) / 255;
    const b = parseFloat(rgbaMatch[3]) / 255;
    return rgbToHSL(r, g, b);
  }

  return fallback;
}

function rgbToHSL(r: number, g: number, b: number): HSL {
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

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const fmt = (hsl: HSL) => `${hsl.h} ${hsl.s}% ${hsl.l}%`;
const withLightness = (hsl: HSL, l: number): HSL => ({ ...hsl, l: Math.max(0, Math.min(100, l)) });
const isDark = (hsl: HSL) => hsl.l < 45;

/** Aplica os design tokens completos no documento — CSS vars do tema E do shadcn. */
export function applyThemeTokens(tokens: ThemeDesignTokens, themeName: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  root.classList.add('theme-transitioning');
  document.body.classList.add('theme-transitioning');

  const flash = document.createElement('div');
  flash.className = 'theme-flash-overlay';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);

  const set = (name: string, value: string) => root.style.setProperty(name, value);
  const setHSL = (name: string, color: string, fallback?: HSL) => set(name, fmt(toHSL(color, fallback)));

  // ===== Namespace --theme-* (efeitos exclusivos: glow, partículas, glass) =====
  set('--theme-background', tokens.background);
  set('--theme-background-secondary', tokens.backgroundSecondary);
  set('--theme-surface', tokens.surface);
  set('--theme-surface-hover', tokens.surfaceHover);
  set('--theme-overlay', tokens.overlay);
  set('--theme-border', tokens.border);
  set('--theme-border-hover', tokens.borderHover);
  set('--theme-border-focus', tokens.borderFocus);
  set('--theme-text', tokens.text);
  set('--theme-text-secondary', tokens.textSecondary);
  set('--theme-text-muted', tokens.textMuted);
  set('--theme-text-on-primary', tokens.textOnPrimary);
  set('--theme-text-on-accent', tokens.textOnAccent);
  set('--theme-button-primary', tokens.buttonPrimary);
  set('--theme-button-secondary', tokens.buttonSecondary);
  set('--theme-button-hover', tokens.buttonHover);
  set('--theme-input-background', tokens.inputBackground);
  set('--theme-input-border', tokens.inputBorder);
  set('--theme-glow', tokens.glow);
  set('--theme-glow-intensity', tokens.glowIntensity);
  set('--theme-shadow', tokens.shadow);
  set('--theme-shadow-hover', tokens.shadowHover);
  set('--theme-gradient-header', tokens.gradientHeader);
  set('--theme-gradient-sidebar', tokens.gradientSidebar);
  set('--theme-gradient-card', tokens.gradientCard);
  set('--theme-header-background', tokens.headerBackground);
  set('--theme-sidebar-background', tokens.sidebarBackground);
  set('--theme-card-background', tokens.cardBackground);
  set('--theme-modal-background', tokens.modalBackground);
  set('--theme-tooltip-background', tokens.tooltipBackground);
  set('--theme-success', tokens.success);
  set('--theme-warning', tokens.warning);
  set('--theme-error', tokens.error);
  set('--theme-info', tokens.info);
  if (tokens.particleColor) set('--theme-particle-color', tokens.particleColor);
  if (tokens.backdropBlur) set('--theme-backdrop-blur', tokens.backdropBlur);
  if (tokens.glassMorphism) set('--theme-glass', tokens.glassMorphism);

  // ===== Vars do shadcn/Tailwind — TODAS, não só um subconjunto =====
  const primaryHSL = toHSL(tokens.primary);
  const secondaryHSL = toHSL(tokens.secondary);
  const accentHSL = toHSL(tokens.accent);
  const backgroundHSL = toHSL(tokens.background);
  const textHSL = toHSL(tokens.text);
  const dark = isDark(backgroundHSL);

  setHSL('--background', tokens.background);
  setHSL('--foreground', tokens.text);

  setHSL('--primary', tokens.primary);
  setHSL('--primary-foreground', tokens.textOnPrimary);
  set('--primary-glow', fmt(withLightness(primaryHSL, dark ? primaryHSL.l + 15 : primaryHSL.l + 10)));
  set('--primary-light', fmt(withLightness(primaryHSL, dark ? 25 : 92)));

  setHSL('--secondary', tokens.secondary);
  setHSL('--secondary-foreground', tokens.textOnAccent);
  set('--secondary-glow', fmt(withLightness(secondaryHSL, dark ? secondaryHSL.l + 12 : secondaryHSL.l + 8)));

  setHSL('--accent', tokens.accent);
  setHSL('--accent-foreground', tokens.textOnAccent);
  set('--accent-light', fmt(withLightness(accentHSL, dark ? 22 : 94)));

  setHSL('--card', tokens.surface || tokens.cardBackground);
  setHSL('--card-foreground', tokens.text);

  setHSL('--popover', tokens.modalBackground || tokens.surface);
  setHSL('--popover-foreground', tokens.text);

  setHSL('--muted', tokens.backgroundSecondary || tokens.surfaceHover);
  setHSL('--muted-foreground', tokens.textMuted);

  setHSL('--destructive', tokens.error, { h: 0, s: 75, l: 48 });
  set('--destructive-foreground', '0 0% 100%');

  setHSL('--border', tokens.border);
  setHSL('--input', tokens.inputBorder || tokens.border);
  setHSL('--ring', tokens.borderFocus || tokens.primary);

  setHSL('--sidebar-background', tokens.sidebarBackground || tokens.background);
  setHSL('--sidebar-foreground', tokens.text);
  setHSL('--sidebar-primary', tokens.primary);
  setHSL('--sidebar-primary-foreground', tokens.textOnPrimary);
  setHSL('--sidebar-accent', tokens.backgroundSecondary || tokens.surfaceHover);
  setHSL('--sidebar-accent-foreground', tokens.text);
  setHSL('--sidebar-border', tokens.border);
  set('--sidebar-ring', fmt(primaryHSL));

  // ===== Gradientes e sombras (usados como bg-gradient-primary, shadow-divine etc) =====
  set('--gradient-primary', tokens.gradientHeader || `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`);
  set('--gradient-divine', `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent}, ${tokens.secondary})`);
  set('--gradient-hero', `linear-gradient(180deg, ${tokens.background} 0%, ${tokens.backgroundSecondary} 50%, ${tokens.background} 100%)`);
  set('--gradient-celestial', tokens.gradientHeader || `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.accent} 50%, ${tokens.secondary} 100%)`);
  set('--gradient-warm', `linear-gradient(135deg, ${tokens.secondary}, ${tokens.accent})`);
  set('--gradient-card', tokens.gradientCard || `linear-gradient(180deg, ${tokens.surface}, ${tokens.backgroundSecondary})`);

  set('--shadow-soft', tokens.shadow ? `0 2px 10px ${tokens.shadow}` : `0 2px 10px ${fmt(withLightness(textHSL, 12))} / 0.06`);
  set('--shadow-medium', tokens.shadow ? `0 6px 20px ${tokens.shadow}` : `0 6px 20px hsl(${fmt(withLightness(textHSL, 12))} / 0.1)`);
  set('--shadow-glow', `0 0 30px ${tokens.glow || tokens.primary}${dark ? '66' : '33'}`);
  set('--shadow-divine', `0 10px 40px ${tokens.accent}40`);
  set('--shadow-card', tokens.shadowHover ? `0 4px 15px ${tokens.shadowHover}` : `0 4px 15px rgba(0,0,0,0.08)`);
  set('--shadow-button', `0 4px 12px ${tokens.primary}4d`);

  document.body.style.background = tokens.background;

  console.log('🎨 [Theme] Aplicado:', themeName);

  setTimeout(() => {
    root.classList.remove('theme-transitioning');
    document.body.classList.remove('theme-transitioning');
  }, 600);
}
