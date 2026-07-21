// =====================================================
// PARTÍCULAS TEMÁTICAS - Canvas Animation
// =====================================================
// Partículas animadas que mudam baseado no tema ativo
// =====================================================

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  shape: 'circle' | 'star' | 'sparkle' | 'cross';
  swayPhase: number;
  flickerPhase: number;
}

interface ParticleThemeConfig {
  count: number;
  speed: number;
  /** viés vertical: negativo = sobe (brasa), positivo = desce (poeira caindo) */
  drift: number;
  shapes: readonly Particle['shape'][];
  colors: string[];
  /** balanço horizontal (folha caindo, vela tremendo) — px de amplitude */
  sway?: number;
  /** intensidade extra de variação de opacidade (chama/vela tremendo) */
  flicker?: number;
}

// Cada tema tem sua própria "assinatura" de movimento — não é só cor/forma
// trocada, é o COMPORTAMENTO da partícula batendo com a identidade do tema
// (folha balança, chama treme, cristal cintila parado, poeira de sabedoria
// quase não se move). Isso é o que estava faltando pra "cada tema ter uma
// particularidade" — cor sozinha não carrega a leitura emocional.
// Contagens calibradas por medição real de FPS (mesmo método usado no
// Kingdom Cosmos Royal): esse canvas agora roda em praticamente todo tema
// pago do site inteiro, não só numa página — por isso as contagens ficam
// deliberadamente mais conservadoras que as do Kingdom Sky Engine.
const PARTICLE_CONFIGS: Record<string, ParticleThemeConfig> = {
  'default': { count: 18, speed: 0.3, drift: 0, shapes: ['circle'], colors: ['#6366f1', '#8b5cf6'] },
  'classico': { count: 8, speed: 0.12, drift: 0.04, shapes: ['circle'], colors: ['#94a3b8', '#cbd5e1'] },
  'dark-royal': { count: 30, speed: 0.2, drift: 0, shapes: ['star', 'sparkle'], colors: ['#a855f7', '#fbbf24'] },
  // Estrelas celestiais suaves, cintilando devagar
  'reino-celestial': { count: 26, speed: 0.15, drift: 0.02, shapes: ['star', 'sparkle'], colors: ['#ffd700', '#f8f7ff'], flicker: 1.6 },
  // Cristal — quase parado, só cintila (glint), pouquíssimo deslocamento
  'nova-jerusalem': { count: 24, speed: 0.06, drift: 0, shapes: ['sparkle', 'star'], colors: ['#ffd700', '#fbbf24', '#c4b5fd'], flicker: 2 },
  // Estrelas reais, deriva majestosa e lenta
  'trono-gloria': { count: 24, speed: 0.14, drift: -0.03, shapes: ['star', 'cross'], colors: ['#7c3aed', '#fbbf24'] },
  // Poeira dourada flutuando em raio de luz do templo
  'arca-alianca': { count: 20, speed: 0.12, drift: 0.06, shapes: ['sparkle'], colors: ['#d97706', '#b45309'], sway: 10 },
  // Fagulhas de fogo subindo e tremendo
  'guerreiro-fe': { count: 24, speed: 0.35, drift: -0.4, shapes: ['cross', 'star'], colors: ['#dc2626', '#fbbf24'], flicker: 1.8, sway: 6 },
  // Nuvens — grandes, lentas, quase só circulam
  'monte-siao': { count: 16, speed: 0.1, drift: 0, shapes: ['circle'], colors: ['#3b82f6', '#60a5fa'], sway: 14 },
  // Folhas caindo, balançando de lado a lado
  'jardim-eden': { count: 24, speed: 0.22, drift: 0.28, shapes: ['circle', 'sparkle'], colors: ['#10b981', '#6ee7b7'], sway: 18 },
  // Cintilação de diamante — flashes rápidos, quase parado
  'diamante-promessa': { count: 26, speed: 0.08, drift: 0, shapes: ['sparkle', 'star'], colors: ['#38bdf8', '#7dd3fc'], flicker: 2.4 },
  // Brasas subindo lentamente, tremeluzindo — Atos 2
  'pentecostes': { count: 24, speed: 0.25, drift: -0.35, shapes: ['circle', 'sparkle'], colors: ['#f97316', '#fbbf24', '#dc2626'], flicker: 1.6 },
  // Vela tremendo — quase parada, só o brilho pulsa como chama
  'noite-oracao': { count: 20, speed: 0.06, drift: -0.02, shapes: ['star', 'circle'], colors: ['#a78bfa', '#f5f3ff', '#7c3aed'], flicker: 1.4 },
  // Poeira calma flutuando — leitura tranquila, quase imóvel
  'sabedoria': { count: 14, speed: 0.08, drift: 0.03, shapes: ['circle'], colors: ['#1e40af', '#3b82f6', '#94a3b8'] },
};

