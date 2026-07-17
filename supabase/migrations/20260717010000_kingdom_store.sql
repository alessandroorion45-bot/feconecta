-- ============================================================
-- KINGDOM STORE — loja de apoio ao projeto
-- Itens cosméticos/colecionáveis; nenhum concede vantagem
-- espiritual ou funcional. Conteúdo bíblico continua gratuito.
-- ============================================================

-- 1. Categorias da loja
CREATE TABLE IF NOT EXISTS public.store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_categories (nome, icone, ordem) VALUES
  ('Selos de Apoiador', '🎖️', 1),
  ('Presentes', '🎁', 2),
  ('Personalização de Perfil', '✨', 3),
  ('Fundos de Perfil', '🖼️', 4),
  ('Efeitos Visuais', '🎉', 5)
ON CONFLICT (nome) DO NOTHING;

-- 2. Produtos
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descricao TEXT,
  mensagem TEXT,
  verse_reference TEXT,
  verse_text TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('selo', 'moldura', 'fundo', 'efeito', 'outro')),
  badge_id UUID REFERENCES public.badges(id) ON DELETE SET NULL,
  cosmetic_key TEXT,
  image_url TEXT,
  preco NUMERIC(10,2) NOT NULL CHECK (preco > 0),
  aura TEXT,
  categoria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived')),
  giftable BOOLEAN NOT NULL DEFAULT true,
  limitado BOOLEAN NOT NULL DEFAULT false,
  estoque INTEGER,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_store_products_updated_at ON public.store_products;
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Compras (inclui presentes: gift_to + gift_message)
CREATE TABLE IF NOT EXISTS public.store_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  mp_order_id TEXT,
  mp_payment_id TEXT,
  gift_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gift_message TEXT,
  fulfilled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_purchases_buyer ON public.store_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_status ON public.store_purchases(status, created_at);

-- 4. Cosméticos do usuário (molduras/fundos/efeitos possuídos e equipados)
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
  cosmetic_key TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('moldura', 'fundo', 'efeito')),
  equipped BOOLEAN NOT NULL DEFAULT false,
  acquired_via TEXT NOT NULL DEFAULT 'purchase' CHECK (acquired_via IN ('purchase', 'gift', 'admin')),
  gifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, cosmetic_key)
);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON public.user_cosmetics(user_id, equipped);

-- 5. Configurações da loja (meta do mês)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  meta_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  meta_ativa BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 6. RLS
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias da loja são públicas" ON public.store_categories;
CREATE POLICY "Categorias da loja são públicas" ON public.store_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins gerenciam categorias da loja" ON public.store_categories;
CREATE POLICY "Admins gerenciam categorias da loja" ON public.store_categories FOR ALL
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Produtos ativos são públicos" ON public.store_products;
CREATE POLICY "Produtos ativos são públicos" ON public.store_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins gerenciam produtos" ON public.store_products;
CREATE POLICY "Admins gerenciam produtos" ON public.store_products FOR ALL
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Compras: comprador e presenteado veem as suas; escrita só via Edge Function (service role)
DROP POLICY IF EXISTS "Comprador e presenteado veem a compra" ON public.store_purchases;
CREATE POLICY "Comprador e presenteado veem a compra" ON public.store_purchases FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = gift_to OR is_admin(auth.uid()));

