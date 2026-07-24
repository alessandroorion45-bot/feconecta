-- Rate limiting server-side pras funções de IA (evita abuso/custo).
-- Tabela de eventos + função reutilizável chamada pelas edge functions
-- (via service_role). Puramente defensivo — nenhum dado de usuário.
--
-- Rollback:
--   drop function if exists public.check_ai_rate_limit(uuid, text, int, int);
--   drop table if exists public.rate_limit_events;

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_rate_limit_lookup on public.rate_limit_events (user_id, action, created_at desc);

alter table public.rate_limit_events enable row level security;
-- Sem policy = ninguém (anon/authenticated) acessa; só service_role (edge fn).
revoke all on public.rate_limit_events from anon, authenticated, public;

-- Retorna TRUE se a chamada é permitida (e registra o evento), FALSE se
-- o usuário estourou o limite na janela. Também limpa eventos antigos do
-- próprio usuário/ação (mantém a tabela enxuta sem cron).
create or replace function public.check_ai_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_user_id is null then
    return false;
  end if;

  -- limpa eventos fora de qualquer janela relevante (mais de 1 dia)
  delete from public.rate_limit_events
   where user_id = p_user_id and action = p_action
     and created_at < now() - interval '1 day';

  select count(*) into v_count
    from public.rate_limit_events
   where user_id = p_user_id
     and action = p_action
     and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_events (user_id, action) values (p_user_id, p_action);
  return true;
end;
$$;

revoke all on function public.check_ai_rate_limit(uuid, text, int, int) from anon, authenticated, public;
grant execute on function public.check_ai_rate_limit(uuid, text, int, int) to service_role;
