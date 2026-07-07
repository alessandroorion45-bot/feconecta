import { supabase } from '@/integrations/supabase/client';
import type { SavedGameState } from '@/hooks/useWordSearchGame';

const LOCAL_KEY = 'alianca:caca-palavras:session';

export function saveSessionLocal(state: SavedGameState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch { /* storage cheia/indisponível — silencioso */ }
}

export function loadSessionLocal(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedGameState;
  } catch {
    return null;
  }
}

export function clearSessionLocal() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch { /* silencioso */ }
}

export async function saveSessionRemote(userId: string, state: SavedGameState) {
  await (supabase.from('game_sessions' as any) as any).upsert(
    {
      user_id: userId,
      game_key: 'word_search',
      level: state.level,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,game_key' }
  );
}

export async function loadSessionRemote(userId: string): Promise<SavedGameState | null> {
  const { data } = await (supabase.from('game_sessions' as any) as any)
    .select('state')
    .eq('user_id', userId)
    .eq('game_key', 'word_search')
    .maybeSingle();
  return (data?.state as SavedGameState) || null;
}

export async function clearSessionRemote(userId: string) {
  await (supabase.from('game_sessions' as any) as any)
    .delete()
    .eq('user_id', userId)
    .eq('game_key', 'word_search');
}