-- Cosméticos: leitura pública (perfil de qualquer um mostra o que está equipado),
-- equipar/desequipar só o dono; inserção só via Edge Function
DROP POLICY IF EXISTS "Cosméticos são públicos para leitura" ON public.user_cosmetics;
CREATE POLICY "Cosméticos são públicos para leitura" ON public.user_cosmetics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Dono equipa seus cosméticos" ON public.user_cosmetics;
CREATE POLICY "Dono equipa seus cosméticos" ON public.user_cosmetics FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Configuração da loja é pública" ON public.store_settings;
CREATE POLICY "Configuração da loja é pública" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins alteram configuração da loja" ON public.store_settings;
CREATE POLICY "Admins alteram configuração da loja" ON public.store_settings FOR UPDATE
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 7. Categoria de badge "Apoiadores" + os 5 selos de apoiador
INSERT INTO public.badge_categories (nome, icone, ordem) VALUES ('Apoiadores', '❤️', 17)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.badges (badge_key, name, description, icon, rarity, category, unlock_criteria, xp_reward, verse_reference, verse_text, unlock_story, status, automatico)
VALUES
  ('apoiador_do_reino', 'Apoiador do Reino',
   'Selo de gratidão para quem contribui com a missão do Aliança Kingdom.',
   '🥉', 'uncommon', 'Apoiadores', '{"type": "purchase"}', 100,
   '2 Coríntios 9:7', 'Cada um contribua segundo propôs no seu coração...',
   'Sua generosidade ajuda a manter esta missão viva.', 'active', false),
  ('guardiao_da_obra', 'Guardião da Obra',
   'Selo de gratidão para quem ajuda a proteger uma obra que alcança vidas.',
   '🥈', 'rare', 'Apoiadores', '{"type": "purchase"}', 250,
   'Neemias 2:18', 'Levantemo-nos e edifiquemos.',
   'Você ajuda a proteger uma obra que alcança vidas.', 'active', false),
  ('coluna_do_reino', 'Coluna do Reino',
   'Selo de gratidão para quem fortalece esta missão com fidelidade.',
   '🥇', 'epic', 'Apoiadores', '{"type": "purchase"}', 500,
   'Gálatas 6:9', 'E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos.',
   'Sua fidelidade fortalece esta missão.', 'active', false),
  ('benfeitor_kingdom', 'Benfeitor Kingdom',
   'Selo de gratidão para quem investe para que milhares continuem ouvindo a Palavra.',
   '👑', 'legendary', 'Apoiadores', '{"type": "purchase"}', 1000,
   'Provérbios 11:25', 'A alma generosa prosperará, e quem dá alívio aos outros, alívio receberá.',
   'Obrigado por investir para que milhares de pessoas continuem ouvindo a Palavra.', 'active', false),
  ('fundador_apoiador', 'Fundador da Obra',
   'O selo mais alto de apoio — seu nome fica marcado na história do Aliança Kingdom.',
   '💎', 'exclusive', 'Apoiadores', '{"type": "purchase"}', 2500,
   '1 Coríntios 15:58', 'Sede firmes e constantes, sempre abundantes na obra do Senhor.',
   'Seu apoio ficará marcado na história do Aliança Kingdom.', 'active', false)
ON CONFLICT (badge_key) DO NOTHING;

-- 8. Produtos: 5 selos de apoiador ligados aos badges
INSERT INTO public.store_products (nome, slug, descricao, mensagem, verse_reference, verse_text, tipo, badge_id, preco, aura, categoria, ordem)
SELECT b.name, 'selo-' || lower(regexp_replace(b.badge_key, '_', '-', 'g')),
       b.description, b.unlock_story, b.verse_reference, b.verse_text,
       'selo', b.id, v.preco, v.aura, 'Selos de Apoiador', v.ordem
FROM (VALUES
  ('apoiador_do_reino', 10.00, 'bronze', 1),
  ('guardiao_da_obra', 30.00, 'prata', 2),
  ('coluna_do_reino', 70.00, 'ouro', 3),
  ('benfeitor_kingdom', 150.00, 'ouro-particulas', 4),
  ('fundador_apoiador', 500.00, 'diamante', 5)
) AS v(badge_key, preco, aura, ordem)
JOIN public.badges b ON b.badge_key = v.badge_key
ON CONFLICT (slug) DO NOTHING;

