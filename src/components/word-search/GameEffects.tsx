import { useCallback, useRef, useEffect, useState } from 'react';

/** Gold particle rain effect */
export const useGoldRain = () => {
  const spawnParticles = useCallback((count = 40) => {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'pv-gold-particle';
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.width = `${4 + Math.random() * 6}px`;
      particle.style.height = particle.style.width;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 4000);
    }
  }, []);

  return spawnParticles;
};

/** "Palavra Revelada!" floating text */
export const useRevealedBanner = () => {
  const show = useCallback((word: string) => {
    const banner = document.createElement('div');
    banner.className = 'pv-word-revealed';
    banner.textContent = `✨ ${word} ✨`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 1500);
  }, []);

  return show;
};

/** Level complete glow overlay */
export const useLevelGlow = () => {
  const show = useCallback(() => {
    const glow = document.createElement('div');
    glow.className = 'pv-level-glow';
    document.body.appendChild(glow);
    setTimeout(() => glow.remove(), 2200);
  }, []);

  return show;
};

/** Sound effects via Web Audio API (no external files needed) */
export const useGameSounds = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playSuccess = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';

      // Pleasant ascending chime (harp-like)
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now);       // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1);  // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2);  // G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch { /* silence errors */ }
  }, [getCtx]);

  const playClick = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch { /* silence errors */ }
  }, [getCtx]);

  const playLevelComplete = useCallback(() => {
    try {
      const ctx = getCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.15;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch { /* silence errors */ }
  }, [getCtx]);

  return { playSuccess, playClick, playLevelComplete };
};

/** Mobile vibration */
export const vibrateShort = () => {
  try {
    navigator?.vibrate?.(50);
  } catch { /* not supported */ }
};
