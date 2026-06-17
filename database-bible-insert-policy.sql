-- Adicionar policies de INSERT para importação
DROP POLICY IF EXISTS "Allow insert bible books" ON bible_books;
CREATE POLICY "Allow insert bible books"
  ON bible_books FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert bible verses" ON bible_verses;
CREATE POLICY "Allow insert bible verses"
  ON bible_verses FOR INSERT
  WITH CHECK (true);
