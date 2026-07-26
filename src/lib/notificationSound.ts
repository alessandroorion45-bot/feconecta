// Toque de notificação — um "ding-dong" suave gerado via Web Audio API.
// Sem arquivo de áudio (funciona offline) e leve. O navegador só permite
// tocar após alguma interação do usuário na página; antes disso fica em
// silêncio de forma graciosa.
let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
};

export const playNotificationChime = () => {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  // Duas notas ascendentes (A5 → D6): agradável, não estridente.
  const notes: Array<[number, number]> = [
    [880, 0],
    [1174.66, 0.12],
  ];
  for (const [freq, t] of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.linearRampToValueAtTime(0.16, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.4);
  }
};

// Vibração curta (Android). iOS Safari não suporta a Vibration API — degrada.
export const vibrateNotification = () => {
  try {
    navigator.vibrate?.([90, 40, 90]);
  } catch {
    /* ignora */
  }
};
