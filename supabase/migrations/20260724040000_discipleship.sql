-- Discipulado real: cada membro pode ter um discipulador (outra pessoa
-- da mesma comunidade). Campo aditivo e nulo — nao quebra nada.
-- A RLS de UPDATE ja existente ("Leaders can manage member roles" e
-- "Users can leave communities") cobre a escrita: lideres editam
-- qualquer membro; o proprio usuario edita a sua linha.
--
-- Rollback:
--   alter table public.church_community_members drop column if exists discipler_user_id;
alter table public.church_community_members
  add column if not exists discipler_user_id uuid;

create index if not exists idx_ccm_discipler
  on public.church_community_members (community_id, discipler_user_id);
