-- ============================================================
-- Selos Kingdom: torna o sistema administrável pelo painel
-- (categorias e raridades deixam de ser fixas no código; selos
-- passam a ter imagem enviada, slug, status e ordem)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.badge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.badge_rarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cor_inicio TEXT NOT NULL,
  cor_fim TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.badge_categories (nome, icone, ordem) VALUES
  ('Doações', '❤️', 1),
  ('Devocional', '📖', 2),
  ('Comunidade', '🤝', 3),
  ('Estudos', '🎓', 4),
  ('Quiz', '❓', 5),
  ('Nível', '⭐', 6),
  ('Sequência', '🔥', 7),
  ('Eventos', '📅', 8),
  ('Especiais', '✨', 9),
  ('Liderança', '🛡️', 10),
  ('Evangelismo', '📢', 11),
  ('Oração', '🙏', 12),
  ('Leitura Bíblica', '📚', 13),
  ('Desafios', '🎯', 14),
  ('Missões', '🌍', 15),
  ('Personalizado', '🔧', 16)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.badge_rarities (nome, slug, cor_inicio, cor_fim, ordem) VALUES
  ('Comum', 'common', '#e2e4e9', '#9aa0ac', 1),
  ('Incomum', 'uncommon', '#6ee7b7', '#059669', 2),
  ('Raro', 'rare', '#93c5fd', '#2563eb', 3),
  ('Épico', 'epic', '#d8b4fe', '#7c3aed', 4),
  ('Lendário', 'legendary', '#fde68a', '#b45309', 5),
  ('Exclusivo', 'exclusive', '#fff8dc', '#b8860b', 6)
ON CONFLICT (nome) DO NOTHING;

-- Selos: enviar imagem própria, slug, status e ordem
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS automatico BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_status_check;
ALTER TABLE public.badges ADD CONSTRAINT badges_status_check
  CHECK (status IN ('active', 'hidden', 'archived'));

UPDATE public.badges SET slug = lower(regexp_replace(badge_key, '_', '-', 'g')) WHERE slug IS NULL;
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_slug_key;
ALTER TABLE public.badges ADD CONSTRAINT badges_slug_key UNIQUE (slug);

-- Raridade e categoria viram texto livre validado pelo painel (não mais
-- um CHECK fixo no banco) — é exatamente isso que permite o admin criar
-- novas raridades/categorias sem migration.
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_rarity_check;

-- Remapeia os valores antigos (em inglês / do esquema anterior) pros
-- novos, em português, que já existem em badge_rarities/badge_categories.
UPDATE public.badges SET rarity = CASE rarity
  WHEN 'special' THEN 'uncommon'
  WHEN 'mythic' THEN 'legendary'
  WHEN 'kingdom_exclusive' THEN 'exclusive'
  ELSE rarity
END;

UPDATE public.badges SET category = CASE category
  WHEN 'devotional' THEN 'Devocional'
  WHEN 'study' THEN 'Estudos'
  WHEN 'streak' THEN 'Sequência'
  WHEN 'quiz' THEN 'Quiz'
  WHEN 'social' THEN 'Comunidade'
  WHEN 'level' THEN 'Nível'
  WHEN 'special' THEN 'Especiais'
  WHEN 'donation' THEN 'Doações'
  ELSE category
END;

-- Concessão manual: quem concedeu e por quê
ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS concedido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Admin pode gerenciar o catálogo (as tabelas já eram de leitura pública)
ALTER TABLE public.badge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_rarities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias de selo são públicas para leitura" ON public.badge_categories;
CREATE POLICY "Categorias de selo são públicas para leitura" ON public.badge_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins gerenciam categorias de selo" ON public.badge_categories;
CREATE POLICY "Admins gerenciam categorias de selo" ON public.badge_categories FOR ALL
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Raridades de selo são públicas para leitura" ON public.badge_rarities;
CREATE POLICY "Raridades de selo são públicas para leitura" ON public.badge_rarities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins gerenciam raridades de selo" ON public.badge_rarities;
CREATE POLICY "Admins gerenciam raridades de selo" ON public.badge_rarities FOR ALL
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins gerenciam selos" ON public.badges;
CREATE POLICY "Admins gerenciam selos" ON public.badges FOR ALL
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins concedem selos manualmente" ON public.user_badges;
CREATE POLICY "Admins concedem selos manualmente" ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Bucket de storage pras imagens dos selos
INSERT INTO storage.buckets (id, name, public) VALUES ('kingdom-badges', 'kingdom-badges', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagens de selos são públicas" ON storage.objects;
CREATE POLICY "Imagens de selos são públicas"
ON storage.objects FOR SELECT USING (bucket_id = 'kingdom-badges');

DROP POLICY IF EXISTS "Admins enviam imagens de selos" ON storage.objects;
CREATE POLICY "Admins enviam imagens de selos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kingdom-badges' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins atualizam imagens de selos" ON storage.objects;
CREATE POLICY "Admins atualizam imagens de selos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kingdom-badges' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins removem imagens de selos" ON storage.objects;
CREATE POLICY "Admins removem imagens de selos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kingdom-badges' AND is_admin(auth.uid()));

NOTIFY pgrst, 'reload schema';

SELECT 'ok' as status;
