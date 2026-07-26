-- SEGURANÇA: bucket chat-media (imagens/áudios de conversas privadas) era
-- público — qualquer um com a URL via o arquivo. Torna privado: o app já
-- exibe via URL assinada temporária (useSignedChatMedia), e o participante
-- autenticado consegue assinar pela policy de SELECT existente. Anônimo perde
-- o acesso (sem endpoint público nem URL assinada).
-- Rollback: update storage.buckets set public=true where id='chat-media';
update storage.buckets set public = false where id = 'chat-media';
