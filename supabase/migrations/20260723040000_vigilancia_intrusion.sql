-- ============================================================
-- BLOCO 2 — Olho da Vigilância (detecção de invasão de conta)
-- Tabelas de tentativas de login falho e de tentativas de invasão,
-- com view admin e RLS. O registro/notificação/geolocalização é feito
-- pela edge function record-login-failure (que roda como service_role).
--
-- Rollback:
--   drop view if exists public.admin_intrusion_attempts;
--   drop table if exists public.intrusion_attempts;
--   drop table if exists public.failed_login_attempts;
-- ============================================================

-- Tentativas de login falho (contador por e-mail/IP numa janela curta).
-- Escrita só via edge function (service_role); ninguém lê pelo client.
create table if not exists public.failed_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_failed_login_email_time on public.failed_login_attempts (lower(email), created_at desc);
create index if not exists idx_failed_login_time on public.failed_login_attempts (created_at desc);

alter table public.failed_login_attempts enable row level security;
-- Sem policy = ninguém (anon/authenticated) lê ou escreve; só service_role,
-- que ignora RLS. Isso é intencional: dados sensíveis de tentativa de login.
revoke all on public.failed_login_attempts from anon, authenticated, public;

-- Tentativas de invasão consolidadas (o que aparece no painel).
create table if not exists public.intrusion_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text,
  localizacao_aproximada text,
  conta_alvo_id uuid,
  conta_alvo_email text,
  tipo_tentativa text not null,
  user_agent text,
  tentativas int not null default 1,
  resolvido boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_intrusion_created on public.intrusion_attempts (created_at desc);
create index if not exists idx_intrusion_ip on public.intrusion_attempts (ip);
create index if not exists idx_intrusion_target on public.intrusion_attempts (conta_alvo_id);

alter table public.intrusion_attempts enable row level security;
-- Só admin lê (via view abaixo); escrita só service_role (edge function).
revoke all on public.intrusion_attempts from anon, authenticated, public;

drop policy if exists "Admins veem tentativas de invasao" on public.intrusion_attempts;
create policy "Admins veem tentativas de invasao"
  on public.intrusion_attempts for select
  using (public.is_admin(auth.uid()));
grant select on public.intrusion_attempts to authenticated;

-- Admin pode marcar como resolvido
drop policy if exists "Admins resolvem tentativas" on public.intrusion_attempts;
create policy "Admins resolvem tentativas"
  on public.intrusion_attempts for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
grant update on public.intrusion_attempts to authenticated;

-- View admin: mesma tabela + nome do dono da conta-alvo.
create or replace view public.admin_intrusion_attempts as
select
  ia.id,
  ia.ip,
  ia.localizacao_aproximada,
  ia.conta_alvo_id,
  ia.conta_alvo_email,
  u.full_name as conta_alvo_nome,
  ia.tipo_tentativa,
  ia.user_agent,
  ia.tentativas,
  ia.resolvido,
  ia.created_at
from public.intrusion_attempts ia
left join public.users u on u.id = ia.conta_alvo_id
where public.is_admin(auth.uid())
order by ia.created_at desc;

revoke all on public.admin_intrusion_attempts from anon, public;
grant select on public.admin_intrusion_attempts to authenticated;
