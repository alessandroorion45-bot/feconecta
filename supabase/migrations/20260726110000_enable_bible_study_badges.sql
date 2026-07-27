-- Agora que o app registra a leitura (bible_reading_progress) e a engine conta
-- de lá, liga os selos de leitura bíblica.
update public.badges
set automatico = true
where status = 'active'
  and unlock_criteria->>'type' = 'action_count'
  and unlock_criteria->>'action' = 'bible_study';
