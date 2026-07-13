-- ============================================================
-- Sistema de doações (Mercado Pago Checkout Pro)
-- ============================================================
-- Registros são criados/atualizados apenas pela Edge Function
-- (via service_role, que ignora RLS) — clientes nunca inserem ou
-- atualizam diretamente, evitando que alguém forje uma doação
-- "aprovada" pelo navegador.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  donor_name TEXT,
  donor_city TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  preferred_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_payment_method_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_mp_preference_id ON public.donations(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_donations_status_public ON public.donations(status, is_public);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view approved public donations" ON public.donations;
CREATE POLICY "Public can view approved public donations"
ON public.donations FOR SELECT
USING (status = 'approved' AND is_public = true);

SELECT 'ok' as status;
