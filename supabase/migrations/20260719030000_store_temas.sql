-- ============================================================
-- KINGDOM STORE: Temas à venda
-- Novo tipo de produto 'tema' — a compra desbloqueia o tema
-- em user_themes (entrega na edge fn check-purchase-status).
-- (Aplicado via CLI em 2026-07-19; arquivo mantido pro histórico.)
-- ============================================================

ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_tipo_check;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_tipo_check
  CHECK (tipo = ANY (ARRAY['selo','moldura','fundo','efeito','presente','tema','outro']::text[]));

INSERT INTO public.store_categories (nome, icone, ordem)
SELECT 'Temas', '🎨', 90
WHERE NOT EXISTS (SELECT 1 FROM public.store_categories WHERE nome = 'Temas');

-- Um produto por tema (menos o Padrão, que é de todos).
-- cosmetic_key = theme_key usado na entrega.
INSERT INTO public.store_products (nome, descricao, tipo, cosmetic_key, categoria, preco, giftable, status, ordem, icone, slug)
SELECT v.*, 'tema-' || v.cosmetic_key AS slug FROM (VALUES
  ('Tema Clássico',             'Minimalista, leve e elegante — branco limpo.',                        'tema', 'classico',          'Temas',  5.00, true, 'active', 200, '🤍'),
  ('Tema Reino Celestial',      'Branco perolado com toques dourados e estrelas suaves.',              'tema', 'reino-celestial',   'Temas', 12.00, true, 'active', 201, '👑'),
  ('Tema Monte Sião',           'Azul profundo com luz do céu e névoa de nuvens.',                     'tema', 'monte-siao',        'Temas', 12.00, true, 'active', 202, '⛰️'),
  ('Tema Sabedoria',            'Azul e cinza — elegância e conforto de leitura.',                     'tema', 'sabedoria',         'Temas', 12.00, true, 'active', 203, '📘'),
  ('Tema Arca da Aliança',      'Ouro antigo com madeira nobre e brilho do templo.',                   'tema', 'arca-alianca',      'Temas', 12.00, true, 'active', 204, '📜'),
  ('Tema Nova Jerusalém',       'Ouro brilhante com cristal translúcido.',                             'tema', 'nova-jerusalem',    'Temas', 15.00, true, 'active', 205, '🏰'),
  ('Tema Trono da Glória',      'Roxo imperial com dourado intenso e aurora real.',                    'tema', 'trono-gloria',      'Temas', 15.00, true, 'active', 206, '✨'),
  ('Tema Guerreiro da Fé',      'Preto premium com vermelho e ouro metálico.',                         'tema', 'guerreiro-fe',      'Temas', 15.00, true, 'active', 207, '⚔️'),
  ('Tema Jardim do Éden',       'Verde esmeralda com névoa de jardim e partículas vivas.',             'tema', 'jardim-eden',       'Temas', 20.00, true, 'active', 208, '🌿'),
  ('Tema Noite de Oração',      'Céu estrelado silencioso com aurora violeta.',                        'tema', 'noite-oracao',      'Temas', 20.00, true, 'active', 209, '🌙'),
  ('Tema Pentecostes',          'Fogo e energia — brasas subindo em vermelho e dourado.',              'tema', 'pentecostes',       'Temas', 20.00, true, 'active', 210, '🔥'),
  ('Tema Diamante da Promessa', 'Azul cristal com cintilância e efeito vidro.',                        'tema', 'diamante-promessa', 'Temas', 25.00, true, 'active', 211, '💎'),
  ('Tema Dark Royal Premium',   'Preto absoluto, roxo neon e dourado — o tema mais raro.',             'tema', 'dark-royal',        'Temas', 40.00, true, 'active', 212, '🖤')
) AS v(nome, descricao, tipo, cosmetic_key, categoria, preco, giftable, status, ordem, icone)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_products p WHERE p.tipo = 'tema' AND p.cosmetic_key = v.cosmetic_key
);

SELECT 'ok' AS status, (SELECT count(*) FROM public.store_products WHERE tipo='tema') AS temas;
