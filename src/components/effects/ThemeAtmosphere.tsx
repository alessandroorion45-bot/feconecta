// =====================================================
// ATMOSFERA VIVA — camadas de luz por tema
// =====================================================
// Camadas decorativas fixas (orbes de luz difusa, aurora,
// névoa) atrás do conteúdo. 100% CSS/transform/opacity,
// pointer-events none, some com prefers-reduced-motion.
// Cada tema é só configuração — zero mudança estrutural.
// =====================================================

import { memo, useEffect, useState } from 'react';

interface Orb {
  /** posição em % da viewport */
  x: number;
  y: number;
  /** diâmetro em vmax */
  size: number;
  color: string;
  /** duração da respiração em s */
  breathe: number;
}

interface AtmosphereConfig {
  orbs: Orb[];
  /** véu de aurora que atravessa a tela bem devagar */
  aurora?: { colors: string[]; duration: number };
  /** névoa suave subindo do rodapé */
  mist?: { color: string };
  /** opacidade geral da camada */
  opacity: number;
}

const ATMOSPHERES: Record<string, AtmosphereConfig | null> = {
  // limpos de propósito — sem atmosfera
  'default': null,
  'classico': null,

  'reino-celestial': {
    opacity: 0.5,
    orbs: [
      { x: 15, y: 12, size: 42, color: 'rgba(255, 215, 0, 0.16)', breathe: 9 },
      { x: 82, y: 70, size: 36, color: 'rgba(255, 249, 230, 0.35)', breathe: 12 },
    ],
    aurora: { colors: ['rgba(255,215,0,0.10)', 'rgba(248,247,255,0.14)'], duration: 26 },
  },
  'nova-jerusalem': {
    opacity: 0.5,
    orbs: [
      { x: 20, y: 18, size: 40, color: 'rgba(255, 215, 0, 0.18)', breathe: 10 },
      { x: 78, y: 62, size: 34, color: 'rgba(196, 181, 253, 0.20)', breathe: 13 },
    ],
  },
  'trono-gloria': {
    opacity: 0.55,
    orbs: [
      { x: 50, y: 8, size: 48, color: 'rgba(124, 58, 237, 0.16)', breathe: 11 },
      { x: 84, y: 74, size: 30, color: 'rgba(251, 191, 36, 0.16)', breathe: 9 },
    ],
    aurora: { colors: ['rgba(124,58,237,0.10)', 'rgba(251,191,36,0.08)'], duration: 30 },
  },
  'arca-alianca': {
    opacity: 0.45,
    orbs: [
      { x: 30, y: 20, size: 38, color: 'rgba(217, 119, 6, 0.14)', breathe: 12 },
      { x: 74, y: 68, size: 32, color: 'rgba(146, 64, 14, 0.12)', breathe: 15 },
    ],
  },
  'guerreiro-fe': {
    opacity: 0.5,
    orbs: [
      { x: 18, y: 76, size: 36, color: 'rgba(220, 38, 38, 0.14)', breathe: 8 },
      { x: 80, y: 16, size: 30, color: 'rgba(251, 191, 36, 0.12)', breathe: 10 },
    ],
  },
  'monte-siao': {
    opacity: 0.5,
    orbs: [
      { x: 25, y: 10, size: 46, color: 'rgba(96, 165, 250, 0.16)', breathe: 12 },
      { x: 76, y: 66, size: 36, color: 'rgba(219, 234, 254, 0.35)', breathe: 15 },
    ],
    mist: { color: 'rgba(219, 234, 254, 0.35)' },
  },
  'jardim-eden': {
    opacity: 0.5,
    orbs: [
      { x: 16, y: 20, size: 40, color: 'rgba(16, 185, 129, 0.14)', breathe: 11 },
      { x: 82, y: 64, size: 34, color: 'rgba(110, 231, 183, 0.18)', breathe: 14 },
    ],
    mist: { color: 'rgba(209, 250, 229, 0.4)' },
  },
  'diamante-promessa': {
    opacity: 0.55,
    orbs: [
      { x: 22, y: 14, size: 44, color: 'rgba(56, 189, 248, 0.16)', breathe: 10 },
      { x: 78, y: 70, size: 34, color: 'rgba(224, 242, 254, 0.4)', breathe: 12 },
    ],
    aurora: { colors: ['rgba(14,165,233,0.10)', 'rgba(125,211,252,0.12)'], duration: 24 },
  },
  'dark-royal': {
    opacity: 0.65,
    orbs: [
      { x: 20, y: 15, size: 44, color: 'rgba(168, 85, 247, 0.20)', breathe: 9 },
      { x: 80, y: 70, size: 36, color: 'rgba(251, 191, 36, 0.12)', breathe: 12 },
    ],
    aurora: { colors: ['rgba(168,85,247,0.14)', 'rgba(251,191,36,0.08)'], duration: 22 },
  },
  'sabedoria': {
    opacity: 0.4,
    orbs: [
      { x: 24, y: 16, size: 40, color: 'rgba(30, 64, 175, 0.10)', breathe: 14 },
      { x: 78, y: 68, size: 32, color: 'rgba(59, 130, 246, 0.10)', breathe: 16 },
    ],
  },
  'noite-oracao': {
    opacity: 0.65,
    orbs: [
      { x: 70, y: 12, size: 30, color: 'rgba(245, 243, 255, 0.14)', breathe: 13 },
      { x: 20, y: 60, size: 44, color: 'rgba(124, 58, 237, 0.18)', breathe: 10 },
    ],
    aurora: { colors: ['rgba(76,29,149,0.16)', 'rgba(167,139,250,0.10)'], duration: 28 },
    mist: { color: 'rgba(76, 29, 149, 0.22)' },
  },
  'pentecostes': {
    opacity: 0.5,
    orbs: [
      { x: 50, y: 82, size: 42, color: 'rgba(249, 115, 22, 0.14)', breathe: 8 },
      { x: 18, y: 20, size: 30, color: 'rgba(251, 191, 36, 0.12)', breathe: 10 },
    ],
    aurora: { colors: ['rgba(220,38,38,0.08)', 'rgba(251,191,36,0.10)'], duration: 20 },
  },
};

