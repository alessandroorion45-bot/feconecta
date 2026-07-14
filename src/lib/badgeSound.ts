// Chime curto e suave pra celebrar o desbloqueio de um selo — sintetizado
// via Web Audio API, sem depender de nenhum arquivo de áudio externo.
export function playUnlockChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // dó-mi-sol-dó, um arpejo ascendente

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });

    setTimeout(() => ctx.close(), 1200);
  } catch {
    // navegador sem suporte a Web Audio — silenciosamente ignora
  }
}
