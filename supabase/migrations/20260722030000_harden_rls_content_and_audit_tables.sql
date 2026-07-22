-- =====================================================
-- HARDENING (parte 2): mais 4 políticas roles={public},
-- qual/with_check = true, sem nenhum uso de escrita
-- client-side no código (confirmado por grep) e sem
-- trigger que dependa de RLS permissivo (os triggers
-- relevantes são SECURITY DEFINER, então ignoram RLS de
-- qualquer forma — restringir aqui não quebra nada).
--
-- bible_books / bible_verses: achado mais grave da
-- auditoria — QUALQUER usuário logado podia apagar ou
-- adulterar o texto bíblico inteiro do app via chamada
-- direta do client. Não existe tela de administração de
-- Bíblia no app (conteúdo é só seedado via migration).
--
-- prayer_group_stats: contadores agregados por grupo de
-- oração, mantidos por trigger SECURITY DEFINER
-- (update_group_prayer_stats, já ignora RLS).
--
-- security_audit_logs: tabela de auditoria não referenciada
-- em nenhum lugar do código hoje (nem client nem edge
-- function) — política aberta permitia qualquer usuário
-- forjar/poluir o próprio rastro de auditoria.
-- =====================================================

alter policy "Allow insert bible books" on public.bible_books
  with check (public.is_admin(auth.uid()));

alter policy "Allow delete bible books" on public.bible_books
  using (public.is_admin(auth.uid()));

alter policy "Allow insert bible verses" on public.bible_verses
  with check (public.is_admin(auth.uid()));

alter policy "Allow delete bible verses" on public.bible_verses
  using (public.is_admin(auth.uid()));

alter policy "System can update stats" on public.prayer_group_stats
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

alter policy "System can insert audit logs" on public.security_audit_logs
  with check (public.is_admin(auth.uid()));
