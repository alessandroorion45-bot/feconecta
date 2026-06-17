-- ============================================
-- TABELAS PARA BÍBLIA ACF
-- ============================================

-- Tabela de livros
CREATE TABLE IF NOT EXISTS bible_books (
  id BIGSERIAL PRIMARY KEY,
  abbrev TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('AT', 'NT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de versículos
CREATE TABLE IF NOT EXISTS bible_verses (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES bible_books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, chapter, verse)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter ON bible_verses(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_bible_books_abbrev ON bible_books(abbrev);

-- RLS Policies (permitir leitura pública)
ALTER TABLE bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bible books are viewable by everyone" ON bible_books;
CREATE POLICY "Bible books are viewable by everyone"
  ON bible_books FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Bible verses are viewable by everyone" ON bible_verses;
CREATE POLICY "Bible verses are viewable by everyone"
  ON bible_verses FOR SELECT
  USING (true);

-- Comentários
COMMENT ON TABLE bible_books IS 'Livros da Bíblia ACF (Almeida Corrigida e Fiel)';
COMMENT ON TABLE bible_verses IS 'Versículos da Bíblia ACF';
