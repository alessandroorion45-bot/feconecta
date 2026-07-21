-- ============================================================
-- STATUS DE CHAT — disponível / orando / servindo / ocupado / offline
-- ============================================================
-- Substitui a presença efêmera (canal Realtime, perdia sincronia
-- em qualquer soluço de rede) por um heartbeat persistido: o
-- cliente atualiza last_active_at periodicamente; "offline" é
-- calculado (chat_status='offline' OU heartbeat velho) em vez de
-- depender de um socket sempre conectado.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_status text NOT NULL DEFAULT 'disponivel',
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_chat_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_chat_status_check
  CHECK (chat_status = ANY (ARRAY['disponivel','orando','servindo','ocupado','offline']::text[]));

CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles (last_active_at);

SELECT 'ok' AS status;
