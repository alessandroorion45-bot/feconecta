-- Chat em tempo real: a tabela messages nunca esteve na publication
-- supabase_realtime (conversations/message_receipts/typing_indicators
-- estavam, mas justamente a de mensagens ficou de fora) — por isso as
-- assinaturas postgres_changes do chat nunca recebiam nada e mensagem
-- nova só aparecia com refresh manual.
--
-- A entrega continua protegida pela RLS de messages (SELECT exige
-- auth.uid() = sender_id ou receiver_id): o Realtime só entrega cada
-- linha a quem passa na policy — ninguém recebe mensagem dos outros.
--
-- Rollback: ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
