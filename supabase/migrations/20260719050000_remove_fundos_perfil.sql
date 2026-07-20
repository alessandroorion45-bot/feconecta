-- ============================================================
-- Remove a categoria "Fundos de Perfil" da Kingdom Store
-- Produtos arquivados (não deletados: compras antigas referenciam,
-- e quem já comprou mantém o fundo equipado no perfil).
-- (Aplicado via CLI em 2026-07-19; arquivo mantido pro histórico.)
-- ============================================================

UPDATE public.store_products SET status = 'archived' WHERE tipo = 'fundo';
DELETE FROM public.store_categories WHERE nome = 'Fundos de Perfil';

SELECT 'ok' AS status,
  (SELECT count(*) FROM public.store_products WHERE tipo='fundo' AND status='archived') AS fundos_arquivados;
