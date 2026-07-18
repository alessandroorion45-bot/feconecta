-- Os 16 presentes tinham sido espalhados em categorias soltas
-- (Flores/Amizade/Incentivo/Celebração), deixando o filtro "Presentes"
-- sempre vazio. Agrupa tudo sob "Presentes" e remove as categorias órfãs.
UPDATE public.store_products
SET categoria = 'Presentes'
WHERE tipo = 'presente';

DELETE FROM public.store_categories
WHERE nome IN ('Flores', 'Amizade', 'Incentivo', 'Celebração')
  AND NOT EXISTS (
    SELECT 1 FROM public.store_products sp WHERE sp.categoria = store_categories.nome
  );

SELECT 'ok' as status;
