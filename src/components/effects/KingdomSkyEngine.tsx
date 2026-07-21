// =====================================================
// KINGDOM SKY ENGINE — exclusivo do tema Dark Royal Premium
// =====================================================
// Céu cinematográfico: centenas de estrelas procedurais (nunca
// repetidas), estrelas cadentes raras, poeira cósmica com
// parallax de mouse. Tudo num único canvas + rAF, GPU-friendly.
// Galáxias/nebulosas ficam em KingdomGalaxies.tsx (CSS, mais
// barato que canvas pra blobs grandes e desfocados).
// =====================================================

import { useEffect, useRef } from 'react';

interface Star {
  x: number; // 0-1 relativo ao canvas
  y: number;
  size: number;
  baseAlpha: number;
  color: string;
  twinkleDuration: number; // ms
  twinklePhase: number;
  kind: 'dot' | 'four' | 'six' | 'sparkle';
  depth: number; // 0.2–1, usado no parallax
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1
  length: number;
}

const STAR_COLORS = [
  'rgba(255,255,255,0.95)', // branco pérola
  'rgba(196,181,253,0.95)', // cristal/roxo claro
  'rgba(251,191,36,0.9)',   // dourado
  'rgba(147,197,253,0.9)',  // azul safira
];

const STAR_KINDS: Star['kind'][] = ['dot', 'dot', 'dot', 'four', 'six', 'sparkle'];
const STAR_COUNT_DESKTOP = 170;
const STAR_COUNT_MOBILE = 80;

/** Desenha a geometria da estrela num canvas (usado só na hora de gerar o sprite, uma vez). */
function paintStarShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, kind: Star['kind'], color: string) {
  ctx.fillStyle = color;

  if (kind === 'dot') {
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const points = kind === 'six' ? 6 : 4;
  const outerR = size * 2.6;
  const innerR = size * 0.6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  if (kind === 'sparkle') {
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR * 2.2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const SPRITE_MAX_SIZE = 3.2; // maior tamanho possível de estrela, com folga
const SPRITE_DIM = Math.ceil(SPRITE_MAX_SIZE * 6 * 2); // espaço pra pontas/halo do sparkle

/**
 * Sprites pré-renderizados por (tipo × cor) — gerados UMA vez.
 * Desenhar 170 estrelas por frame vira 170 drawImage() baratos em vez
 * de recalcular geometria/gradientes a cada frame (padrão de starfield
 * em canvas, essencial pra manter 60fps com centenas de estrelas).
 */
function buildStarSprites(): Map<string, HTMLCanvasElement> {
  const sprites = new Map<string, HTMLCanvasElement>();
  for (const kind of ['dot', 'four', 'six', 'sparkle'] as Star['kind'][]) {
    for (const color of STAR_COLORS) {
      const off = document.createElement('canvas');
      off.width = SPRITE_DIM;
      off.height = SPRITE_DIM;
      const octx = off.getContext('2d');
      if (!octx) continue;
      paintStarShape(octx, SPRITE_DIM / 2, SPRITE_DIM / 2, SPRITE_MAX_SIZE, kind, color);
      sprites.set(`${kind}|${color}`, off);
    }
  }
  return sprites;
}

export const KingdomSkyEngine = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const spritesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const shootingRef = useRef<ShootingStar[]>([]);
  const nextShootRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    if (spritesRef.current.size === 0) spritesRef.current = buildStarSprites();
    const sprites = spritesRef.current;

    const isMobile = window.innerWidth < 768;
    // Em telas HiDPI o dpr=2 já quadruplica os pixels a compor; capar em 1.5
    // no engine (sky é decorativo, não precisa de nitidez pixel-perfect) é o
    // ganho de perf mais direto sem cortar estrelas nem qualidade visível.
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

    // Estrelas: cada uma com identidade própria — nunca duas iguais
    const seedStars = () => {
      const count = isMobile ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP;
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const rarity = Math.random();
        stars.push({
          x: Math.random(),
          y: Math.random(),
          size: rarity > 0.96 ? 1.8 + Math.random() * 1.4 : 0.5 + Math.random() * 1.1,
          baseAlpha: 0.25 + Math.random() * 0.65,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          twinkleDuration: [3000, 7000, 12000, 20000][Math.floor(Math.random() * 4)] + Math.random() * 2000,
          twinklePhase: Math.random() * Math.PI * 2,
          kind: rarity > 0.985 ? 'sparkle' : rarity > 0.9 ? STAR_KINDS[Math.floor(Math.random() * STAR_KINDS.length)] : 'dot',
          depth: 0.25 + Math.random() * 0.75,
        });
      }
      starsRef.current = stars;
    };
    seedStars();

    const scheduleNextShootingStar = (now: number) => {
      const delay = (30 + Math.random() * 60) * 1000; // 30–90s
      nextShootRef.current = now + delay;
    };
    scheduleNextShootingStar(performance.now());

    const onVisibility = () => { visibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    if (!isMobile) window.addEventListener('mousemove', onMouseMove);

    let lastTime = performance.now();

    const animate = (now: number) => {
      rafRef.current = requestAnimationFrame(animate);
      if (!visibleRef.current) return;
      const dt = now - lastTime;
      lastTime = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Parallax suave: offset alvo baseado no mouse, interpolado (nunca brusco)
      targetOffsetRef.current = { x: (mouseRef.current.x - 0.5) * 22, y: (mouseRef.current.y - 0.5) * 22 };
      offsetRef.current.x += (targetOffsetRef.current.x - offsetRef.current.x) * 0.03;
      offsetRef.current.y += (targetOffsetRef.current.y - offsetRef.current.y) * 0.03;

      // Estrelas — drawImage de sprite pré-renderizado, sem recalcular
      // geometria/gradiente por estrela por frame (era o gargalo real).
      for (const star of starsRef.current) {
        const twinkle = 0.5 + 0.5 * Math.sin((now / star.twinkleDuration) * Math.PI * 2 + star.twinklePhase);
        const alpha = star.baseAlpha * (0.35 + 0.65 * twinkle);
        const px = star.x * w + offsetRef.current.x * star.depth;
        const py = star.y * h + offsetRef.current.y * star.depth;
        const sprite = sprites.get(`${star.kind}|${star.color}`);
        if (!sprite) continue;
        const s = (star.size / SPRITE_MAX_SIZE) * SPRITE_DIM;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, px - s / 2, py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      // Estrela cadente rara
      if (now >= nextShootRef.current && shootingRef.current.length === 0) {
        const startX = Math.random() * w * 0.6;
        const startY = Math.random() * h * 0.35;
        const angle = (Math.PI / 5) + Math.random() * (Math.PI / 8);
        const speed = 0.55 + Math.random() * 0.25;
        shootingRef.current.push({
          x: startX, y: startY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, length: 90 + Math.random() * 60,
        });
        scheduleNextShootingStar(now);
      }
      shootingRef.current = shootingRef.current.filter((s) => s.life > 0);
      for (const s of shootingRef.current) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt / 900;

        const tailX = s.x - s.vx * s.length;
        const tailY = s.y - s.vy * s.length;
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,236,179,${Math.max(0, s.life)})`);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // ponta brilhante
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = '#fff8dc';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none motion-reduce:hidden"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
};
