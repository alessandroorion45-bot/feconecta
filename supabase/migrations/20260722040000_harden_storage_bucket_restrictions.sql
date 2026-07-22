-- =====================================================
-- HARDENING (parte 3): 4 buckets do Storage sem nenhuma
-- restrição server-side de tipo/tamanho de arquivo
-- (allowed_mime_types e file_size_limit ambos null) —
-- qualquer usuário autenticado podia enviar QUALQUER
-- arquivo, de QUALQUER tamanho, chamando o storage direto
-- (client só valida no formulário, sem enforcement real).
--
-- Restrições escolhidas com base no que cada bucket
-- realmente recebe hoje (confirmado por grep no código):
-- chat-media = imagens + áudio de voz do chat; community-
-- photos = imagens de eventos/células/mural; testimonies-
-- audio = gravação de depoimento em áudio (até 3min no
-- client); audio = não referenciado em nenhum lugar do
-- código hoje, restringido por precaução mesmo assim.
-- =====================================================

update storage.buckets set
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp4','audio/ogg','audio/mpeg'],
  file_size_limit = 5242880 -- 5MB
where id = 'chat-media';

update storage.buckets set
  allowed_mime_types = array['image/jpeg','image/png','image/webp'],
  file_size_limit = 10485760 -- 10MB
where id = 'community-photos';

update storage.buckets set
  allowed_mime_types = array['audio/webm','audio/mp4','audio/ogg','audio/mpeg'],
  file_size_limit = 15728640 -- 15MB (recording de até 3min no client)
where id = 'testimonies-audio';

update storage.buckets set
  allowed_mime_types = array['audio/webm','audio/mp4','audio/ogg','audio/mpeg'],
  file_size_limit = 15728640
where id = 'audio';
