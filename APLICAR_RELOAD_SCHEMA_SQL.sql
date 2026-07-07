-- Força o PostgREST a recarregar o cache do schema.
-- Necessário depois de alterações em massa em tabelas (como user_videos)
-- quando colunas que já existem no banco aparecem como "not found" no
-- erro PGRST204 do lado do app.
NOTIFY pgrst, 'reload schema';
