-- =====================================================
-- SISTEMA DE TEMAS PREMIUM
-- =====================================================
-- 9 temas ultra premium com unlock por conquistas ou VIP
-- Cada tema tem paleta, animações e efeitos próprios
-- =====================================================

-- =====================================================
-- ENUM: Categorias de desbloqueio
-- =====================================================
CREATE TYPE theme_unlock_type AS ENUM (
  'default',        -- Tema padrão (sempre disponível)
  'vip_only',       -- Apenas VIPs
  'achievement',    -- Desbloqueado por conquista
  'xp_milestone',   -- Desbloqueado ao atingir XP
  'purchase',       -- Compra com moedas
  'event',          -- Evento especial
  'top_rank'        -- Top ranking
);

-- =====================================================
-- TABELA: Temas Disponíveis
-- =====================================================
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  theme_key TEXT NOT NULL UNIQUE,
  theme_name TEXT NOT NULL,
  description TEXT,

  -- Visual
  preview_url TEXT, -- URL da imagem de preview
  colors JSONB NOT NULL, -- Paleta de cores do tema
  effects JSONB, -- Efeitos visuais (particles, glow, animations)

  -- Desbloqueio
  unlock_type theme_unlock_type NOT NULL DEFAULT 'default',
  unlock_requirement JSONB, -- {"xp": 10000} ou {"achievement_id": "..."}
  is_exclusive BOOLEAN DEFAULT false, -- Temas ultra raros

  -- Tier VIP necessário (NULL = qualquer um)
  vip_tier_required TEXT, -- 'standard', 'gold', 'platinum'

  -- Metadata
  rarity INTEGER DEFAULT 1, -- 1-5 (1 comum, 5 ultra raro)
  release_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_themes_key ON public.themes(theme_key);
CREATE INDEX idx_themes_unlock_type ON public.themes(unlock_type);
CREATE INDEX idx_themes_active ON public.themes(is_active) WHERE is_active = true;
CREATE INDEX idx_themes_rarity ON public.themes(rarity);

-- =====================================================
-- INSERIR OS 9 TEMAS PREMIUM
-- =====================================================

INSERT INTO public.themes (theme_key, theme_name, description, colors, effects, unlock_type, unlock_requirement, vip_tier_required, rarity, is_exclusive) VALUES

-- 1. Tema Padrão (sempre disponível)
(
  'default',
  'Padrão',
  'Tema clássico da plataforma',
  '{"primary": "#6366f1", "secondary": "#8b5cf6", "background": "#ffffff", "text": "#1f2937"}'::jsonb,
  NULL,
  'default',
  NULL,
  NULL,
  1,
  false
),

-- 2. Reino Celestial
(
  'reino-celestial',
  'Reino Celestial',
  'Branco perolado com toques dourados celestiais. Efeitos de luz suave e portões celestiais ao fundo.',
  '{"primary": "#f8f7ff", "secondary": "#ffd700", "accent": "#fff9e6", "background": "#fefefe", "text": "#2c2c2c", "gradient": ["#f8f7ff", "#fff9e6", "#ffd700"]}'::jsonb,
  '{"particles": "stars", "glow": "soft-gold", "animation": "gentle-float"}'::jsonb,
  'vip_only',
  NULL,
  'standard',
  3,
  false
),

-- 3. Nova Jerusalém
(
  'nova-jerusalem',
  'Nova Jerusalém',
  'Ouro brilhante com cristal translúcido. Visual inspirado em Apocalipse 21.',
  '{"primary": "#ffd700", "secondary": "#c4b5fd", "accent": "#fef3c7", "background": "#fffbeb", "text": "#1e293b", "gradient": ["#ffd700", "#fbbf24", "#c4b5fd"]}'::jsonb,
  '{"particles": "crystals", "glow": "golden-shine", "animation": "radiant-pulse"}'::jsonb,
  'vip_only',
  NULL,
  'standard',
  4,
  false
),

