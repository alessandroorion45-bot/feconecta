-- ============================================================
-- BLOCO 1 — Sistema Anti-Link
-- Bloqueia links externos em posts, comentários, comentários de
-- versículo e mensagens de chat. Validação no SERVIDOR (triggers),
-- registro de violações e advertência automática na reincidência.
--
-- Rollback completo:
--   drop trigger if exists block_links_posts on public.posts;
--   drop trigger if exists block_links_post_comments on public.post_comments;
--   drop trigger if exists block_links_verse_comments on public.verse_comments;
--   drop trigger if exists block_links_messages on public.messages;
--   drop function if exists public.block_external_links_tg();
--   drop function if exists public.register_link_violation(text, text);
--   drop function if exists public.contains_external_link(text);
--   drop table if exists public.link_violations;
-- ============================================================

-- 1. Tabela de violações
create table if not exists public.link_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content_original text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_link_violations_user on public.link_violations (user_id, created_at desc);
create index if not exists idx_link_violations_created on public.link_violations (created_at desc);

alter table public.link_violations enable row level security;

-- Só admins leem (mesmo padrão das views admin_*); ninguém escreve direto
-- (escrita só via funções SECURITY DEFINER abaixo)
drop policy if exists "Admins podem ver violacoes" on public.link_violations;
create policy "Admins podem ver violacoes"
  on public.link_violations for select
  using (public.is_admin(auth.uid()));

revoke all on public.link_violations from anon, authenticated, public;
grant select on public.link_violations to authenticated;

-- 2. Detecção de link externo (compartilhada por trigger e client-mirror)
--    Cobre: http/https, hxxp (ofuscação), www., dominio.tld,
--    "dominio .tld" (espaço antes do ponto, sem espaço depois — não pega
--    frase normal tipo "é bom. Com certeza"), "dominio[.]tld", "(dot)"/"(ponto)".
create or replace function public.contains_external_link(p_text text)
returns boolean
language sql
immutable
as $$
  select p_text is not null and (
    p_text ~* 'https?://'
    or p_text ~* 'hxxps?'
    or p_text ~* '\mwww\s*[\.\[]'
    or p_text ~* '[a-z0-9-]+(\.|\s+\.)(com|net|org|io|me|ly|app|site|online|xyz|info|club|shop|store|live|link|click|cc|tv|gg|to|co|br)(\.[a-z]{2})?\M'
    or p_text ~* '[a-z0-9-]+\s*(\[\.\]|\(dot\)|\(ponto\))\s*[a-z]{2,}'
  );
$$;

-- 3. Registro de violação + advertência automática na reincidência.
--    Chamada pelo client quando bloqueia localmente; a mesma tabela também
--    recebe registros dos triggers (tentativas que burlaram o client).
--    Política de reincidência: na 3ª violação, advertência automática via
--    user_punishments (mesmo mecanismo do warn_user), uma única vez.
create or replace function public.register_link_violation(p_content text, p_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
  v_warned boolean := false;
  v_admin uuid;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.link_violations (user_id, content_original, content_type)
  values (v_uid, left(coalesce(p_content, ''), 2000), left(coalesce(p_type, 'desconhecido'), 40));

  select count(*) into v_count from public.link_violations where user_id = v_uid;

  if v_count >= 3 and not exists (
    select 1 from public.user_punishments
    where user_id = v_uid
      and punishment_type = 'warning'
      and reason like 'Anti-link:%'
  ) then
    select ur.user_id into v_admin from public.user_roles ur where ur.role = 'super_admin' limit 1;

    insert into public.user_punishments (user_id, punishment_type, reason, issued_by)
    values (
      v_uid,
      'warning',
      'Anti-link: ' || v_count || ' tentativas de compartilhar links externos — advertência automática do sistema',
      coalesce(v_admin, v_uid)
    );

    insert into public.notifications (user_id, type, content)
    values (
      v_uid,
      'admin_warning',
      '⚠️ Advertência automática: por segurança da comunidade, não é permitido compartilhar links externos. Novas tentativas podem gerar punições maiores.'
    );

    v_warned := true;
  end if;

  return jsonb_build_object('count', v_count, 'warned', v_warned);
end;
$$;

revoke all on function public.register_link_violation(text, text) from public, anon;
grant execute on function public.register_link_violation(text, text) to authenticated;

-- 4. Defesa server-side: triggers nas 4 tabelas de conteúdo.
--    Quem burlar a validação do client tem a linha SILENCIOSAMENTE
--    descartada (return null) e a violação registrada mesmo assim —
--    um RAISE desfaria a transação inteira, incluindo o próprio log.
--    Admins são isentos (podem publicar links oficiais).
create or replace function public.block_external_links_tg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_text text;
  v_author uuid;
  v_type text;
begin
  if tg_table_name = 'verse_comments' then
    v_text := new.comment_text;
  else
    v_text := new.content;
  end if;

  if tg_table_name = 'messages' then
    v_author := new.sender_id;
  else
    v_author := new.user_id;
  end if;

  if v_text is null or v_author is null or not public.contains_external_link(v_text) then
    return new;
  end if;

  if public.is_admin(v_author) then
    return new;
  end if;

  v_type := case tg_table_name
    when 'posts' then 'post'
    when 'post_comments' then 'comentario'
    when 'verse_comments' then 'comentario_versiculo'
    else 'mensagem'
  end;

  insert into public.link_violations (user_id, content_original, content_type)
  values (v_author, left(v_text, 2000), v_type || ' (burlou o client)');

  return null;
end;
$$;

drop trigger if exists block_links_posts on public.posts;
create trigger block_links_posts
  before insert on public.posts
  for each row execute function public.block_external_links_tg();

drop trigger if exists block_links_post_comments on public.post_comments;
create trigger block_links_post_comments
  before insert on public.post_comments
  for each row execute function public.block_external_links_tg();

drop trigger if exists block_links_verse_comments on public.verse_comments;
create trigger block_links_verse_comments
  before insert on public.verse_comments
  for each row execute function public.block_external_links_tg();

drop trigger if exists block_links_messages on public.messages;
create trigger block_links_messages
  before insert on public.messages
  for each row execute function public.block_external_links_tg();
