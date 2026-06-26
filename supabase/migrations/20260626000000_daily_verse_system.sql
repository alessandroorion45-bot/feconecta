-- =====================================================
-- SISTEMA DE VERSÍCULO DO DIA
-- =====================================================
-- Função determinística que retorna o mesmo versículo
-- para todos os usuários no mesmo dia
-- =====================================================

-- Função para obter o versículo do dia
CREATE OR REPLACE FUNCTION public.get_daily_verse()
RETURNS TABLE (
  book_id integer,
  book_name text,
  book_abbrev text,
  chapter integer,
  verse integer,
  text text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_total_verses bigint;
  v_days_since_epoch integer;
  v_verse_index bigint;
BEGIN
  -- Contar total de versículos na bíblia
  SELECT COUNT(*) INTO v_total_verses
  FROM bible_verses;

  -- Calcular dias desde 01/01/2000 (epoch base)
  v_days_since_epoch := (CURRENT_DATE - DATE '2000-01-01')::integer;

  -- Usar módulo para garantir que o índice esteja dentro do range
  -- Adicionar salt para variar a sequência
  v_verse_index := ((v_days_since_epoch * 7919) % v_total_verses) + 1;

  -- Retornar o versículo do dia
  RETURN QUERY
  SELECT
    bv.book_id,
    bb.name as book_name,
    bb.abbrev as book_abbrev,
    bv.chapter,
    bv.verse,
    bv.text
  FROM bible_verses bv
  INNER JOIN bible_books bb ON bb.id = bv.book_id
  ORDER BY bv.id
  LIMIT 1
  OFFSET v_verse_index - 1;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.get_daily_verse() IS
'Retorna o versículo do dia de forma determinística. Todos os usuários veem o mesmo versículo no mesmo dia.';

-- =====================================================
-- TABELA PARA HISTÓRICO DE VERSÍCULOS DO DIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_verse_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  book_id integer NOT NULL REFERENCES bible_books(id),
  chapter integer NOT NULL,
  verse integer NOT NULL,
  text text NOT NULL,
  views_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_daily_verse_date ON public.daily_verse_history(date DESC);

-- RLS
ALTER TABLE public.daily_verse_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily verse history is visible to everyone"
ON public.daily_verse_history
FOR SELECT
USING (true);

-- Apenas admin pode inserir
CREATE POLICY "Only admins can manage daily verse history"
ON public.daily_verse_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- FUNÇÃO PARA REGISTRAR VISUALIZAÇÃO DO VERSÍCULO DO DIA
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_daily_verse_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_verse RECORD;
BEGIN
  -- Obter versículo do dia
  SELECT * INTO v_current_verse FROM get_daily_verse() LIMIT 1;

  -- Inserir ou atualizar histórico
  INSERT INTO daily_verse_history (
    date,
    book_id,
    chapter,
    verse,
    text,
    views_count
  )
  VALUES (
    CURRENT_DATE,
    v_current_verse.book_id,
    v_current_verse.chapter,
    v_current_verse.verse,
    v_current_verse.text,
    1
  )
  ON CONFLICT (date)
  DO UPDATE SET
    views_count = daily_verse_history.views_count + 1,
    updated_at = now();
END;
$$;

-- =====================================================
-- FUNÇÃO PARA REGISTRAR COMPARTILHAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_daily_verse_share()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE daily_verse_history
  SET
    shares_count = shares_count + 1,
    updated_at = now()
  WHERE date = CURRENT_DATE;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA REGISTRAR FAVORITAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_daily_verse_favorite()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE daily_verse_history
  SET
    favorites_count = favorites_count + 1,
    updated_at = now()
  WHERE date = CURRENT_DATE;
END;
$$;

-- =====================================================
-- SUCCESS
-- =====================================================

SELECT 'Sistema de Versículo do Dia criado com sucesso!' as message;
