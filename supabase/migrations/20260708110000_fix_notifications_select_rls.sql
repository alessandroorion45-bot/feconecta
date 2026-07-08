-- ============================================================
-- FIX: usuários não conseguiam ler suas próprias notificações.
-- Confirmado direto na API: com o token real de um usuário (RLS
-- aplicada), SELECT em public.notifications retornava vazio mesmo
-- com linhas existentes pra ele (confirmado via service_role, que
-- ignora RLS). A migration 20260316164719 derrubou uma policy
-- chamada "Users receive their own notifications" que, pelo nome,
-- provavelmente era a policy de SELECT real em produção (diferente
-- do nome no texto da migration original de criação da tabela,
-- "Users can view their own notifications") — e nunca recriou uma
-- policy de SELECT no lugar, só uma nova de INSERT.
-- Resultado: desde 16/03, ninguém via nenhuma notificação histórica
-- ao abrir o sino (só as que chegassem ao vivo via Realtime enquanto
-- a pessoa estava com a página aberta, que não passa por RLS).
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users receive their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

SELECT 'ok' as status;
