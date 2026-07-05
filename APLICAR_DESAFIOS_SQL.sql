-- =============================================
-- DESAFIOS ESPIRITUAIS — Correções e semeadura
-- 1) Políticas RLS (corrige 400/404/406 na página Desafios)
-- 2) Semeia 365 dias de desafios diários (9 categorias, ciclo sem
--    repetição em dias consecutivos; não sobrescreve dias existentes)
-- 3) Desafios temporários (semanais/mensais) na aba Temporários
-- =============================================

-- ---------------------------------------------
-- 1. Políticas
-- ---------------------------------------------
ALTER TABLE public.daily_biblical_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view daily challenges" ON public.daily_biblical_challenges;
CREATE POLICY "Anyone can view daily challenges"
ON public.daily_biblical_challenges FOR SELECT
USING (true);

-- Fallback do app: se faltar o desafio do dia, o cliente insere um
DROP POLICY IF EXISTS "Authenticated can seed daily challenge" ON public.daily_biblical_challenges;
CREATE POLICY "Authenticated can seed daily challenge"
ON public.daily_biblical_challenges FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own completions" ON public.daily_challenge_completions;
CREATE POLICY "Users can view own completions"
ON public.daily_challenge_completions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can complete challenges" ON public.daily_challenge_completions;
CREATE POLICY "Users can complete challenges"
ON public.daily_challenge_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
CREATE POLICY "Anyone can view challenges"
ON public.challenges FOR SELECT
USING (true);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own challenge progress" ON public.user_challenges;
CREATE POLICY "Users view own challenge progress"
ON public.user_challenges FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own challenge progress" ON public.user_challenges;
CREATE POLICY "Users insert own challenge progress"
ON public.user_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own challenge progress" ON public.user_challenges;
CREATE POLICY "Users update own challenge progress"
ON public.user_challenges FOR UPDATE
USING (auth.uid() = user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view badges" ON public.user_badges;
CREATE POLICY "Anyone can view badges"
ON public.user_badges FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users earn own badges" ON public.user_badges;
CREATE POLICY "Users earn own badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stats are viewable" ON public.user_stats;
CREATE POLICY "Stats are viewable"
ON public.user_stats FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users insert own stats" ON public.user_stats;
CREATE POLICY "Users insert own stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own stats" ON public.user_stats;
CREATE POLICY "Users update own stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 2. Semeia 365 dias de desafios diários
-- ---------------------------------------------
WITH bank AS (
  SELECT row_number() OVER () - 1 AS idx, *
  FROM (VALUES
    ('leitura',       '📖 Leia um capítulo de Provérbios e anote um conselho para hoje.', 'Lâmpada para os meus pés é a tua palavra. — Salmos 119:105', 'facil', 10),
    ('oracao',        '🙏 Ore em silêncio por cinco minutos, apenas ouvindo a Deus.', 'Aquietai-vos e sabei que eu sou Deus. — Salmos 46:10', 'facil', 10),
    ('quiz',          '🧠 Complete um Quiz Bíblico hoje e teste seus conhecimentos.', 'Examinais as Escrituras... — João 5:39', 'medio', 15),
    ('gratidao',      '🌻 Escreva três motivos de gratidão no Mural da Gratidão.', 'Em tudo dai graças. — 1 Tessalonicenses 5:18', 'facil', 10),
    ('leitura',       '📖 Leia um Salmo e destaque o versículo que mais falou ao seu coração.', 'A tua palavra é a verdade. — João 17:17', 'facil', 10),
    ('comunidade',    '🤝 Comente uma publicação de um irmão com uma palavra de incentivo.', 'Edificai-vos uns aos outros. — 1 Tessalonicenses 5:11', 'facil', 10),
    ('caca_palavras', '🔍 Complete um caça-palavras bíblico no Palavra Viva.', 'Buscai e achareis. — Mateus 7:7', 'medio', 15),
    ('oracao',        '🙏 Ore por cada membro da sua família, um por um.', 'Eu e a minha casa serviremos ao Senhor. — Josué 24:15', 'facil', 10),
    ('evangelismo',   '✝️ Compartilhe um versículo com alguém que precisa de esperança.', 'Ide por todo o mundo... — Marcos 16:15', 'medio', 20),
    ('leitura',       '📖 Leia João 3 inteiro e medite no amor de Deus.', 'Porque Deus amou o mundo de tal maneira... — João 3:16', 'medio', 15),
    ('estudo',        '📚 Leia um Estudo Bíblico completo na plataforma.', 'Procura apresentar-te a Deus aprovado. — 2 Timóteo 2:15', 'medio', 15),
    ('oracao',        '🙏 Ore pelos enfermos que você conhece, citando cada nome.', 'A oração da fé salvará o doente. — Tiago 5:15', 'facil', 10),
    ('comunidade',    '❤️ Publique um testemunho do que Deus fez na sua vida.', 'Eles o venceram pela palavra do seu testemunho. — Apocalipse 12:11', 'medio', 20),
    ('leitura',       '📖 Leia Romanos 8 e escreva o que mais tocou você.', 'Nada nos separará do amor de Deus. — Romanos 8:39', 'medio', 15),
    ('igreja',        '⛪ Registre presença no Mural da sua comunidade com uma saudação.', 'Não deixemos de congregar-nos. — Hebreus 10:25', 'facil', 10),
    ('oracao',        '🙏 Agradeça a Deus por cinco bênçãos específicas de hoje.', 'Bendize, ó minha alma, ao Senhor. — Salmos 103:2', 'facil', 10),
    ('quiz',          '🧠 Acerte pelo menos 5 perguntas no Quiz Bíblico.', 'O temor do Senhor é o princípio da sabedoria. — Provérbios 9:10', 'medio', 15),
    ('gratidao',      '🌻 Agradeça pessoalmente a alguém que abençoou sua vida.', 'A gratidão transforma o coração.', 'facil', 10),
    ('leitura',       '📖 Leia 5 versículos consecutivos e escreva uma breve reflexão.', 'Medita nestas coisas. — 1 Timóteo 4:15', 'facil', 10),
    ('oracao',        '🙏 Ore pela sua igreja e pelos seus líderes.', 'Orai uns pelos outros. — Tiago 5:16', 'facil', 10),
    ('comunidade',    '🙏 Interceda por um pedido de oração de outro irmão hoje.', 'Levai as cargas uns dos outros. — Gálatas 6:2', 'facil', 15),
    ('caca_palavras', '🔍 Complete um caça-palavras sobre os Evangelhos.', 'As tuas palavras foram achadas, e eu as comi. — Jeremias 15:16', 'medio', 15),
    ('evangelismo',   '✝️ Convide um amigo para conhecer a plataforma Aliança.', 'Vinde, e vede. — João 1:39', 'medio', 20),
    ('leitura',       '📖 Leia um capítulo dos Evangelhos e imagine a cena.', 'E o Verbo se fez carne. — João 1:14', 'facil', 10),
    ('oracao',        '🙏 Ore pelos missionários que levam a Palavra pelo mundo.', 'Rogai ao Senhor da seara. — Mateus 9:38', 'facil', 10),
    ('estudo',        '📚 Leia um devocional e aplique a sugestão prática dele hoje.', 'Sede cumpridores da palavra. — Tiago 1:22', 'facil', 10),
    ('comunidade',    '🌱 Dê boas-vindas a um novo membro ou dê Amém em 3 publicações.', 'Recebei-vos uns aos outros. — Romanos 15:7', 'facil', 10),
    ('oracao',        '🙏 Ore por alguém que ainda não conhece Jesus.', 'Não quer que nenhum se perca. — 2 Pedro 3:9', 'facil', 10),
    ('leitura',       '📖 Leia Filipenses 4 e escolha um versículo para decorar.', 'Tudo posso naquele que me fortalece. — Filipenses 4:13', 'medio', 15),
    ('gratidao',      '🌻 Compartilhe no Feed um versículo que fortaleceu sua fé.', 'Fortalecei-vos no Senhor. — Efésios 6:10', 'facil', 10),
    ('quiz',          '🧠 Complete um quiz sobre as Parábolas de Jesus.', 'Quem tem ouvidos para ouvir, ouça. — Mateus 13:9', 'medio', 15),
    ('oracao',        '🙏 Faça uma pausa no meio do dia para uma oração de gratidão.', 'Orai sem cessar. — 1 Tessalonicenses 5:17', 'facil', 10),
    ('evangelismo',   '✝️ Escreva uma mensagem de esperança para alguém em dificuldades.', 'Consolai-vos uns aos outros. — 1 Tessalonicenses 4:18', 'medio', 15),
    ('leitura',       '📖 Leia o Salmo 91 em voz alta, declarando cada promessa.', 'Direi do Senhor: Ele é o meu refúgio. — Salmos 91:2', 'facil', 10),
    ('igreja',        '⛪ Participe (ou registre seu dia) de uma campanha da comunidade.', 'Melhor é serem dois do que um. — Eclesiastes 4:9', 'medio', 15),
    ('leitura',       '📖 Entre em uma Leitura Compartilhada ou crie uma sala com amigos.', 'Onde dois ou três estiverem reunidos... — Mateus 18:20', 'medio', 20)
  ) AS t(category, challenge_text, motivational_quote, difficulty_level, points_reward)
),
days AS (SELECT generate_series(0, 364) AS d)
INSERT INTO public.daily_biblical_challenges
  (challenge_date, category, challenge_text, motivational_quote, difficulty_level, points_reward)
SELECT
  CURRENT_DATE + days.d,
  b.category, b.challenge_text, b.motivational_quote, b.difficulty_level, b.points_reward
FROM days
JOIN bank b
  ON b.idx = (
    (EXTRACT(EPOCH FROM (CURRENT_DATE + days.d)::timestamp)::bigint / 86400)
    % (SELECT COUNT(*) FROM bank)
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.daily_biblical_challenges dc
  WHERE dc.challenge_date = CURRENT_DATE + days.d
);

-- ---------------------------------------------
-- 3. Desafios temporários (semanais e mensais)
-- ---------------------------------------------
INSERT INTO public.challenges
  (title, description, icon, challenge_type, requirement_type, requirement_value, points_reward, badge_reward, start_date, end_date, is_active)
SELECT * FROM (VALUES
  ('Semana da Palavra', 'Complete 5 desafios diários nesta semana.', '📖', 'weekly', 'daily_challenges', 5, 50, 'Leitor Dedicado', NOW(), NOW() + INTERVAL '7 days', true),
  ('Guerreiro de Oração', 'Publique ou interceda em 7 pedidos de oração.', '🙏', 'weekly', 'prayers', 7, 60, 'Homem de Oração', NOW(), NOW() + INTERVAL '7 days', true),
  ('Comunhão Viva', 'Participe de uma Leitura Compartilhada nesta semana.', '👥', 'weekly', 'shared_reading', 1, 40, NULL, NOW(), NOW() + INTERVAL '7 days', true),
  ('Mês dos Evangelhos', 'Leia os quatro Evangelhos neste mês.', '✝️', 'monthly', 'bible_chapters', 89, 300, 'Embaixador da Palavra', NOW(), NOW() + INTERVAL '30 days', true),
  ('30 Dias de Constância', 'Complete 30 desafios diários neste mês.', '🔥', 'monthly', 'daily_challenges', 30, 200, 'Servo Perseverante', NOW(), NOW() + INTERVAL '30 days', true),
  ('Discípulo em Crescimento', 'Conclua 10 estudos bíblicos neste mês.', '🌿', 'monthly', 'studies', 10, 150, 'Crescendo na Fé', NOW(), NOW() + INTERVAL '30 days', true)
) AS v(title, description, icon, challenge_type, requirement_type, requirement_value, points_reward, badge_reward, start_date, end_date, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenges c
  WHERE c.title = v.title AND c.end_date > NOW()
);