const SHAPES: Particle['shape'][] = ['circle', 'star', 'sparkle', 'cross'];
const SPRITE_DIM = 26;

/** Sprites por (forma × cor), pré-renderizados uma vez — drawImage() é bem
 * mais barato que recalcular geometria/save-restore por partícula a cada
 * frame (mesma lição de performance do Kingdom Sky Engine). */
function buildParticleSprites(colors: string[]): Map<string, HTMLCanvasElement> {
  const sprites = new Map<string, HTMLCanvasElement>();
  const cx = SPRITE_DIM / 2;
  const cy = SPRITE_DIM / 2;
  const size = 4; // maior tamanho de partícula possível, com folga no sprite

  for (const shape of SHAPES) {
    for (const color of colors) {
      const off = document.createElement('canvas');
      off.width = SPRITE_DIM;
      off.height = SPRITE_DIM;
      const ctx = off.getContext('2d');
      if (!ctx) continue;
      ctx.fillStyle = color;

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'star') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          const innerAngle = angle + Math.PI / 5;
          ctx.lineTo(Math.cos(innerAngle) * (size * 0.5), Math.sin(innerAngle) * (size * 0.5));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (shape === 'sparkle') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillRect(-size, -size / 4, size * 2, size / 2);
        ctx.fillRect(-size / 4, -size, size / 2, size * 2);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillRect(-size, -size / 3, size * 2, (size * 2) / 3);
        ctx.fillRect(-size / 3, -size, (size * 2) / 3, size * 2);
        ctx.restore();
      }
      sprites.set(`${shape}|${color}`, off);
    }
  }
  return sprites;
}

export const ThemeParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const { currentTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Acessibilidade: com movimento reduzido, sem partículas
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // devicePixelRatio capado — decorativo, não precisa de nitidez pixel-perfect
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Config pela CHAVE do tema (currentTheme é o objeto Theme)
    const config = PARTICLE_CONFIGS[currentTheme?.key as keyof typeof PARTICLE_CONFIGS] || PARTICLE_CONFIGS.default;
    const sprites = buildParticleSprites(config.colors);

    const createParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < config.count; i++) {
        particlesRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * config.speed,
          vy: (Math.random() - 0.5) * config.speed + (config.drift || 0),
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          shape: config.shapes[Math.floor(Math.random() * config.shapes.length)],
          swayPhase: Math.random() * Math.PI * 2,
          flickerPhase: Math.random() * Math.PI * 2,
        });
      }
    };
    createParticles();

    const sway = config.sway || 0;
    const flicker = config.flicker ?? 1;

    // Animação — drawImage de sprite pré-renderizado (sem recalcular
    // geometria/save-restore por partícula a cada frame).
    const animate = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const particle of particlesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = w;
        if (particle.x > w) particle.x = 0;
        if (particle.y < 0) particle.y = h;
        if (particle.y > h) particle.y = 0;

        particle.opacity += Math.sin(now * 0.001 * flicker + particle.flickerPhase) * 0.002 * flicker;
        particle.opacity = Math.max(0.1, Math.min(0.7, particle.opacity));

        const swayX = sway ? Math.sin(now * 0.0006 + particle.swayPhase) * sway : 0;
        const sprite = sprites.get(`${particle.shape}|${particle.color}`);
        if (!sprite) continue;
        const s = particle.size * (SPRITE_DIM / 4);
        ctx.globalAlpha = particle.opacity;
        ctx.drawImage(sprite, particle.x + swayX - s / 2, particle.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};
