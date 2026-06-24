-- TABELA DE TEMAS
CREATE TABLE public.themes (
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

-- TABELA DE TEMAS DOS USUÁRIOS
CREATE TABLE public.user_themes (
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

-- INDEXES
CREATE INDEX idx_themes_key ON public.themes(theme_key);
CREATE INDEX idx_user_themes_user ON public.user_themes(user_id);

-- RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Temas visíveis para todos" ON public.themes FOR SELECT USING (true);

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem seus temas" ON public.user_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários atualizam seus temas" ON public.user_themes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sistema insere temas" ON public.user_themes FOR INSERT WITH CHECK (true);

-- INSERIR TEMAS
INSERT INTO public.themes (theme_key, theme_name, description, colors, rarity, tier) VALUES
('default', 'Padrão', 'Tema clássico', '{"primary":"#6366f1","secondary":"#8b5cf6","gradient":["#6366f1","#8b5cf6"]}'::jsonb, 1, NULL),
('dark-royal', 'Dark Royal', 'Preto com roxo neon', '{"primary":"#000000","secondary":"#a855f7","gradient":["#000000","#a855f7"]}'::jsonb, 5, 'platinum'),
('reino-celestial', 'Reino Celestial', 'Branco perolado', '{"primary":"#f8f7ff","secondary":"#ffd700","gradient":["#f8f7ff","#ffd700"]}'::jsonb, 3, 'standard'),
('nova-jerusalem', 'Nova Jerusalém', 'Ouro brilhante', '{"primary":"#ffd700","secondary":"#c4b5fd","gradient":["#ffd700","#c4b5fd"]}'::jsonb, 4, 'standard'),
('trono-gloria', 'Trono da Glória', 'Roxo imperial', '{"primary":"#7c3aed","secondary":"#fbbf24","gradient":["#7c3aed","#fbbf24"]}'::jsonb, 4, 'standard'),
('arca-alianca', 'Arca da Aliança', 'Ouro antigo', '{"primary":"#b45309","secondary":"#d97706","gradient":["#b45309","#d97706"]}'::jsonb, 3, 'standard'),
('guerreiro-fe', 'Guerreiro da Fé', 'Preto com vermelho', '{"primary":"#18181b","secondary":"#dc2626","gradient":["#18181b","#dc2626"]}'::jsonb, 4, 'standard'),
('monte-siao', 'Monte Sião', 'Azul profundo', '{"primary":"#1e3a8a","secondary":"#60a5fa","gradient":["#1e3a8a","#60a5fa"]}'::jsonb, 3, 'standard'),
('jardim-eden', 'Jardim do Éden', 'Verde esmeralda', '{"primary":"#059669","secondary":"#10b981","gradient":["#059669","#10b981"]}'::jsonb, 4, 'gold'),
('diamante-promessa', 'Diamante da Promessa', 'Azul cristal', '{"primary":"#0ea5e9","secondary":"#38bdf8","gradient":["#0ea5e9","#38bdf8"]}'::jsonb, 5, 'gold');

-- FUNÇÕES
CREATE OR REPLACE FUNCTION public.get_active_theme(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT theme_key FROM public.user_themes WHERE user_id = p_user_id AND is_active = true LIMIT 1),
    'default'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_available_themes(p_user_id uuid)
RETURNS TABLE (
  theme_key text,
  theme_name text,
  description text,
  colors jsonb,
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
    t.rarity,
    t.tier,
    COALESCE(t.theme_key = 'default', (SELECT ut.is_unlocked FROM public.user_themes ut WHERE ut.user_id = p_user_id AND ut.theme_key = t.theme_key)) as is_unlocked,
    COALESCE((SELECT ut.is_active FROM public.user_themes ut WHERE ut.user_id = p_user_id AND ut.theme_key = t.theme_key), false) as is_active
  FROM public.themes t
  ORDER BY CASE WHEN t.theme_key = 'default' THEN 0 ELSE 1 END, t.rarity DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_active_theme(p_user_id uuid, p_theme_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unlocked boolean;
BEGIN
  IF p_theme_key = 'default' THEN
    v_unlocked := true;
  ELSE
    SELECT is_unlocked INTO v_unlocked FROM public.user_themes WHERE user_id = p_user_id AND theme_key = p_theme_key;
    IF v_unlocked IS NULL THEN
      v_unlocked := false;
    END IF;
  END IF;

  IF NOT v_unlocked THEN
    RAISE EXCEPTION 'Tema bloqueado';
  END IF;

  UPDATE public.user_themes SET is_active = false WHERE user_id = p_user_id;

  IF p_theme_key != 'default' THEN
    INSERT INTO public.user_themes (user_id, theme_key, is_active, is_unlocked, unlocked_at)
    VALUES (p_user_id, p_theme_key, true, true, now())
    ON CONFLICT (user_id, theme_key) DO UPDATE SET is_active = true;
  END IF;

  RETURN true;
END;
$$;
