-- Estatísticas públicas da Landing Page (visitante não autenticado).
-- SECURITY DEFINER: contorna a RLS de "prayers"/"testimonies" (hoje
-- restritas a authenticated) só pra devolver 4 totais agregados —
-- nenhuma linha, nenhum dado individual, nenhuma tabela fica exposta.
-- "membros" conta profiles (já é SELECT público); "versiculos" conta
-- bible_verses (já é SELECT público).
create or replace function public.get_landing_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'versiculos', (select count(*) from public.bible_verses),
    'oracoes', (select count(*) from public.prayers),
    'testemunhos', (select count(*) from public.testimonies),
    'membros', (select count(*) from public.profiles)
  );
$$;

revoke all on function public.get_landing_stats() from public;
grant execute on function public.get_landing_stats() to anon, authenticated;
