-- View admin das violações de link: junta a violação com nome/e-mail do
-- usuário e o total de tentativas dele. Mesmo padrão das demais views
-- admin_* (filtro is_admin embutido + só authenticated SELECT, nada pra anon).
--
-- Rollback: drop view if exists public.admin_link_violations;
create or replace view public.admin_link_violations as
select
  lv.id,
  lv.user_id,
  u.email as user_email,
  u.full_name as user_name,
  lv.content_original,
  lv.content_type,
  lv.created_at,
  (select count(*) from public.link_violations lv2 where lv2.user_id = lv.user_id) as total_violacoes_usuario
from public.link_violations lv
left join public.users u on u.id = lv.user_id
where public.is_admin(auth.uid())
order by lv.created_at desc;

revoke all on public.admin_link_violations from anon, public;
grant select on public.admin_link_violations to authenticated;
