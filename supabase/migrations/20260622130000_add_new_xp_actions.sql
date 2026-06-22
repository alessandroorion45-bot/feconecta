-- ============================================
-- ADICIONAR NOVAS AÇÕES XP
-- devotional_completed, bible_study_completed, bible_reading_completed
-- ============================================

-- Inserir novas ações na tabela xp_actions
INSERT INTO public.xp_actions (action_name, xp_amount, description, icon) VALUES
('devotional_completed', 20, 'Completou um devocional diário', '📖'),
('bible_study_completed', 30, 'Completou um estudo bíblico', '📚'),
('bible_reading_completed', 15, 'Leu um capítulo da Bíblia', '✝️')
ON CONFLICT (action_name) DO NOTHING;

-- Comentário de confirmação
COMMENT ON TABLE public.xp_actions IS 'Tabela atualizada com 13 ações XP totais (10 originais + 3 novas)';
