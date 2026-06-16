import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type SoundType = 'classic' | 'bubble' | 'chime' | 'pop' | 'whoosh';

interface ChatPreferences {
  sound_enabled: boolean;
  send_sound: SoundType;
  receive_sound: SoundType;
  theme: string;
  bubble_style: string;
}

/**
 * Synthesize a warm, nostalgic two-tone chime using Web Audio API.
 * Notes: C5 → E5 with gentle sine-wave decay.
 */
const playNostalgicChime = (volume = 0.3) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First tone – C5 (523 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone – E5 (659 Hz), slight delay for melodic feel
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0.01, now);
    gain2.gain.linearRampToValueAtTime(volume * 0.8, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Cleanup context after sounds finish
    setTimeout(() => ctx.close(), 700);
  } catch {
    // AudioContext not available – silently ignore
  }
};

/** Quick pop sound for sent messages */
const playSendPop = (volume = 0.2) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch {
    // silently ignore
  }
};

export const useChatSounds = () => {
  const [preferences, setPreferences] = useState<ChatPreferences>({
    sound_enabled: true,
    send_sound: 'classic',
    receive_sound: 'classic',
    theme: 'auto',
    bubble_style: 'modern'
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('chat_preferences' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        sound_enabled: (data as any).sound_enabled ?? true,
        send_sound: (data as any).send_sound ?? 'classic',
        receive_sound: (data as any).receive_sound ?? 'classic',
        theme: (data as any).theme ?? 'auto',
        bubble_style: (data as any).bubble_style ?? 'modern'
      });
    }
  };

  const playSound = useCallback((type: 'send' | 'receive') => {
    if (!preferences.sound_enabled) return;

    if (type === 'send') {
      playSendPop(0.2);
    } else {
      playNostalgicChime(0.3);
    }
  }, [preferences.sound_enabled]);

  const updatePreferences = async (updates: Partial<ChatPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    await supabase
      .from('chat_preferences' as any)
      .upsert({
        user_id: user.id,
        ...newPrefs,
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'user_id' });
  };

  return { preferences, playSound, updatePreferences, loadPreferences };
};
