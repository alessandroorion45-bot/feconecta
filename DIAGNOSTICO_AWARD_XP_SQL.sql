-- ============================================================
-- DIAGNÓSTICO: por que award_xp() está retornando erro 400?
-- Este script é SEGURO: roda dentro de uma transação e faz
-- ROLLBACK no final, então NÃO concede XP de verdade nem altera
-- nada — só revela a mensagem de erro exata do Postgres.
--
-- Rode isso no SQL Editor do Supabase e me mande o resultado
-- (a mensagem que aparecer, seja sucesso ou erro).
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_test_user UUID;
BEGIN
  SELECT id INTO v_test_user FROM auth.users ORDER BY created_at DESC LIMIT 1;
  RAISE NOTICE 'Usando user_id de teste: %', v_test_user;
END $$;

SELECT *
FROM public.award_xp(
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
  'word_search_completed',
  '{"level": 1, "theme": "criacao", "score": 100}'::jsonb
);

ROLLBACK;

-- ============================================================
-- Se a query acima der erro, a mensagem de erro do Postgres
-- (em vermelho, na aba de resultados) é exatamente o que preciso.
-- Se der certo e mostrar uma linha com xp_earned/total_xp/etc,
-- então o problema é outra coisa (ex: sessão expirada no app,
-- ou o app enviando um p_user_id inválido) — me avisa também.
-- ============================================================
