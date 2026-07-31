-- ============================================================
-- Produtos afiliados / "Recomendados"
-- Espaço próprio, separado dos produtos da loja (store_products),
-- para NÃO tocar nos fluxos de compra (Mercado Pago) e presente.
-- Só admin cadastra; público lê os ativos; cliques são rastreados.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.affiliate_products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           text NOT NULL,
  affiliate_url  text NOT NULL,                       -- link de afiliado (obrigatório)
  recommend_reason text,                              -- frase curta do admin (por que recomenda)
  image_url      text,
  categoria      text NOT NULL DEFAULT 'Recomendados',
  headline       text,                                -- gerado/ajustado antes de publicar
  descricao      text,                                -- descrição persuasiva 2-4 frases
  cta_text       text NOT NULL DEFAULT 'Ver oferta',
  badge_label    text NOT NULL DEFAULT 'Link de parceiro',  -- transparência obrigatória
  status         text NOT NULL DEFAULT 'hidden' CHECK (status IN ('active','hidden','archived')),
  ordem          int  NOT NULL DEFAULT 0,
  click_count    int  NOT NULL DEFAULT 0,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_status ON public.affiliate_products (status, ordem);

ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

-- Público (anon + logado) só enxerga os ATIVOS
DROP POLICY IF EXISTS "affiliate_public_read_active" ON public.affiliate_products;
CREATE POLICY "affiliate_public_read_active" ON public.affiliate_products
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- Admin lê tudo
DROP POLICY IF EXISTS "affiliate_admin_read_all" ON public.affiliate_products;
CREATE POLICY "affiliate_admin_read_all" ON public.affiliate_products
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Só admin escreve (insert/update/delete)
DROP POLICY IF EXISTS "affiliate_admin_write" ON public.affiliate_products;
CREATE POLICY "affiliate_admin_write" ON public.affiliate_products
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Grants explícitos (Supabase concede amplo por padrão — travamos)
REVOKE ALL ON public.affiliate_products FROM anon, authenticated;
GRANT SELECT ON public.affiliate_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.affiliate_products TO authenticated;

-- ============================================================
-- Rastreio de clique real no link de afiliado (contador honesto)
-- Qualquer visitante pode chamar; incrementa e devolve o total.
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_affiliate_click(p_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.affiliate_products
    SET click_count = click_count + 1
    WHERE id = p_id AND status = 'active'
    RETURNING click_count INTO v_count;
  RETURN COALESCE(v_count, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(uuid) TO anon, authenticated;

SELECT 'ok' AS status;
