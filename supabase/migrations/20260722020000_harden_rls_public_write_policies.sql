-- =====================================================
-- HARDENING: políticas de escrita abertas a "public" sem
-- restrição de dono (qual/with_check = true).
-- =====================================================
-- Achado da auditoria de segurança: 5 políticas nomeadas
-- "Sistema pode..." estavam com roles={public} e qual/
-- with_check = true, ou seja, QUALQUER usuário autenticado
-- podia inserir/atualizar/apagar linhas de OUTROS usuários
-- nessas tabelas via chamada direta do client (ex: dar a si
-- mesmo um tema pago de graça, inflar o total_points de
-- qualquer pessoa, forjar streak/xp_history).
--
-- O nome "Sistema pode..." sugere que a intenção original era
-- restringir a escritas de backend (service_role), que já
-- ignora RLS por padrão — essas políticas nunca precisaram
-- valer pra role "public". Restringindo pra "só a própria
-- linha" (ou admin, no caso de user_themes) preserva 100% dos
-- fluxos legítimos já existentes no client (confirmado por
-- grep no código: user_stats tem insert/update client-side só
-- da própria linha do usuário; user_themes só tem escrita
-- client-side no painel admin, pra OUTROS usuários; xp_history,
-- user_streaks e user_challenge_progress não têm nenhuma
-- escrita client-side hoje).
-- =====================================================

-- user_stats: cliente só pode inserir/atualizar a própria linha
alter policy "Sistema pode gerenciar user_stats"
  on public.user_stats
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- xp_history: cliente só pode inserir na própria linha
alter policy "Sistema pode inserir histórico de XP"
  on public.xp_history
  with check (user_id = auth.uid());

-- user_streaks: cliente só pode inserir na própria linha
alter policy "Sistema pode inserir streaks"
  on public.user_streaks
  with check (user_id = auth.uid());

-- user_challenge_progress: cliente só pode gerenciar a própria linha
alter policy "Sistema pode gerenciar progresso de desafios"
  on public.user_challenge_progress
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- user_themes: só admin concede tema pra OUTRO usuário via client
-- (painel admin/Themes.tsx) — desbloqueio por compra já usa
-- service_role na edge function, que ignora RLS.
alter policy "Sistema insere temas"
  on public.user_themes
  with check (public.is_admin(auth.uid()));
