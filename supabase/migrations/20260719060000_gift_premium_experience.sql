-- ============================================================
-- PRESENTES KINGDOM — Experiência Premium
-- Aditivo apenas: nova coluna opcional + duas tabelas novas.
-- Nenhuma tabela/coluna/policy existente é alterada ou removida.
-- ============================================================

-- Raridade do presente (define o glow/moldura na experiência premium).
-- Só usada por tipo='presente'; os demais tipos ignoram a coluna.
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS raridade text NOT NULL DEFAULT 'comum';

ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_raridade_check;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_raridade_check
  CHECK (raridade = ANY (ARRAY['comum','incomum','raro','epico','lendario','exclusivo']::text[]));

-- Reações rápidas de quem recebeu/enviou (uma por usuário por presente).
CREATE TABLE IF NOT EXISTS public.gift_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.store_purchases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction = ANY (ARRAY['amem','gratidao','gloria','aleluia']::text[])),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_reactions_purchase ON public.gift_reactions (purchase_id);

ALTER TABLE public.gift_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gift_reactions_select" ON public.gift_reactions;
CREATE POLICY "gift_reactions_select" ON public.gift_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_purchases sp
      WHERE sp.id = gift_reactions.purchase_id
        AND (sp.buyer_id = auth.uid() OR sp.gift_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "gift_reactions_insert_own" ON public.gift_reactions;
CREATE POLICY "gift_reactions_insert_own" ON public.gift_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.store_purchases sp
      WHERE sp.id = gift_reactions.purchase_id
        AND (sp.buyer_id = auth.uid() OR sp.gift_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "gift_reactions_update_own" ON public.gift_reactions;
CREATE POLICY "gift_reactions_update_own" ON public.gift_reactions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gift_reactions_delete_own" ON public.gift_reactions;
CREATE POLICY "gift_reactions_delete_own" ON public.gift_reactions FOR DELETE
  USING (auth.uid() = user_id);

REVOKE ALL ON public.gift_reactions FROM anon;
REVOKE ALL ON public.gift_reactions FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_reactions TO authenticated;

-- Favoritos: quem recebeu/enviou guarda o presente numa coleção pessoal.
CREATE TABLE IF NOT EXISTS public.gift_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.store_purchases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, user_id)
);

ALTER TABLE public.gift_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gift_favorites_select_own" ON public.gift_favorites;
CREATE POLICY "gift_favorites_select_own" ON public.gift_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gift_favorites_insert_own" ON public.gift_favorites;
CREATE POLICY "gift_favorites_insert_own" ON public.gift_favorites FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.store_purchases sp
      WHERE sp.id = gift_favorites.purchase_id
        AND (sp.buyer_id = auth.uid() OR sp.gift_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "gift_favorites_delete_own" ON public.gift_favorites;
CREATE POLICY "gift_favorites_delete_own" ON public.gift_favorites FOR DELETE
  USING (auth.uid() = user_id);

REVOKE ALL ON public.gift_favorites FROM anon;
REVOKE ALL ON public.gift_favorites FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.gift_favorites TO authenticated;

SELECT 'ok' AS status;
