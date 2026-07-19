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
}

const PARTICLE_CONFIGS = {
  'default': { count: 24, speed: 0.3, drift: 0, shapes: ['circle'] as const, colors: ['#6366f1', '#8b5cf6'] },
  'dark-royal': { count: 42, speed: 0.2, drift: 0, shapes: ['star', 'sparkle'] as const, colors: ['#a855f7', '#fbbf24'] },
  'reino-celestial': { count: 36, speed: 0.25, drift: 0, shapes: ['star', 'sparkle'] as const, colors: ['#ffd700', '#f8f7ff'] },
  'nova-jerusalem': { count: 38, speed: 0.3, drift: 0, shapes: ['sparkle', 'star'] as const, colors: ['#ffd700', '#fbbf24', '#c4b5fd'] },
  'trono-gloria': { count: 36, speed: 0.25, drift: 0, shapes: ['star', 'cross'] as const, colors: ['#7c3aed', '#fbbf24'] },
  'arca-alianca': { count: 30, speed: 0.2, drift: 0, shapes: ['sparkle'] as const, colors: ['#d97706', '#b45309'] },
  'guerreiro-fe': { count: 38, speed: 0.4, drift: 0, shapes: ['cross', 'star'] as const, colors: ['#dc2626', '#fbbf24'] },
  'monte-siao': { count: 30, speed: 0.2, drift: 0, shapes: ['circle'] as const, colors: ['#3b82f6', '#60a5fa'] },
  'jardim-eden': { count: 36, speed: 0.25, drift: 0.15, shapes: ['circle', 'sparkle'] as const, colors: ['#10b981', '#6ee7b7'] },
  'diamante-promessa': { count: 42, speed: 0.3, drift: 0, shapes: ['sparkle', 'star'] as const, colors: ['#38bdf8', '#7dd3fc'] },
  // Brasas subindo lentamente — Atos 2
  'pentecostes': { count: 34, speed: 0.25, drift: -0.35, shapes: ['circle', 'sparkle'] as const, colors: ['#f97316', '#fbbf24', '#dc2626'] },
  // Céu estrelado silencioso, quase parado
  'noite-oracao': { count: 40, speed: 0.08, drift: 0, shapes: ['star', 'circle'] as const, colors: ['#a78bfa', '#f5f3ff', '#7c3aed'] },
};

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

    // Configuração do canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Config pela CHAVE do tema (currentTheme é o objeto Theme)
    const config = PARTICLE_CONFIGS[currentTheme?.key as keyof typeof PARTICLE_CONFIGS] || PARTICLE_CONFIGS.default;

    // Criar partículas
    const createParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < config.count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * config.speed,
          vy: (Math.random() - 0.5) * config.speed + (config.drift || 0),
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          shape: config.shapes[Math.floor(Math.random() * config.shapes.length)],
        });
      }
    };
    createParticles();

    // Desenhar forma
    const drawShape = (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;

      switch (particle.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'star':
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * particle.size;
            const y = Math.sin(angle) * particle.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * (particle.size * 0.5);
            const innerY = Math.sin(innerAngle) * (particle.size * 0.5);
            ctx.lineTo(innerX, innerY);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;

        case 'sparkle':
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.fillRect(-particle.size, -particle.size / 4, particle.size * 2, particle.size / 2);
          ctx.fillRect(-particle.size / 4, -particle.size, particle.size / 2, particle.size * 2);
          ctx.restore();
          break;

        case 'cross':
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.fillRect(-particle.size, -particle.size / 3, particle.size * 2, particle.size * 2 / 3);
          ctx.fillRect(-particle.size / 3, -particle.size, particle.size * 2 / 3, particle.size * 2);
          ctx.restore();
          break;
      }

      ctx.globalAlpha = 1;
    };

    // Animação
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Atualizar posição
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Pulsar opacidade
        particle.opacity += Math.sin(Date.now() * 0.001 + particle.x) * 0.002;
        particle.opacity = Math.max(0.1, Math.min(0.7, particle.opacity));

        // Desenhar
        drawShape(ctx, particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

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
