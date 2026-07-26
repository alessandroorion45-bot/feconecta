-- SEGURANÇA: a tabela public.users (id, full_name, email, xp, level...) tinha
-- política de SELECT "USING (true)" para o role public — ou seja, QUALQUER
-- pessoa não logada podia baixar o e-mail de todos os membros (coleta para
-- phishing/spam, risco LGPD).
--
-- Todos os leitores legítimos são autenticados: a busca de presenteado na
-- Kingdom Store e o painel admin. Anônimo não precisa (e não deve) ler nada
-- dessa tabela. Passa a exigir login.
--
-- Aditivo/seguro: nenhuma leitura autenticada existente deixa de funcionar.
-- Rollback: recriar a policy antiga com USING (true) para public.
drop policy if exists "Users can view all profiles" on public.users;

create policy "Authenticated can view users"
  on public.users
  for select
  to authenticated
  using (true);

-- SEGURANÇA 2: chat_rooms.password_hash (hash de senha de salas) estava
-- legível por QUALQUER UM (SELECT USING true, role public) — hash de senha
-- nunca deve ir ao cliente. Chat é recurso autenticado; anônimo não precisa
-- ver sala nenhuma. Exige login (RLS nega o anônimo por completo).
-- A tabela está vazia e o app não lê essa coluna; se a feature de salas com
-- senha for construída, a verificação da senha deve ser SERVER-SIDE
-- (edge function / service_role) e o hash não deve ser exposto a nenhum
-- cliente. O REVOKE abaixo é defesa em profundidade.
-- Rollback: recriar a policy antiga com USING (true) para public.
drop policy if exists "Users can view all rooms for discovery" on public.chat_rooms;

create policy "Authenticated can view rooms"
  on public.chat_rooms
  for select
  to authenticated
  using (true);

revoke select (password_hash) on public.chat_rooms from anon, authenticated;
