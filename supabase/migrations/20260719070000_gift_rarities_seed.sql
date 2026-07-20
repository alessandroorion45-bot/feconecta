-- ============================================================
-- Raridades editoriais dos 16 presentes existentes (curadoria).
-- Idempotente: só ajusta quem ainda está no default 'comum'.
-- ============================================================

UPDATE public.store_products SET raridade = CASE nome
  WHEN 'Aperto de Mão Fraterno'  THEN 'comum'
  WHEN 'Pomba da Paz'            THEN 'comum'
  WHEN 'Rosa da Gratidão'        THEN 'incomum'
  WHEN 'Coração de Gratidão'     THEN 'incomum'
  WHEN 'Oração por Você'         THEN 'incomum'
  WHEN 'Estrela da Esperança'    THEN 'raro'
  WHEN 'Luz do Caminho'          THEN 'raro'
  WHEN 'Feixe de Trigo'          THEN 'raro'
  WHEN 'Ramo de Oliveira'        THEN 'epico'
  WHEN 'Escudo da Fé'            THEN 'epico'
  WHEN 'Chama da Esperança'      THEN 'epico'
  WHEN 'Globo Missionário'       THEN 'epico'
  WHEN 'Coroa da Honra'          THEN 'lendario'
  WHEN 'Trombeta da Vitória'     THEN 'lendario'
  WHEN 'Caixa de Bênçãos'        THEN 'lendario'
  WHEN 'Cristal da Fidelidade'   THEN 'exclusivo'
  ELSE raridade
END
WHERE tipo = 'presente';

SELECT nome, raridade FROM public.store_products WHERE tipo='presente' ORDER BY
  array_position(ARRAY['comum','incomum','raro','epico','lendario','exclusivo'], raridade);
