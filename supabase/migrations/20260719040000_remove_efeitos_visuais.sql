-- ============================================================
-- Remove a categoria "Efeitos Visuais" da Kingdom Store
-- Produtos arquivados (não deletados: compras antigas referenciam,
-- e quem já comprou mantém o efeito equipado no perfil).
-- (Aplicado via CLI em 2026-07-19; arquivo mantido pro histórico.)
-- ============================================================

UPDATE public.store_products SET status = 'archived' WHERE tipo = 'efeito';
DELETE FROM public.store_categories WHERE nome = 'Efeitos Visuais';

SELECT 'ok' AS status,
  (SELECT count(*) FROM public.store_products WHERE tipo='efeito' AND status='archived') AS efeitos_arquivados;
