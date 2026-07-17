// Definições visuais dos cosméticos da Kingdom Store (CSS puro — sem
// assets externos). Compartilhado entre a pré-visualização na loja e a
// aplicação real no perfil. O admin pode adicionar produtos novos com
// essas chaves ou subir image_url própria.

export interface FrameStyle {
  /** background do anel em volta do avatar */
  ring: string;
  glow?: string;
}

export const FRAME_STYLES: Record<string, FrameStyle> = {
  "frame-bronze": { ring: "linear-gradient(135deg, #f0c9a0, #b5651d)", glow: "rgba(181,101,29,0.45)" },
  "frame-prata": { ring: "linear-gradient(135deg, #f5f7fa, #9aa5b1)", glow: "rgba(154,165,177,0.5)" },
  "frame-ouro": { ring: "linear-gradient(135deg, #ffe9a3, #d4930d)", glow: "rgba(212,147,13,0.55)" },
  "frame-cristal": { ring: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(160,220,255,0.7))", glow: "rgba(160,220,255,0.6)" },
  "frame-diamante": { ring: "linear-gradient(135deg, #e8faff, #7dd3fc 45%, #c084fc)", glow: "rgba(125,211,252,0.65)" },
  "frame-vitral": { ring: "conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f87171)", glow: "rgba(167,139,250,0.5)" },
  "frame-luz": { ring: "radial-gradient(circle, #fff8dc, #fcd34d)", glow: "rgba(252,211,77,0.7)" },
};

export const BACKGROUND_STYLES: Record<string, string> = {
  "bg-ceu-estrelado": "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 1px, transparent 1px), radial-gradient(circle at 60% 40%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.14) 1.5px, transparent 1.5px), linear-gradient(180deg, #0f172a, #1e293b)",
  "bg-amanhecer": "linear-gradient(180deg, #fde68a 0%, #fdba74 45%, #f59e0b 100%)",
  "bg-montanhas": "linear-gradient(180deg, #c4b5fd 0%, #818cf8 55%, #4c1d95 100%)",
  "bg-rio": "linear-gradient(180deg, #bae6fd 0%, #7dd3fc 50%, #0369a1 100%)",
  "bg-oliveiras": "linear-gradient(180deg, #d9f99d 0%, #86efac 50%, #15803d 100%)",
  "bg-vitral": "conic-gradient(from 45deg at 50% 30%, rgba(248,113,113,0.55), rgba(251,191,36,0.55), rgba(52,211,153,0.55), rgba(96,165,250,0.55), rgba(167,139,250,0.55), rgba(248,113,113,0.55))",
  "bg-luz-dourada": "radial-gradient(ellipse at 50% 0%, #fff8dc 0%, #fcd34d 40%, #b45309 100%)",
};

export interface EffectStyle {
  emoji: string;
  count: number;
}

export const EFFECT_STYLES: Record<string, EffectStyle> = {
  "fx-particulas-douradas": { emoji: "✨", count: 8 },
  "fx-estrelas": { emoji: "⭐", count: 6 },
  "fx-raios-luz": { emoji: "🌟", count: 5 },
  "fx-brilho": { emoji: "🔆", count: 7 },
};
