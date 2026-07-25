-- O check de role em church_community_members so permitia admin/moderator/
-- member, mas o app inteiro (COMMUNITY_ROLES, tiers da arvore, filtros)
-- referencia cargos ricos (pastor, presbitero, diacono, lider de
-- ministerio, etc.) que nunca podiam ser salvos. Expande o constraint
-- pra aceitar todos os cargos que a interface ja usa.
-- Aditivo e seguro: nada que era valido deixa de ser.
--
-- Rollback: recriar o check antigo com ARRAY['admin','moderator','member'].
alter table public.church_community_members
  drop constraint if exists church_community_members_role_check;

alter table public.church_community_members
  add constraint church_community_members_role_check
  check (role = any (array[
    'admin','pastor','pastora','lider_geral','presbitero','diacono',
    'diaconisa','lider_ministerio','professor_ebd','musico','vocalista',
    'intercessor','evangelista','missionario','secretario','moderador',
    'moderator','member','visitor'
  ]));
