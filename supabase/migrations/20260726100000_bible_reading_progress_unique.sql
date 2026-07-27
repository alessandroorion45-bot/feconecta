-- Registro de leitura: garante 1 linha por (user, livro, capítulo), pra o app
-- poder fazer upsert idempotente e a contagem de capítulos lidos não inflar.
-- Tabela está vazia hoje -> seguro adicionar.
ALTER TABLE public.bible_reading_progress
  ADD CONSTRAINT bible_reading_progress_user_book_chapter_key
  UNIQUE (user_id, book_abbrev, chapter);
