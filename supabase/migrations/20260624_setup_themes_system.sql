-- =====================================================
-- SISTEMA DE TEMAS PREMIUM - SETUP COMPLETO
-- =====================================================
-- Cria tabelas, funções e dados para o sistema de temas
-- =====================================================

-- =====================================================
-- 1. TABELA DE TEMAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key text UNIQUE NOT NULL,
  theme_name text NOT NULL,
  description text,
  colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  effects jsonb DEFAULT '{}'::jsonb,
  rarity integer DEFAULT 1 CHECK (rarity BETWEEN 1 AND 5),
  tier text CHECK (tier IN ('standard', 'gold', 'platinum')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index para buscar temas por key
CREATE INDEX IF NOT EXISTS idx_themes_key ON public.themes(theme_key);
CREATE INDEX IF NOT EXISTS idx_themes_rarity ON public.themes(rarity);

-- RLS para temas (todos podem ler)
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Temas visíveis para todos" ON public.themes;
CREATE POLICY "Temas visíveis para todos"
  ON public.themes FOR SELECT
  USING (true);

-- =====================================================
-- 2. TABELA DE TEMAS DOS USUÁRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme_key text REFERENCES public.themes(theme_key) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT false,
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamptz,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, theme_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_themes_user ON public.user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_themes_active ON public.user_themes(user_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem seus próprios temas" ON public.user_themes;
CREATE POLICY "Usuários veem seus próprios temas"
  ON public.user_themes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários atualizam seus temas" ON public.user_themes;
CREATE POLICY "Usuários atualizam seus temas"
  ON public.user_themes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema insere temas" ON public.user_themes;
CREATE POLICY "Sistema insere temas"
  ON public.user_themes FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 3. INSERIR TEMAS PADRÃO
-- =====================================================

INSERT INTO public.themes (theme_key, theme_name, description, colors, effects, rarity, tier) VALUES
  -- Tema gratuito
  ('default', 'Padrão', 'Tema clássico da plataforma',
   '{"primary": "#6366f1", "secondary": "#8b5cf6", "accent": "#a78bfa", "background": "#ffffff", "text": "#1f2937", "gradient": ["#6366f1", "#8b5cf6"]}'::jsonb,
   '{}'::jsonb, 1, NULL),

  -- Temas premium
  ('reino-celestial', 'Reino Celestial', 'Branco perolado com toques dourados celestiais',
   '{"primary": "#f8f7ff", "secondary": "#ffd700", "accent": "#fff9e6", "background": "#fefefe", "text": "#2c2c2c", "gradient": ["#f8f7ff", "#fff9e6", "#ffd700"]}'::jsonb,
   '{"particles": "stars", "glow": "soft-gold", "animation": "gentle-float"}'::jsonb, 3, 'standard'),

  ('nova-jerusalem', 'Nova Jerusalém', 'Ouro brilhante com cristal translúcido',
   '{"primary": "#ffd700", "secondary": "#c4b5fd", "accent": "#fef3c7", "background": "#fffbeb", "text": "#1e293b", "gradient": ["#ffd700", "#fbbf24", "#c4b5fd"]}'::jsonb,
   '{"particles": "crystals", "glow": "golden-shine", "animation": "radiant-pulse"}'::jsonb, 4, 'standard'),

  ('trono-gloria', 'Trono da Glória', 'Roxo imperial com dourado intenso',
   '{"primary": "#7c3aed", "secondary": "#fbbf24", "accent": "#a78bfa", "background": "#faf5ff", "text": "#1e1b4b", "gradient": ["#7c3aed", "#a78bfa", "#fbbf24"]}'::jsonb,
   '{"particles": "royal-stars", "glow": "purple-gold", "animation": "majestic-wave"}'::jsonb, 4, 'standard'),

  ('arca-alianca', 'Arca da Aliança', 'Ouro antigo com madeira nobre',
   '{"primary": "#b45309", "secondary": "#d97706", "accent": "#92400e", "background": "#fef3c7", "text": "#451a03", "gradient": ["#d97706", "#b45309", "#92400e"]}'::jsonb,
   '{"particles": "temple-light", "glow": "ancient-gold", "animation": "sacred-shimmer"}'::jsonb, 3, 'standard'),

  ('guerreiro-fe', 'Guerreiro da Fé', 'Preto premium com vermelho escuro e ouro metálico',
   '{"primary": "#18181b", "secondary": "#dc2626", "accent": "#fbbf24", "background": "#27272a", "text": "#fafafa", "gradient": ["#18181b", "#dc2626", "#fbbf24"]}'::jsonb,
   '{"particles": "fire-sparks", "glow": "red-gold", "animation": "warrior-pulse"}'::jsonb, 4, 'standard'),

  ('monte-siao', 'Monte Sião', 'Azul profundo com branco luminoso',
   '{"primary": "#1e3a8a", "secondary": "#60a5fa", "accent": "#dbeafe", "background": "#eff6ff", "text": "#1e3a8a", "gradient": ["#1e3a8a", "#3b82f6", "#60a5fa"]}'::jsonb,
   '{"particles": "clouds", "glow": "sky-blue", "animation": "mountain-breeze"}'::jsonb, 3, 'standard'),

  ('jardim-eden', 'Jardim do Éden', 'Verde esmeralda com natureza viva',
   '{"primary": "#059669", "secondary": "#10b981", "accent": "#d1fae5", "background": "#f0fdf4", "text": "#064e3b", "gradient": ["#059669", "#10b981", "#6ee7b7"]}'::jsonb,
   '{"particles": "leaves", "glow": "nature-green", "animation": "garden-bloom"}'::jsonb, 4, 'gold'),

  ('diamante-promessa', 'Diamante da Promessa', 'Azul cristal com efeitos glassmorphism',
   '{"primary": "#0ea5e9", "secondary": "#38bdf8", "accent": "#e0f2fe", "background": "#f0f9ff", "text": "#0c4a6e", "gradient": ["#0ea5e9", "#38bdf8", "#7dd3fc"]}'::jsonb,
   '{"particles": "diamond-sparkles", "glow": "crystal-shine", "animation": "glass-refract"}'::jsonb, 5, 'gold'),

  ('dark-royal', 'Dark Royal Premium', 'Preto absoluto com roxo neon e dourado brilhante. O tema mais raro.',
   '{"primary": "#000000", "secondary": "#a855f7", "accent": "#fbbf24", "background": "#0a0a0a", "text": "#fafafa", "gradient": ["#000000", "#581c87", "#a855f7", "#fbbf24"]}'::jsonb,
   '{"particles": "neon-stars", "glow": "purple-gold-neon", "animation": "royal-pulse", "special": "aurora-effect"}'::jsonb, 5, 'platinum')
ON CONFLICT (theme_key) DO NOTHING;

-- =====================================================
-- 4. FUNÇÃO: GET ACTIVE THEME
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_active_theme(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme_key text;
BEGIN
  -- Buscar tema ativo do usuário
  SELECT theme_key INTO v_theme_key
  FROM public.user_themes
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  -- Se não encontrou, retornar 'default'
  RETURN COALESCE(v_theme_key, 'default');
END;
$$;

-- =====================================================
-- 5. FUNÇÃO: GET AVAILABLE THEMES
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_available_themes(p_user_id uuid)
RETURNS TABLE (
  theme_key text,
  theme_name text,
  description text,
  colors jsonb,
  effects jsonb,
  rarity integer,
  tier text,
  is_unlocked boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.theme_key,
    t.theme_name,
    t.description,
    t.colors,
    t.effects,
    t.rarity,
    t.tier,
    -- Tema é desbloqueado se for 'default' ou se está em user_themes com is_unlocked = true
    COALESCE(
      (t.theme_key = 'default'),
      (SELECT ut.is_unlocked FROM public.user_themes ut
       WHERE ut.user_id = p_user_id AND ut.theme_key = t.theme_key)
    ) as is_unlocked,
    -- Tema é ativo se está em user_themes com is_active = true
    COALESCE(
      (SELECT ut.is_active FROM public.user_themes ut
       WHERE ut.user_id = p_user_id AND ut.theme_key = t.theme_key),
      false
    ) as is_active
  FROM public.themes t
  WHERE t.is_active = true
  ORDER BY
    CASE WHEN t.theme_key = 'default' THEN 0 ELSE 1 END,
    t.rarity DESC,
    t.theme_name;
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: SET ACTIVE THEME
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_active_theme(
  p_user_id uuid,
  p_theme_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_unlocked boolean;
  v_theme_exists boolean;
BEGIN
  -- Verificar se o tema existe
  SELECT EXISTS(
    SELECT 1 FROM public.themes WHERE theme_key = p_theme_key
  ) INTO v_theme_exists;

  IF NOT v_theme_exists THEN
    RAISE EXCEPTION 'Tema não encontrado: %', p_theme_key;
  END IF;

  -- Se for o tema default, sempre permitir
  IF p_theme_key = 'default' THEN
    v_is_unlocked := true;
  ELSE
    -- Verificar se o usuário possui o tema
    SELECT is_unlocked INTO v_is_unlocked
    FROM public.user_themes
    WHERE user_id = p_user_id AND theme_key = p_theme_key;

    -- Se não encontrou registro, tema está bloqueado
    IF v_is_unlocked IS NULL THEN
      v_is_unlocked := false;
    END IF;
  END IF;

  -- Se tema está bloqueado, retornar erro
  IF NOT v_is_unlocked THEN
    RAISE EXCEPTION 'Tema bloqueado: %', p_theme_key;
  END IF;

  -- Desativar todos os temas do usuário
  UPDATE public.user_themes
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id;

  -- Se não for o tema default, ativar o tema escolhido
  IF p_theme_key != 'default' THEN
    -- Inserir ou atualizar o tema
    INSERT INTO public.user_themes (user_id, theme_key, is_active, is_unlocked, unlocked_at)
    VALUES (p_user_id, p_theme_key, true, true, now())
    ON CONFLICT (user_id, theme_key)
    DO UPDATE SET is_active = true, updated_at = now();
  END IF;

  RETURN true;
END;
$$;

-- =====================================================
-- 7. TRIGGER: ATUALIZAR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_themes_updated_at ON public.themes;
CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_themes_updated_at ON public.user_themes;
CREATE TRIGGER update_user_themes_updated_at
  BEFORE UPDATE ON public.user_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.themes IS 'Temas disponíveis na plataforma';
COMMENT ON TABLE public.user_themes IS 'Temas que cada usuário possui e qual está ativo';
COMMENT ON FUNCTION public.get_active_theme IS 'Retorna o tema ativo do usuário';
COMMENT ON FUNCTION public.get_available_themes IS 'Retorna todos os temas com status de desbloqueio';
COMMENT ON FUNCTION public.set_active_theme IS 'Ativa um tema para o usuário';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
