-- SEGURANÇA: 4 funções SECURITY DEFINER de MUTAÇÃO estavam executáveis por
-- qualquer cliente sem checar o chamador, e o app NÃO as chama do cliente.
-- O EXECUTE vinha do grant default a PUBLIC — por isso revogamos de PUBLIC
-- (service_role tem grant explícito e mantém; triggers/outras funções usam o
-- dono/definer). Só bloqueia a chamada RPC direta do navegador.
--
-- - unlock_theme: desbloqueava tema (inclui pagos) de graça via rpc.
-- - log_admin_action: permitia forjar entradas de log de admin.
-- - refresh_admin_stats: recomputo caro sob demanda (DoS).
-- - update_user_streak: manipular o próprio streak/ranking.
--
-- Rollback: grant execute on function <assinatura> to public;
revoke execute on function public.unlock_theme(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.log_admin_action(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.refresh_admin_stats() from public, anon, authenticated;
revoke execute on function public.update_user_streak(uuid) from public, anon, authenticated;
