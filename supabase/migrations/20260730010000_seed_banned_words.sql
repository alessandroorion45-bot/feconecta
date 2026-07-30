-- ============================================================
-- MODERAÇÃO: lista de palavrões / xingamentos (pt-BR + alguns en)
-- ============================================================
-- Filtro compara por trecho (LIKE %word%) OU por regex (pattern).
-- Termos distintos vão como 'word' (baixo risco de falso positivo).
-- Termos curtos que "grudam" em palavras normais (cu→curso, puta→
-- disputa) vão como PADRÃO com limite de palavra (\y…\y), pegando só
-- quando isolados. auto_action='flag' = marca pra revisão (não bloqueia
-- conteúdo legítimo por engano). Idempotente. Ajustável na tela do admin.
-- ============================================================

-- 1) Palavras distintas (match por trecho)
INSERT INTO public.banned_words (word, severity, auto_action, is_active)
SELECT v.word, v.severity, 'flag', true
FROM (VALUES
  ('caralho','high'), ('carai','medium'), ('caraio','medium'),
  ('buceta','high'), ('boceta','high'), ('bucetao','high'),
  ('porra','medium'), ('poha','medium'),
  ('merda','medium'), ('bosta','medium'),
  ('cacete','medium'),
  ('foder','high'), ('foda-se','high'), ('fodase','high'), ('fodido','medium'), ('fudido','medium'), ('fudeu','medium'),
  ('punheta','medium'), ('punheteiro','medium'),
  ('cuzao','high'), ('cuzão','high'), ('cuzudo','high'),
  ('arrombado','high'), ('arrombada','high'), ('arrombadu','high'),
  ('desgracado','high'), ('desgraçado','high'), ('desgraçada','high'), ('desgracada','high'),
  ('corno','medium'), ('corna','medium'), ('chifrudo','medium'), ('corno manso','medium'),
  ('vagabunda','high'), ('vagabundo','medium'),
  ('piranha','high'), ('vadia','high'), ('vadio','medium'), ('prostituta','high'),
  ('safado','medium'), ('safada','medium'),
  ('otario','medium'), ('otário','medium'), ('otaria','medium'),
  ('idiota','medium'), ('imbecil','medium'), ('babaca','medium'), ('escroto','medium'), ('escrota','medium'),
  ('pilantra','medium'), ('canalha','medium'), ('retardado','high'), ('retardada','high'),
  ('xoxota','high'), ('xereca','high'), ('rola dura','high'),
  ('putaria','medium'), ('puteiro','high'), ('putona','high'),
  ('filho da puta','high'), ('filha da puta','high'), ('fdp','high'),
  ('vai tomar no cu','high'), ('toma no cu','high'), ('vai se fuder','high'), ('vai se foder','high'),
  ('vtnc','high'), ('pqp','medium'), ('vsf','medium'),
  ('viado','high'), ('viadinho','high'), ('viadão','high'), ('viadao','high'),
  ('bicha','high'), ('boiola','high'), ('sapatao','high'), ('sapatão','high'), ('traveco','high'),
  ('burro','low'), ('jumento','low'), ('nojento','low'), ('verme','low'), ('lixo humano','medium'),
  ('fuck','high'), ('fucker','high'), ('motherfucker','high'), ('shit','medium'),
  ('bitch','high'), ('asshole','high'), ('cunt','high'), ('whore','high'), ('dumbass','medium')
) AS v(word, severity)
WHERE NOT EXISTS (
  SELECT 1 FROM public.banned_words b WHERE lower(b.word) = lower(v.word)
);

-- 2) Termos curtos/perigosos: só quando isolados (limite de palavra)
INSERT INTO public.banned_words (word, severity, auto_action, is_active, pattern)
SELECT v.word, v.severity, 'flag', true, v.pattern
FROM (VALUES
  ('cu (isolado)',   'high',   '\y(cu|cus)\y'),
  ('puta (isolado)', 'high',   '\y(puta|putas|puto|putos)\y'),
  ('pau (isolado)',  'medium', '\y(pau)\y'),
  ('rola (isolado)', 'medium', '\y(rola|rolas)\y'),
  ('pinto (isolado)','low',    '\y(pinto|pintos)\y'),
  ('saco (isolado)', 'low',    '\y(saco)\y')
) AS v(word, severity, pattern)
WHERE NOT EXISTS (
  SELECT 1 FROM public.banned_words b WHERE b.pattern = v.pattern
);

SELECT 'ok' AS status, count(*) AS total_palavras FROM public.banned_words;
