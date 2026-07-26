-- SEGURANÇA: fecha a leitura de e-mail de OUTROS usuários por qualquer logado.
-- Antes: authenticated lia a tabela users inteira (com email). Agora: usuário
-- comum só lê a PRÓPRIA linha; admin lê tudo (painel). A busca de presenteado
-- passou a ser server-side (edge function search-gift-recipient) e não lê mais
-- users direto. Painel admin continua (is_admin passa).
-- Rollback: recriar policy "Authenticated can view users" com USING(true).
drop policy if exists "Authenticated can view users" on public.users;

create policy "Own row or admin can view users"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id or is_admin(auth.uid()));
