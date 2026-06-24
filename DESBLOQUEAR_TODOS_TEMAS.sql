-- =====================================================
-- DESBLOQUEAR TODOS OS TEMAS PARA VOCÊ (TESTE)
-- =====================================================

-- Seu User ID (substitua se necessário)
-- 6644c5e3-4886-4181-967f-b519cfed8538

-- Desbloquear TODOS os temas premium
INSERT INTO public.user_themes (user_id, theme_key, is_unlocked, unlocked_at)
SELECT
  '6644c5e3-4886-4181-967f-b519cfed8538'::uuid as user_id,
  theme_key,
  true as is_unlocked,
  now() as unlocked_at
FROM public.themes
WHERE theme_key != 'default'
ON CONFLICT (user_id, theme_key)
DO UPDATE SET is_unlocked = true, unlocked_at = now();

-- Verificar temas desbloqueados
SELECT * FROM public.get_available_themes('6644c5e3-4886-4181-967f-b519cfed8538');
