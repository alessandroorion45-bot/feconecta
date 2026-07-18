-- ============================================================
-- PRESENTES KINGDOM — estende a Kingdom Store (não cria sistema
-- paralelo): novo tipo de produto 'presente', emoji de exibição,
-- abertura do presente e agradecimento na própria compra.
-- ============================================================

-- 1. Emoji de exibição (enquanto o admin não sobe arte 1024x1024)
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS icone TEXT;

-- 2. Tipo 'presente'
ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_tipo_check;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_tipo_check
  CHECK (tipo IN ('selo', 'moldura', 'fundo', 'efeito', 'presente', 'outro'));

-- 3. Abertura + agradecimento do presente (a compra JÁ é o registro do
-- presente: quem enviou, quem recebeu, mensagem, pagamento, status)
ALTER TABLE public.store_purchases
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS thank_message TEXT,
  ADD COLUMN IF NOT EXISTS thanked_at TIMESTAMPTZ;

-- Presenteado pode marcar como aberto/agradecido
DROP POLICY IF EXISTS "Presenteado atualiza abertura e agradecimento" ON public.store_purchases;
CREATE POLICY "Presenteado atualiza abertura e agradecimento"
ON public.store_purchases FOR UPDATE
USING (auth.uid() = gift_to) WITH CHECK (auth.uid() = gift_to);

-- 4. Categorias de presente
INSERT INTO public.store_categories (nome, icone, ordem) VALUES
  ('Flores', '🌹', 10),
  ('Amizade', '🤝', 11),
  ('Incentivo', '✨', 12),
  ('Celebração', '🎉', 13)
ON CONFLICT (nome) DO NOTHING;

-- 5. Os 16 Presentes Kingdom
INSERT INTO public.store_products (nome, slug, descricao, tipo, icone, preco, categoria, verse_reference, verse_text, mensagem, ordem) VALUES
  ('Rosa da Gratidão', 'rosa-da-gratidao', 'Uma lembrança para alegrar o coração de um irmão na fé.', 'presente', '🌹', 5.00, 'Flores', 'Provérbios 17:17', 'Em todo tempo ama o amigo.', 'Que Deus continue fortalecendo sua caminhada.', 1),
  ('Aperto de Mão Fraterno', 'aperto-de-mao-fraterno', 'Um gesto simples que diz: estou com você.', 'presente', '🤝', 3.00, 'Amizade', 'Eclesiastes 4:9', 'Melhor é serem dois do que um.', 'Conte comigo, irmão!', 2),
  ('Coração de Gratidão', 'coracao-de-gratidao', 'Para agradecer alguém que marcou sua vida.', 'presente', '❤️', 5.00, 'Amizade', '1 Tessalonicenses 5:18', 'Em tudo dai graças.', 'Obrigado por existir na minha vida.', 3),
  ('Oração por Você', 'oracao-por-voce', 'Um lembrete de que alguém está orando por você.', 'presente', '🙏', 3.00, 'Incentivo', 'Tiago 5:16', 'A oração de um justo é poderosa e eficaz.', 'Estou orando por você!', 4),
  ('Pomba da Paz', 'pomba-da-paz', 'Que a paz de Cristo repouse sobre você.', 'presente', '🕊️', 7.00, 'Incentivo', 'João 14:27', 'Deixo-vos a paz, a minha paz vos dou.', 'Paz seja contigo!', 5),
  ('Estrela da Esperança', 'estrela-da-esperanca', 'Para iluminar dias difíceis com esperança.', 'presente', '✨', 7.00, 'Incentivo', 'Romanos 15:13', 'O Deus de esperança vos encha de todo o gozo e paz.', 'Não desista — Deus está no controle.', 6),
  ('Coroa da Honra', 'coroa-da-honra', 'Para honrar quem serve com excelência.', 'presente', '👑', 15.00, 'Celebração', 'Tiago 1:12', 'Bem-aventurado o homem que suporta a provação.', 'Você é uma honra para o Reino!', 7),
  ('Escudo da Fé', 'escudo-da-fe', 'Para quem permanece firme na batalha.', 'presente', '🛡️', 10.00, 'Incentivo', 'Efésios 6:16', 'Tomai o escudo da fé.', 'Permaneça firme — a vitória vem!', 8),
  ('Chama da Esperança', 'chama-da-esperanca', 'Para reacender o ânimo de um irmão.', 'presente', '🔥', 7.00, 'Incentivo', 'Romanos 12:11', 'Sede fervorosos no espírito, servindo ao Senhor.', 'Que essa chama nunca se apague!', 9),
  ('Ramo de Oliveira', 'ramo-de-oliveira', 'Símbolo de paz e reconciliação.', 'presente', '🌿', 5.00, 'Amizade', 'Salmos 133:1', 'Quão bom e quão suave é que os irmãos vivam em união.', 'Que a paz reine entre nós.', 10),
  ('Feixe de Trigo', 'feixe-de-trigo', 'Celebrando frutos e colheitas na caminhada.', 'presente', '🌾', 5.00, 'Celebração', 'João 12:24', 'Se o grão de trigo cair na terra e morrer, dá muito fruto.', 'Sua dedicação está dando frutos!', 11),
  ('Luz do Caminho', 'luz-do-caminho', 'Para quem ilumina o caminho de outros.', 'presente', '🕯️', 7.00, 'Incentivo', 'Salmos 119:105', 'Lâmpada para os meus pés é a tua palavra.', 'Sua luz faz diferença!', 12),
  ('Trombeta da Vitória', 'trombeta-da-vitoria', 'Para celebrar uma conquista ou vitória.', 'presente', '🎺', 10.00, 'Celebração', '1 Coríntios 15:57', 'Graças a Deus, que nos dá a vitória por nosso Senhor Jesus Cristo.', 'Celebrando essa vitória com você!', 13),
  ('Globo Missionário', 'globo-missionario', 'Para quem tem coração missionário.', 'presente', '🌍', 12.00, 'Incentivo', 'Marcos 16:15', 'Ide por todo o mundo, pregai o evangelho.', 'O mundo precisa do seu chamado!', 14),
  ('Caixa de Bênçãos', 'caixa-de-bencaos', 'Uma caixa cheia de desejos de bênçãos.', 'presente', '🎁', 20.00, 'Celebração', 'Malaquias 3:10', 'Abrirei as janelas do céu e derramarei bênção sem medida.', 'Que chova bênção na sua vida!', 15),
  ('Cristal da Fidelidade', 'cristal-da-fidelidade', 'Para quem é fiel em todas as estações.', 'presente', '💎', 25.00, 'Celebração', 'Lamentações 3:22-23', 'As suas misericórdias se renovam a cada manhã; grande é a tua fidelidade.', 'Sua fidelidade inspira!', 16)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';

SELECT 'ok' as status;