-- 9. Produtos: molduras, fundos e efeitos (cosméticos via CSS; admin pode
-- trocar preço/imagem depois pelo painel)
INSERT INTO public.store_products (nome, slug, descricao, tipo, cosmetic_key, preco, categoria, ordem) VALUES
  ('Moldura Bronze', 'moldura-bronze', 'Moldura bronze ao redor do seu avatar.', 'moldura', 'frame-bronze', 5.00, 'Personalização de Perfil', 1),
  ('Moldura Prata', 'moldura-prata', 'Moldura prateada ao redor do seu avatar.', 'moldura', 'frame-prata', 8.00, 'Personalização de Perfil', 2),
  ('Moldura Ouro', 'moldura-ouro', 'Moldura dourada ao redor do seu avatar.', 'moldura', 'frame-ouro', 12.00, 'Personalização de Perfil', 3),
  ('Moldura Cristal', 'moldura-cristal', 'Moldura translúcida com brilho de cristal.', 'moldura', 'frame-cristal', 15.00, 'Personalização de Perfil', 4),
  ('Moldura Diamante', 'moldura-diamante', 'Moldura premium com reflexo de diamante.', 'moldura', 'frame-diamante', 25.00, 'Personalização de Perfil', 5),
  ('Moldura Vitral', 'moldura-vitral', 'Moldura multicolorida inspirada em vitrais.', 'moldura', 'frame-vitral', 18.00, 'Personalização de Perfil', 6),
  ('Moldura Luz Celestial', 'moldura-luz-celestial', 'Moldura com aura de luz suave.', 'moldura', 'frame-luz', 20.00, 'Personalização de Perfil', 7),

  ('Fundo Céu Estrelado', 'fundo-ceu-estrelado', 'Fundo de perfil com céu estrelado discreto.', 'fundo', 'bg-ceu-estrelado', 8.00, 'Fundos de Perfil', 1),
  ('Fundo Amanhecer', 'fundo-amanhecer', 'Tons dourados de amanhecer em Jerusalém.', 'fundo', 'bg-amanhecer', 8.00, 'Fundos de Perfil', 2),
  ('Fundo Montanhas', 'fundo-montanhas', 'Montanhas serenas ao entardecer.', 'fundo', 'bg-montanhas', 8.00, 'Fundos de Perfil', 3),
  ('Fundo Rio Tranquilo', 'fundo-rio-tranquilo', 'Águas tranquilas — Salmo 23.', 'fundo', 'bg-rio', 8.00, 'Fundos de Perfil', 4),
  ('Fundo Oliveiras', 'fundo-oliveiras', 'Verde suave de um jardim de oliveiras.', 'fundo', 'bg-oliveiras', 8.00, 'Fundos de Perfil', 5),
  ('Fundo Vitral Iluminado', 'fundo-vitral', 'Cores de vitral com luz difusa.', 'fundo', 'bg-vitral', 12.00, 'Fundos de Perfil', 6),
  ('Fundo Luz Dourada', 'fundo-luz-dourada', 'Gradiente dourado abstrato e elegante.', 'fundo', 'bg-luz-dourada', 12.00, 'Fundos de Perfil', 7),

  ('Partículas Douradas', 'efeito-particulas-douradas', 'Partículas douradas suaves no seu perfil.', 'efeito', 'fx-particulas-douradas', 15.00, 'Efeitos Visuais', 1),
  ('Pequenas Estrelas', 'efeito-estrelas', 'Estrelinhas discretas flutuando.', 'efeito', 'fx-estrelas', 15.00, 'Efeitos Visuais', 2),
  ('Raios de Luz', 'efeito-raios-de-luz', 'Feixes de luz suaves atravessando o perfil.', 'efeito', 'fx-raios-luz', 20.00, 'Efeitos Visuais', 3),
  ('Brilho Cristalino', 'efeito-brilho-cristalino', 'Cintilância cristalina elegante.', 'efeito', 'fx-brilho', 20.00, 'Efeitos Visuais', 4)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';

SELECT 'ok' as status;