-- 4. Trono da Glória
(
  'trono-gloria',
  'Trono da Glória',
  'Roxo imperial com dourado intenso. Atmosfera de realeza divina.',
  '{"primary": "#7c3aed", "secondary": "#fbbf24", "accent": "#a78bfa", "background": "#faf5ff", "text": "#1e1b4b", "gradient": ["#7c3aed", "#a78bfa", "#fbbf24"]}'::jsonb,
  '{"particles": "royal-stars", "glow": "purple-gold", "animation": "majestic-wave"}'::jsonb,
  'xp_milestone',
  '{"xp": 50000}'::jsonb,
  NULL,
  4,
  false
),

-- 5. Arca da Aliança
(
  'arca-alianca',
  'Arca da Aliança',
  'Ouro antigo com madeira nobre. Elementos do templo sagrado.',
  '{"primary": "#b45309", "secondary": "#d97706", "accent": "#92400e", "background": "#fef3c7", "text": "#451a03", "gradient": ["#d97706", "#b45309", "#92400e"]}'::jsonb,
  '{"particles": "temple-light", "glow": "ancient-gold", "animation": "sacred-shimmer"}'::jsonb,
  'achievement',
  '{"achievement_key": "bible_master"}'::jsonb,
  NULL,
  3,
  false
),

-- 6. Guerreiro da Fé
(
  'guerreiro-fe',
  'Guerreiro da Fé',
  'Preto premium com vermelho escuro e ouro metálico. Para os guerreiros de oração.',
  '{"primary": "#18181b", "secondary": "#dc2626", "accent": "#fbbf24", "background": "#27272a", "text": "#fafafa", "gradient": ["#18181b", "#dc2626", "#fbbf24"]}'::jsonb,
  '{"particles": "fire-sparks", "glow": "red-gold", "animation": "warrior-pulse"}'::jsonb,
  'achievement',
  '{"achievement_key": "prayer_warrior"}'::jsonb,
  NULL,
  4,
  false
),

-- 7. Monte Sião
(
  'monte-siao',
  'Monte Sião',
  'Azul profundo com branco luminoso. Paisagens majestosas da cidade santa.',
  '{"primary": "#1e3a8a", "secondary": "#60a5fa", "accent": "#dbeafe", "background": "#eff6ff", "text": "#1e3a8a", "gradient": ["#1e3a8a", "#3b82f6", "#60a5fa"]}'::jsonb,
  '{"particles": "clouds", "glow": "sky-blue", "animation": "mountain-breeze"}'::jsonb,
  'xp_milestone',
  '{"xp": 25000}'::jsonb,
  NULL,
  3,
  false
),

-- 8. Jardim do Éden
(
  'jardim-eden',
  'Jardim do Éden',
  'Verde esmeralda com natureza viva. Água cristalina e vida abundante.',
  '{"primary": "#059669", "secondary": "#10b981", "accent": "#d1fae5", "background": "#f0fdf4", "text": "#064e3b", "gradient": ["#059669", "#10b981", "#6ee7b7"]}'::jsonb,
  '{"particles": "leaves", "glow": "nature-green", "animation": "garden-bloom"}'::jsonb,
  'vip_only',
  NULL,
  'gold',
  4,
  false
),

-- 9. Diamante da Promessa
(
  'diamante-promessa',
  'Diamante da Promessa',
  'Azul cristal com efeitos glassmorphism. Reflexos premium de luz divina.',
  '{"primary": "#0ea5e9", "secondary": "#38bdf8", "accent": "#e0f2fe", "background": "#f0f9ff", "text": "#0c4a6e", "gradient": ["#0ea5e9", "#38bdf8", "#7dd3fc"]}'::jsonb,
  '{"particles": "diamond-sparkles", "glow": "crystal-shine", "animation": "glass-refract"}'::jsonb,
  'vip_only',
  NULL,
  'gold',
  5,
  false
),

-- 10. Dark Royal Premium (MAIS RARO)
(
  'dark-royal',
  'Dark Royal Premium',
  'Preto absoluto com roxo neon e dourado brilhante. Animações exclusivas. O tema mais raro da plataforma.',
  '{"primary": "#000000", "secondary": "#a855f7", "accent": "#fbbf24", "background": "#0a0a0a", "text": "#fafafa", "gradient": ["#000000", "#581c87", "#a855f7", "#fbbf24"]}'::jsonb,
  '{"particles": "neon-stars", "glow": "purple-gold-neon", "animation": "royal-pulse", "special": "aurora-effect"}'::jsonb,
  'vip_only',
  NULL,
  'platinum',
  5,
  true
);

