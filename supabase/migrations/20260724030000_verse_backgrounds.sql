-- ============================================================
-- Fundos de foto para o compartilhamento de versiculo (sem IA).
-- Admin sobe imagens 9:16 pelo painel; o gerador de imagem do
-- versiculo desenha a foto por tras do texto. Custo de IA zero.
--
-- Rollback:
--   drop table if exists public.verse_backgrounds;
--   delete from storage.buckets where id = 'verse-backgrounds';
--   (policies de storage caem junto ao remover o bucket)
-- ============================================================

-- 1. Bucket publico (leitura livre; escrita so admin via policies abaixo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verse-backgrounds', 'verse-backgrounds', true, 8388608,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- 2. Policies de storage: qualquer um le; so admin escreve/atualiza/apaga
drop policy if exists "Fundos de versiculo sao publicos" on storage.objects;
create policy "Fundos de versiculo sao publicos"
  on storage.objects for select
  using (bucket_id = 'verse-backgrounds');

drop policy if exists "Admins enviam fundos de versiculo" on storage.objects;
create policy "Admins enviam fundos de versiculo"
  on storage.objects for insert
  with check (bucket_id = 'verse-backgrounds' and public.is_admin(auth.uid()));

drop policy if exists "Admins atualizam fundos de versiculo" on storage.objects;
create policy "Admins atualizam fundos de versiculo"
  on storage.objects for update
  using (bucket_id = 'verse-backgrounds' and public.is_admin(auth.uid()));

drop policy if exists "Admins removem fundos de versiculo" on storage.objects;
create policy "Admins removem fundos de versiculo"
  on storage.objects for delete
  using (bucket_id = 'verse-backgrounds' and public.is_admin(auth.uid()));

-- 3. Tabela de catalogo dos fundos (metadados + ativar/desativar + ordem)
create table if not exists public.verse_backgrounds (
  id uuid primary key default gen_random_uuid(),
  name text,
  image_url text not null,
  storage_path text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_verse_bg_active on public.verse_backgrounds (is_active, sort_order);

alter table public.verse_backgrounds enable row level security;

-- Qualquer usuario autenticado le os fundos ATIVOS (para escolher no share);
-- admin ve todos e gerencia.
drop policy if exists "Fundos ativos sao visiveis" on public.verse_backgrounds;
create policy "Fundos ativos sao visiveis"
  on public.verse_backgrounds for select
  using (is_active or public.is_admin(auth.uid()));

drop policy if exists "Admins inserem fundos" on public.verse_backgrounds;
create policy "Admins inserem fundos"
  on public.verse_backgrounds for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins atualizam fundos" on public.verse_backgrounds;
create policy "Admins atualizam fundos"
  on public.verse_backgrounds for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins removem fundos" on public.verse_backgrounds;
create policy "Admins removem fundos"
  on public.verse_backgrounds for delete
  using (public.is_admin(auth.uid()));

-- anon lê (a Bíblia/compartilhamento é público); a policy já limita a
-- só os fundos ativos para quem não é admin.
grant select on public.verse_backgrounds to anon;
grant select, insert, update, delete on public.verse_backgrounds to authenticated;
