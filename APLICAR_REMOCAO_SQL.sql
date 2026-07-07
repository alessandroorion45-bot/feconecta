-- =============================================
-- Remoção de Mural de Gratidão e Igrejas Próximas
-- Corrige o texto já semeado nos 365 dias de desafios diários
-- que mencionava o "Mural da Gratidão" (rota removida)
-- =============================================

UPDATE public.daily_biblical_challenges
SET challenge_text = '🌻 Escreva três motivos pelos quais você é grato hoje e compartilhe no Feed.'
WHERE challenge_text = '🌻 Escreva três motivos de gratidão no Mural da Gratidão.';

-- Observação: as tabelas gratitude_posts/gratitude_amens e
-- nearby_churches não são removidas do banco (apenas a interface),
-- evitando perda de dados históricos. Sem UI para criá-los, ficam
-- inertes.
