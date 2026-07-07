-- Diagnóstico: por que os capítulos aparecem vazios na leitura da Bíblia.
-- Somente leitura — não altera nada. Rode e me mande o resultado (print).

-- 1) Quantos versículos existem no total?
SELECT COUNT(*) AS total_versiculos FROM public.bible_verses;

-- 2) Como estão os livros (ids que o app usa para buscar os versículos)?
SELECT id, abbrev, name FROM public.bible_books ORDER BY id LIMIT 10;

-- 3) Quais book_id realmente aparecem em bible_verses?
SELECT DISTINCT book_id FROM public.bible_verses ORDER BY book_id LIMIT 10;

-- 4) Existe algum versículo para o livro "Gênesis" (id 1, geralmente)?
SELECT bv.book_id, bv.chapter, bv.verse, LEFT(bv.text, 40) AS trecho
FROM public.bible_verses bv
JOIN public.bible_books bb ON bb.id = bv.book_id
WHERE bb.abbrev = 'gn'
ORDER BY bv.chapter, bv.verse
LIMIT 5;