-- =====================================================
-- TABELA: Temas Desbloqueados por Usuário
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,

  -- Como foi desbloqueado
  unlocked_via TEXT, -- 'vip', 'achievement', 'purchase', 'grant'
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tema ativo
  is_active BOOLEAN DEFAULT false,

  CONSTRAINT unique_user_theme UNIQUE(user_id, theme_id)
);

-- Índices
CREATE INDEX idx_user_themes_user_id ON public.user_themes(user_id);
CREATE INDEX idx_user_themes_theme_id ON public.user_themes(theme_id);
CREATE INDEX idx_user_themes_active ON public.user_themes(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- FUNÇÕES: Verificação de Temas
-- =====================================================

-- Verificar se usuário tem tema desbloqueado
CREATE OR REPLACE FUNCTION has_theme_unlocked(p_user_id UUID, p_theme_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_theme_id UUID;
  v_theme themes%ROWTYPE;
BEGIN
  -- Buscar tema
  SELECT * INTO v_theme
  FROM public.themes
  WHERE theme_key = p_theme_key AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_theme_id := v_theme.id;

  -- Tema padrão sempre desbloqueado
  IF v_theme.unlock_type = 'default' THEN
    RETURN true;
  END IF;

  -- Verificar se já desbloqueou manualmente
  IF EXISTS (
    SELECT 1 FROM public.user_themes
    WHERE user_id = p_user_id AND theme_id = v_theme_id
  ) THEN
    RETURN true;
  END IF;

  -- Verificar VIP
  IF v_theme.unlock_type = 'vip_only' THEN
    -- Verificar se é VIP
    IF NOT is_vip(p_user_id) THEN
      RETURN false;
    END IF;

    -- Verificar tier mínimo
    IF v_theme.vip_tier_required IS NOT NULL THEN
      DECLARE
        v_user_tier TEXT;
        v_tier_order INTEGER;
        v_required_tier_order INTEGER;
      BEGIN
        v_user_tier := get_vip_tier(p_user_id);

        -- Ordem dos tiers: standard=1, gold=2, platinum=3
        v_tier_order := CASE v_user_tier
          WHEN 'standard' THEN 1
          WHEN 'gold' THEN 2
          WHEN 'platinum' THEN 3
          ELSE 0
        END;

        v_required_tier_order := CASE v_theme.vip_tier_required
          WHEN 'standard' THEN 1
          WHEN 'gold' THEN 2
          WHEN 'platinum' THEN 3
          ELSE 999
        END;

        RETURN v_tier_order >= v_required_tier_order;
      END;
    END IF;

    RETURN true; -- VIP sem tier específico
  END IF;

  -- Verificar milestone de XP
  IF v_theme.unlock_type = 'xp_milestone' THEN
    DECLARE
      v_required_xp INTEGER;
      v_user_xp INTEGER;
    BEGIN
      v_required_xp := (v_theme.unlock_requirement->>'xp')::INTEGER;

      SELECT COALESCE(total_xp, 0) INTO v_user_xp
      FROM public.users
      WHERE id = p_user_id;

      RETURN v_user_xp >= v_required_xp;
    END;
  END IF;

  -- Outros tipos de unlock (achievement, purchase, etc) requerem desbloqueio manual
  RETURN false;
END;
$$;

-- Obter tema ativo do usuário
CREATE OR REPLACE FUNCTION get_active_theme(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT t.theme_key
  FROM public.user_themes ut
  JOIN public.themes t ON t.id = ut.theme_id
  WHERE ut.user_id = p_user_id
    AND ut.is_active = true
    AND t.is_active = true
  LIMIT 1;
$$;

-- Desbloquear tema para usuário
CREATE OR REPLACE FUNCTION unlock_theme(
  p_user_id UUID,
  p_theme_key TEXT,
  p_unlocked_via TEXT DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme_id UUID;
  v_user_theme_id UUID;
BEGIN
  -- Buscar tema
  SELECT id INTO v_theme_id
  FROM public.themes
  WHERE theme_key = p_theme_key AND is_active = true;

  IF v_theme_id IS NULL THEN
    RAISE EXCEPTION 'Tema não encontrado: %', p_theme_key;
  END IF;

  -- Inserir desbloqueio
  INSERT INTO public.user_themes (user_id, theme_id, unlocked_via)
  VALUES (p_user_id, v_theme_id, p_unlocked_via)
  ON CONFLICT (user_id, theme_id) DO NOTHING
  RETURNING id INTO v_user_theme_id;

  RETURN v_user_theme_id;
END;
$$;

-- Ativar tema
CREATE OR REPLACE FUNCTION set_active_theme(
  p_user_id UUID,
  p_theme_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme_id UUID;
BEGIN
  -- Verificar se tema está desbloqueado
  IF NOT has_theme_unlocked(p_user_id, p_theme_key) THEN
    RAISE EXCEPTION 'Tema não desbloqueado: %', p_theme_key;
  END IF;

  -- Buscar theme_id
  SELECT id INTO v_theme_id
  FROM public.themes
  WHERE theme_key = p_theme_key AND is_active = true;

  -- Desativar todos os temas do usuário
  UPDATE public.user_themes
  SET is_active = false
  WHERE user_id = p_user_id;

  -- Ativar o tema escolhido (inserir se não existir)
  INSERT INTO public.user_themes (user_id, theme_id, is_active, unlocked_via)
  VALUES (p_user_id, v_theme_id, true, 'activated')
  ON CONFLICT (user_id, theme_id) DO UPDATE
  SET is_active = true;

  RETURN true;
END;
$$;

-- Listar temas disponíveis para usuário
CREATE OR REPLACE FUNCTION get_available_themes(p_user_id UUID)
RETURNS TABLE(
  theme_key TEXT,
  theme_name TEXT,
  description TEXT,
  colors JSONB,
  is_unlocked BOOLEAN,
  is_active BOOLEAN,
  rarity INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    t.theme_key,
    t.theme_name,
    t.description,
    t.colors,
    has_theme_unlocked(p_user_id, t.theme_key) as is_unlocked,
    COALESCE(ut.is_active, false) as is_active,
    t.rarity
  FROM public.themes t
  LEFT JOIN public.user_themes ut ON ut.theme_id = t.id AND ut.user_id = p_user_id
  WHERE t.is_active = true
  ORDER BY t.rarity ASC, t.theme_name;
$$;

-- =====================================================
-- TRIGGER: Apenas um tema ativo por vez
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.user_themes
    SET is_active = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ensure_single_active_theme ON public.user_themes;
CREATE TRIGGER trigger_ensure_single_active_theme
  BEFORE INSERT OR UPDATE ON public.user_themes
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_theme();

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- Todos podem ver temas disponíveis
CREATE POLICY "Everyone can view themes"
  ON public.themes
  FOR SELECT
  USING (is_active = true);

-- Users podem ver seus próprios temas desbloqueados
CREATE POLICY "Users can view own themes"
  ON public.user_themes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users podem ativar/desativar seus temas (via função)
CREATE POLICY "Users can manage own themes"
  ON public.user_themes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all themes"
  ON public.user_themes
  FOR SELECT
  USING (is_admin(auth.uid()));

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT ON public.themes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_themes TO authenticated;

GRANT EXECUTE ON FUNCTION has_theme_unlocked(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_theme(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_theme(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_active_theme(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_themes(UUID) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.themes IS '9 temas ultra premium com paletas e efeitos exclusivos';
COMMENT ON TABLE public.user_themes IS 'Temas desbloqueados e ativos dos usuários';
COMMENT ON FUNCTION has_theme_unlocked IS 'Verifica se usuário tem tema desbloqueado (por VIP, XP ou manual)';
COMMENT ON FUNCTION get_active_theme IS 'Retorna o tema ativo do usuário';
COMMENT ON FUNCTION set_active_theme IS 'Ativa um tema para o usuário';
COMMENT ON FUNCTION unlock_theme IS 'Desbloqueia um tema manualmente para um usuário';
