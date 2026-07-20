// Pad ambiente suave (piano/cordas etéreas) sintetizado via Web Audio API —
// sem depender de arquivos de áudio externos/licenciados. Nunca autoplay:
// só toca quando o usuário aperta "Ouvir ambiente", e é interrompível.

let ctx: AudioContext | null = null;
let nodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let masterGain: GainNode | null = null;

const CHORD = [261.63, 329.63, 392.0, 523.25]; // dó maior em camadas (dó-mi-sol-dó)

export function startGiftAmbient() {
  try {
    if (ctx) return; // já tocando
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2); // bem baixo, ambiente
    masterGain.connect(ctx.destination);

    nodes = CHORD.map((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      // leve vibrato lento pra dar vida ("cordas")
      const lfo = ctx!.createOscillator();
      const lfoGain = ctx!.createGain();
      lfo.frequency.value = 0.15 + i * 0.03;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      gain.gain.value = 0.5 / CHORD.length;
      osc.connect(gain);
      gain.connect(masterGain!);
      osc.start();
      return { osc, gain };
    });
  } catch {
    // navegador sem suporte — silenciosamente ignora
  }
}

export function stopGiftAmbient() {
  if (!ctx || !masterGain) return;
  const closingCtx = ctx;
  const closingMaster = masterGain;
  closingMaster.gain.linearRampToValueAtTime(0, closingCtx.currentTime + 0.8);
  setTimeout(() => {
    nodes.forEach(({ osc }) => {
      try { osc.stop(); } catch { /* já parado */ }
    });
    nodes = [];
    closingCtx.close();
  }, 850);
  ctx = null;
  masterGain = null;
}

export function isGiftAmbientPlaying() {
  return ctx !== null;
}
