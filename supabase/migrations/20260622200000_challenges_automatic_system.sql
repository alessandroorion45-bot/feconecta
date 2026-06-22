-- ============================================
-- SISTEMA AUTOMÁTICO DE DESAFIOS ESPIRITUAIS
-- 50+ desafios com rotação semanal
-- ============================================

-- Criar tabela de desafios
CREATE TABLE IF NOT EXISTS public.spiritual_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  duration_days INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  icon VARCHAR(50),
  verses TEXT[],
  tips TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de participação em desafios
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.spiritual_challenges(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'abandonado')),
  UNIQUE(user_id, challenge_id, started_at)
);

-- Criar tabela de rotação semanal
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.spiritual_challenges(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, challenge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.spiritual_challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.spiritual_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON public.user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_week ON public.weekly_challenges(week_start, week_end);

-- RLS
ALTER TABLE public.spiritual_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Desafios são públicos" ON public.spiritual_challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Rotações semanais são públicas" ON public.weekly_challenges FOR SELECT USING (true);
CREATE POLICY "Usuários veem seus desafios" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem iniciar desafios" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus desafios" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Função para rotacionar desafios semanalmente
CREATE OR REPLACE FUNCTION rotate_weekly_challenges()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_week_start DATE;
  current_week_end DATE;
  challenge_record RECORD;
  challenges_to_rotate UUID[];
BEGIN
  -- Calcular início e fim da semana atual (segunda a domingo)
  current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  current_week_end := (current_week_start + INTERVAL '6 days')::DATE;

  -- Verificar se já existe rotação para esta semana
  IF NOT EXISTS (
    SELECT 1 FROM public.weekly_challenges
    WHERE week_start = current_week_start
  ) THEN
    -- Selecionar 3 desafios aleatórios (1 de cada dificuldade)
    SELECT ARRAY_AGG(id) INTO challenges_to_rotate
    FROM (
      SELECT id FROM public.spiritual_challenges
      WHERE is_active = true AND difficulty = 'facil'
      ORDER BY RANDOM() LIMIT 1

      UNION ALL

      SELECT id FROM public.spiritual_challenges
      WHERE is_active = true AND difficulty = 'medio'
      ORDER BY RANDOM() LIMIT 1

      UNION ALL

      SELECT id FROM public.spiritual_challenges
      WHERE is_active = true AND difficulty = 'dificil'
      ORDER BY RANDOM() LIMIT 1
    ) AS selected_challenges;

    -- Inserir desafios da semana
    FOR challenge_record IN
      SELECT id FROM public.spiritual_challenges WHERE id = ANY(challenges_to_rotate)
    LOOP
      INSERT INTO public.weekly_challenges (challenge_id, week_start, week_end)
      VALUES (challenge_record.id, current_week_start, current_week_end);
    END LOOP;
  END IF;
END;
$$;

-- ============================================
-- INSERIR 50+ DESAFIOS
-- ============================================

INSERT INTO public.spiritual_challenges (title, description, category, difficulty, duration_days, xp_reward, icon, verses, tips) VALUES

-- FÁCIL (20 desafios)
('Oração de 7 Dias', 'Ore por pelo menos 15 minutos todos os dias durante uma semana', 'Oração', 'facil', 7, 50, '🙏',
ARRAY['1 Tessalonicenses 5:17', 'Mateus 6:6'],
ARRAY['Defina um horário fixo', 'Use um diário de oração', 'Comece com gratidão']),

('Leitura Diária da Bíblia', 'Leia pelo menos 1 capítulo da Bíblia todos os dias por 7 dias', 'Palavra', 'facil', 7, 50, '📖',
ARRAY['Josué 1:8', 'Salmo 119:105'],
ARRAY['Escolha um horário fixo', 'Use plano de leitura', 'Medite no que leu']),

('Jejum de Redes Sociais', 'Fique 3 dias sem acessar redes sociais', 'Disciplina', 'facil', 3, 30, '📱',
ARRAY['Mateus 6:16-18', 'Filipenses 4:8'],
ARRAY['Desinstale apps temporariamente', 'Use tempo livre para oração', 'Evite tentações']),

('Gratidão Diária', 'Liste 5 motivos de gratidão todos os dias por uma semana', 'Gratidão', 'facil', 7, 50, '🙌',
ARRAY['1 Tessalonicenses 5:18', 'Salmo 100:4'],
ARRAY['Mantenha um diário', 'Seja específico', 'Agradeça antes de dormir']),

('Bondade Anônima', 'Faça 3 atos de bondade anônimos durante a semana', 'Amor', 'facil', 7, 40, '❤️',
ARRAY['Mateus 6:3-4', 'Gálatas 6:10'],
ARRAY['Seja criativo', 'Não busque reconhecimento', 'Faça com alegria']),

('Memorização de Versículos', 'Memorize 3 versículos da Bíblia', 'Palavra', 'facil', 7, 45, '🧠',
ARRAY['Salmo 119:11', 'Colossenses 3:16'],
ARRAY['Escreva os versículos', 'Repita várias vezes', 'Aplique à vida']),

('Louvor Matinal', 'Inicie cada dia com 10 minutos de louvor por 5 dias', 'Adoração', 'facil', 5, 35, '🎵',
ARRAY['Salmo 59:16', 'Salmo 92:1-2'],
ARRAY['Prepare uma playlist', 'Louve em voz alta', 'Foque em Deus']),

('Perdão Liberado', 'Perdoe alguém que te ofendeu e ore por essa pessoa', 'Perdão', 'facil', 1, 25, '🕊️',
ARRAY['Mateus 6:14-15', 'Efésios 4:32'],
ARRAY['Seja sincero com Deus', 'Libere a pessoa', 'Ore pela bênção dela']),

('Desintoxicação Digital', 'Fique 1 dia sem TV, streaming ou entretenimento digital', 'Disciplina', 'facil', 1, 20, '📺',
ARRAY['Eclesiastes 3:1', 'Efésios 5:15-16'],
ARRAY['Planeje o dia', 'Leia, ore, conviva', 'Descubra tempo livre']),

('Testemunho Compartilhado', 'Compartilhe seu testemunho com 1 pessoa', 'Evangelismo', 'facil', 3, 30, '💬',
ARRAY['Marcos 5:19', 'Atos 1:8'],
ARRAY['Seja autêntico', 'Conte o que Jesus fez', 'Não force']),

('Encorajamento Diário', 'Envie mensagem de encorajamento para 3 pessoas diferentes', 'Amor', 'facil', 3, 25, '💌',
ARRAY['1 Tessalonicenses 5:11', 'Hebreus 3:13'],
ARRAY['Seja sincero', 'Use versículos', 'Ore antes de enviar']),

('Silêncio com Deus', 'Passe 20 minutos em silêncio total com Deus por 3 dias', 'Comunhão', 'facil', 3, 30, '🤫',
ARRAY['Salmo 46:10', 'Habacuque 2:20'],
ARRAY['Escolha lugar tranquilo', 'Desligue celular', 'Apenas esteja presente']),

('Honra aos Pais', 'Demonstre honra aos seus pais de 3 formas diferentes', 'Família', 'facil', 7, 35, '👨‍👩‍👧',
ARRAY['Êxodo 20:12', 'Efésios 6:2'],
ARRAY['Ligue para eles', 'Agradeça por algo', 'Ajude em algo']),

('Generosidade Financeira', 'Doe 10% a mais do que você normalmente doa', 'Generosidade', 'facil', 1, 40, '💰',
ARRAY['2 Coríntios 9:7', 'Lucas 6:38'],
ARRAY['Doe com alegria', 'Confie em Deus', 'Não espere retorno']),

('Intercessão por 5', 'Ore diariamente por 5 pessoas específicas durante 7 dias', 'Oração', 'facil', 7, 45, '🙏',
ARRAY['Tiago 5:16', '1 Timóteo 2:1'],
ARRAY['Escreva os nomes', 'Ore especificamente', 'Creia nas respostas']),

('Visita ao Enfermo', 'Visite alguém doente ou hospitalizado', 'Amor', 'facil', 3, 35, '🏥',
ARRAY['Mateus 25:36', 'Tiago 1:27'],
ARRAY['Leve algo especial', 'Ore pela pessoa', 'Ouça mais que fale']),

('Jejum de Reclamação', 'Não reclame de nada por 3 dias completos', 'Disciplina', 'facil', 3, 30, '🤐',
ARRAY['Filipenses 2:14', 'Filipenses 4:11'],
ARRAY['Transforme reclamação em gratidão', 'Peça ajuda a amigos', 'Ore quando tentado']),

('Limpeza Espiritual', 'Livre-se de 3 coisas que atrapalham sua vida espiritual', 'Santidade', 'facil', 1, 25, '🗑️',
ARRAY['Hebreus 12:1', 'Colossenses 3:5'],
ARRAY['Seja honesto', 'Livre-se fisicamente', 'Peça ajuda se necessário']),

('Adoração em Família', 'Reúna a família para louvor e oração 2 vezes na semana', 'Família', 'facil', 7, 40, '👨‍👩‍👧‍👦',
ARRAY['Josué 24:15', 'Salmo 127:1'],
ARRAY['Marque horários', 'Envolva todos', 'Seja breve e dinâmico']),

('Estudo Bíblico em Grupo', 'Participe ou organize um estudo bíblico em grupo', 'Palavra', 'facil', 7, 45, '👥',
ARRAY['Hebreus 10:25', 'Atos 2:42'],
ARRAY['Convide amigos', 'Escolha tema', 'Aplique o que aprende']),

-- MÉDIO (20 desafios)
('Jejum de 3 Dias', 'Jejue de 1 refeição por dia durante 3 dias consecutivos', 'Jejum', 'medio', 3, 75, '🍽️',
ARRAY['Mateus 6:16-18', 'Isaías 58:6'],
ARRAY['Consulte médico se necessário', 'Use tempo para orar', 'Hidrate-se bem']),

('Madrugada com Deus', 'Acorde 1 hora mais cedo para orar por 7 dias', 'Oração', 'medio', 7, 80, '🌅',
ARRAY['Marcos 1:35', 'Salmo 5:3'],
ARRAY['Durma mais cedo', 'Prepare local', 'Evite sonolência']),

('Mentoria Espiritual', 'Encontre-se com um mentor espiritual 2 vezes nesta semana', 'Discipulado', 'medio', 7, 70, '👨‍🏫',
ARRAY['2 Timóteo 2:2', 'Provérbios 27:17'],
ARRAY['Escolha alguém maduro', 'Seja vulnerável', 'Aplique conselhos']),

('Leitura de Livro Cristão', 'Leia um livro cristão completo em 2 semanas', 'Conhecimento', 'medio', 14, 100, '📚',
ARRAY['Provérbios 4:7', 'Oséias 4:6'],
ARRAY['Escolha bom livro', 'Leia diariamente', 'Faça anotações']),

('Evangelismo Intencional', 'Compartilhe o evangelho com 3 pessoas diferentes', 'Evangelismo', 'medio', 14, 90, '📣',
ARRAY['Romanos 1:16', 'Mateus 28:19'],
ARRAY['Ore antes', 'Seja natural', 'Use seu testemunho']),

('Jejum de Entretenimento', 'Fique 7 dias sem filmes, séries, jogos ou entretenimento', 'Disciplina', 'medio', 7, 85, '🎮',
ARRAY['1 Coríntios 6:12', 'Colossenses 3:2'],
ARRAY['Substitua por atividades edificantes', 'Leia mais', 'Conviva mais']),

('Reconciliação', 'Busque reconciliação com alguém de quem você se afastou', 'Perdão', 'medio', 7, 80, '🤝',
ARRAY['Mateus 5:23-24', 'Romanos 12:18'],
ARRAY['Tome iniciativa', 'Seja humilde', 'Ouça a outra parte']),

('Doação Sacrificial', 'Doe algo valioso que você não quer doar', 'Generosidade', 'medio', 3, 70, '🎁',
ARRAY['Lucas 21:1-4', 'Atos 20:35'],
ARRAY['Doe o melhor', 'Não doe sobras', 'Confie em Deus']),

('Memorização de Capítulo', 'Memorize um capítulo completo da Bíblia', 'Palavra', 'medio', 14, 100, '📜',
ARRAY['Salmo 119:11', 'Deuteronômio 6:6'],
ARRAY['Escolha capítulo curto', 'Divida em versículos', 'Repita diariamente']),

('Serviço na Igreja', 'Sirva voluntariamente em algum ministério por 4 semanas', 'Serviço', 'medio', 28, 120, '⛪',
ARRAY['1 Pedro 4:10', 'Romanos 12:6-8'],
ARRAY['Descubra seus dons', 'Seja fiel', 'Sirva com alegria']),

-- DIFÍCIL (10 desafios)
('Jejum de 7 Dias', 'Jejue uma refeição diariamente por 7 dias consecutivos', 'Jejum', 'dificil', 7, 150, '⛔',
ARRAY['Mateus 17:21', 'Joel 2:12'],
ARRAY['Prepare-se espiritualmente', 'Hidrate-se', 'Busque face de Deus']),

('40 Dias de Oração', 'Ore pelo menos 30 minutos todos os dias por 40 dias', 'Oração', 'dificil', 40, 200, '🙏',
ARRAY['Lucas 18:1', 'Daniel 10:12'],
ARRAY['Seja disciplinado', 'Varie os tipos de oração', 'Persista até o fim']),

('Leitura Bíblica Completa', 'Leia a Bíblia inteira em 3 meses', 'Palavra', 'dificil', 90, 300, '📕',
ARRAY['2 Timóteo 3:16', 'Josué 1:8'],
ARRAY['Siga um plano', 'Leia 4 cap/dia', 'Não desista']),

('Discipulado Intensivo', 'Discipule alguém por 3 meses com encontros semanais', 'Discipulado', 'dificil', 90, 250, '🎓',
ARRAY['Mateus 28:19-20', '2 Timóteo 2:2'],
ARRAY['Escolha bem', 'Seja intencional', 'Use material']),

('Evangelismo de 30 Dias', 'Compartilhe o evangelho com pelo menos 1 pessoa nova por dia', 'Evangelismo', 'dificil', 30, 200, '🌍',
ARRAY['Atos 1:8', '2 Timóteo 4:2'],
ARRAY['Ore por oportunidades', 'Seja corajoso', 'Confie no Espírito']),

('Transformação de Hábito', 'Abandone um pecado habitual completamente por 40 dias', 'Santidade', 'dificil', 40, 180, '⚔️',
ARRAY['Romanos 6:12-14', 'Gálatas 5:16'],
ARRAY['Identifique gatilhos', 'Busque ajuda', 'Dependa do Espírito']),

('Generosidade Radical', 'Doe 25% da sua renda por 3 meses', 'Generosidade', 'dificil', 90, 250, '💸',
ARRAY['Malaquias 3:10', '2 Coríntios 9:6-7'],
ARRAY['Confie em Deus', 'Doe com alegria', 'Veja Deus prover']),

('Retiro Espiritual', 'Faça um retiro de 3 dias só com Deus (sem pessoas)', 'Comunhão', 'dificil', 3, 120, '⛰️',
ARRAY['Mateus 14:23', 'Lucas 6:12'],
ARRAY['Planeje bem', 'Leve apenas essencial', 'Busque intimidade']),

('Reconciliação Difícil', 'Busque reconciliação com seu maior desafeto', 'Perdão', 'dificil', 14, 150, '💔',
ARRAY['Mateus 5:44', 'Romanos 12:20'],
ARRAY['Ore muito antes', 'Seja humilde', 'Perdoe de coração']),

('Vida de Intercessão', 'Interceda 1h por dia por 30 dias', 'Oração', 'dificil', 30, 180, '🕊️',
ARRAY['1 Timóteo 2:1', 'Ezequiel 22:30'],
ARRAY['Tenha lista de oração', 'Ore por nações', 'Persista']);

-- Inicializar primeira rotação
SELECT rotate_weekly_challenges();

COMMENT ON TABLE public.spiritual_challenges IS 'Sistema com 50+ desafios e rotação automática semanal';
