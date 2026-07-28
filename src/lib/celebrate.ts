/* =====================================================================
   Kit de Vida — celebrações leves, sem dependências.
   - celebrate(): chuva de confete (canvas) para marcos.
   - floatEmojis(x, y): emojis que sobem e somem num ponto (ex: curtir).
   Respeita prefers-reduced-motion. Auto-limpa (nada fica no DOM).
   ===================================================================== */

const KINGDOM_COLORS = ["#a855f7", "#6366f1", "#38bdf8", "#fbbf24", "#f472b6", "#34d399"];

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  emoji?: string;
  life: number;
}

/** Confete comemorativo (marcos: estudo completo, selo, checklist 100%). */
export function celebrate(opts?: { emojis?: string[]; count?: number }): void {
  if (typeof document === "undefined" || reduceMotion()) return;

  const count = opts?.count ?? 130;
  const emojis = opts?.emojis ?? ["✨", "🎉", "⭐", "🙏", "💛"];

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const parts: Particle[] = [];
  const originX = W / 2;
  const originY = H * 0.28;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * (0.15 + Math.random() * 0.7)) - Math.PI / 2; // leque pra cima
    const speed = 6 + Math.random() * 9;
    const isEmoji = Math.random() < 0.32;
    parts.push({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY,
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1) * 0.6 + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * speed - 2,
      size: isEmoji ? 16 + Math.random() * 12 : 6 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      color: KINGDOM_COLORS[(Math.random() * KINGDOM_COLORS.length) | 0],
      emoji: isEmoji ? emojis[(Math.random() * emojis.length) | 0] : undefined,
      life: 1,
    });
  }

  const gravity = 0.22;
  const drag = 0.992;
  const start = performance.now();
  const DURATION = 2600;

  const tick = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, W, H);

    for (const p of parts) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      if (elapsed > DURATION * 0.55) p.life -= 0.02;

      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.emoji) {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(tick);
}

/** Emojis que sobem e somem a partir de um ponto (ex: ao curtir). */
export function floatEmojis(
  x: number,
  y: number,
  emojis: string[] = ["❤️"],
  count = 8
): void {
  if (typeof document === "undefined" || reduceMotion()) return;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = emojis[(Math.random() * emojis.length) | 0];
    el.style.cssText =
      `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9999;` +
      `font-size:${14 + Math.random() * 14}px;will-change:transform,opacity;`;
    document.body.appendChild(el);

    const dx = (Math.random() - 0.5) * 130;
    const dy = -90 - Math.random() * 130;
    const rot = (Math.random() - 0.5) * 70;

    const anim = el.animate(
      [
        { transform: "translate(-50%,-50%) scale(0.4)", opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.4}px), -40px) scale(1.15)`, opacity: 1, offset: 0.25 },
        { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${rot}deg) scale(0.9)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.16,1,.3,1)" }
    );
    anim.onfinish = () => el.remove();
    anim.oncancel = () => el.remove();
  }
}