interface ThemeAtmosphereProps {
  themeKey: string;
}

/** Camadas de atmosfera do tema ativo + bloom de entrada (~800ms, uma vez por troca). */
export const ThemeAtmosphere = memo(({ themeKey }: ThemeAtmosphereProps) => {
  const [bloom, setBloom] = useState(false);
  const config = ATMOSPHERES[themeKey] ?? null;

  // Bloom de entrada: uma iluminação suave quando o tema entra, nunca contínua
  useEffect(() => {
    if (!config) return;
    setBloom(true);
    const t = setTimeout(() => setBloom(false), 850);
    return () => clearTimeout(t);
  }, [themeKey, config]);

  if (!config) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none motion-reduce:hidden overflow-hidden"
      style={{ zIndex: 0, opacity: config.opacity }}
      aria-hidden
    >
      {/* Orbes de luz respirando */}
      {config.orbs.map((orb, i) => (
        <div
          key={`${themeKey}-orb-${i}`}
          className="absolute rounded-full atmosphere-breathe"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}vmax`,
            height: `${orb.size}vmax`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            animationDuration: `${orb.breathe}s`,
          }}
        />
      ))}

      {/* Aurora atravessando bem devagar */}
      {config.aurora && (
        <div
          className="absolute -inset-x-1/2 inset-y-0 atmosphere-aurora"
          style={{
            background: `linear-gradient(100deg, transparent 20%, ${config.aurora.colors[0]} 40%, ${config.aurora.colors[1]} 55%, transparent 75%)`,
            animationDuration: `${config.aurora.duration}s`,
          }}
        />
      )}

      {/* Névoa suave no rodapé */}
      {config.mist && (
        <div
          className="absolute inset-x-0 bottom-0 h-[28vh] atmosphere-mist"
          style={{
            background: `linear-gradient(to top, ${config.mist.color}, transparent)`,
          }}
        />
      )}

      {/* Bloom de entrada — só na chegada do tema */}
      {bloom && (
        <div
          className="absolute inset-0 atmosphere-bloom"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${config.orbs[0]?.color || 'rgba(255,255,255,0.15)'} 0%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
});

ThemeAtmosphere.displayName = 'ThemeAtmosphere';
