-- GAMIFICAÇÃO DOS SELOS — Fase 1
-- A engine check_and_award_kingdom_badges() já existia com trigger em user_stats,
-- mas NENHUM selo estava marcado automatico=true, então ela nunca concedia nada.
-- Ligamos os selos cujos critérios a engine SABE avaliar E cujos dados estão
-- realmente sendo alimentados no user_stats: total_xp (-> total_points) e
-- streak (-> current_streak).
-- Os selos de action_count (leitura/oração/testemunho/eventos) NÃO são ligados
-- ainda porque esses contadores estão zerados pra todos (não alimentados) —
-- ligá-los prometeria algo que nunca desbloquearia. Ficam pra Fase 2.
--
-- Rollback: update public.badges set automatico=false where unlock_criteria->>'type' in ('total_xp','streak');
update public.badges
set automatico = true
where status = 'active'
  and unlock_criteria->>'type' in ('total_xp', 'streak');
