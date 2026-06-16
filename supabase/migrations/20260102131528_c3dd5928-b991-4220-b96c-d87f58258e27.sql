-- Tabela para desafios bíblicos diários
CREATE TABLE public.daily_biblical_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_text TEXT NOT NULL,
  motivational_quote TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  difficulty_level TEXT NOT NULL DEFAULT 'facil',
  points_reward INTEGER NOT NULL DEFAULT 10,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de desafios completados
CREATE TABLE public.daily_challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_biblical_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_earned INTEGER NOT NULL DEFAULT 10,
  UNIQUE(user_id, challenge_id)
);

-- Habilitar RLS
ALTER TABLE public.daily_biblical_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

-- Políticas para desafios diários (visíveis para todos autenticados)
CREATE POLICY "Desafios diários visíveis para usuários autenticados"
ON public.daily_biblical_challenges
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Políticas para completudes
CREATE POLICY "Usuários podem ver suas completudes"
ON public.daily_challenge_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem completar desafios"
ON public.daily_challenge_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_daily_challenges_date ON public.daily_biblical_challenges(challenge_date);
CREATE INDEX idx_challenge_completions_user ON public.daily_challenge_completions(user_id);

-- Inserir desafios iniciais para os próximos 30 dias
INSERT INTO public.daily_biblical_challenges (challenge_text, motivational_quote, category, difficulty_level, points_reward, challenge_date) VALUES
('Leia o Salmo 23 e medite sobre a proteção de Deus', 'O Senhor é meu pastor, nada me faltará', 'leitura', 'facil', 10, CURRENT_DATE),
('Ore por alguém que precisa de ajuda hoje', 'A oração do justo pode muito em seus efeitos', 'oracao', 'facil', 10, CURRENT_DATE + INTERVAL '1 day'),
('Compartilhe um versículo que te inspira nas redes sociais', 'Ide e pregai o evangelho a toda criatura', 'compartilhar', 'medio', 15, CURRENT_DATE + INTERVAL '2 days'),
('Pratique o perdão com alguém que te magoou', 'Perdoai e sereis perdoados', 'acao', 'dificil', 25, CURRENT_DATE + INTERVAL '3 days'),
('Leia Provérbios capítulo 3 e anote 3 lições', 'Confia no Senhor de todo o teu coração', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '4 days'),
('Faça uma boa ação anônima para um vizinho', 'Amai ao próximo como a ti mesmo', 'acao', 'medio', 20, CURRENT_DATE + INTERVAL '5 days'),
('Leia Mateus 5 - O Sermão da Montanha', 'Bem-aventurados os pacificadores', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '6 days'),
('Ore por 10 minutos em gratidão', 'Em tudo dai graças', 'oracao', 'facil', 10, CURRENT_DATE + INTERVAL '7 days'),
('Envie uma mensagem de encorajamento para 3 amigos', 'Encorajai-vos uns aos outros', 'compartilhar', 'facil', 10, CURRENT_DATE + INTERVAL '8 days'),
('Jejue uma refeição e dedique o tempo à oração', 'Este tipo só sai com jejum e oração', 'acao', 'dificil', 30, CURRENT_DATE + INTERVAL '9 days'),
('Leia João 3:16-21 e reflita sobre o amor de Deus', 'Deus amou o mundo de tal maneira', 'leitura', 'facil', 10, CURRENT_DATE + INTERVAL '10 days'),
('Visite ou ligue para alguém solitário', 'Visitai os órfãos e viúvas', 'acao', 'medio', 20, CURRENT_DATE + INTERVAL '11 days'),
('Memorize um versículo bíblico hoje', 'Escondi a tua palavra no meu coração', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '12 days'),
('Ore pelo seu país e líderes', 'Orai pelos que vos governam', 'oracao', 'facil', 10, CURRENT_DATE + INTERVAL '13 days'),
('Doe algo que você não usa mais', 'Mais bem-aventurado é dar que receber', 'acao', 'medio', 20, CURRENT_DATE + INTERVAL '14 days'),
('Leia Filipenses 4 sobre contentamento', 'Tudo posso naquele que me fortalece', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '15 days'),
('Agradeça a Deus por 10 bênçãos específicas', 'Dá graças ao Senhor porque ele é bom', 'oracao', 'facil', 10, CURRENT_DATE + INTERVAL '16 days'),
('Convide alguém para um culto ou célula', 'Onde dois ou três estão reunidos em meu nome', 'compartilhar', 'medio', 15, CURRENT_DATE + INTERVAL '17 days'),
('Leia Romanos 8 sobre a vida no Espírito', 'Nenhuma condenação há para os que estão em Cristo', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '18 days'),
('Pratique a paciência em uma situação difícil', 'O amor é paciente, é benigno', 'acao', 'dificil', 25, CURRENT_DATE + INTERVAL '19 days'),
('Ore pelo seu pastor e líderes da igreja', 'Orai pelos que trabalham entre vós', 'oracao', 'facil', 10, CURRENT_DATE + INTERVAL '20 days'),
('Leia 1 Coríntios 13 sobre o amor', 'O amor nunca falha', 'leitura', 'facil', 10, CURRENT_DATE + INTERVAL '21 days'),
('Escreva uma carta de gratidão para alguém especial', 'Um coração agradecido é um coração feliz', 'acao', 'medio', 15, CURRENT_DATE + INTERVAL '22 days'),
('Compartilhe seu testemunho na Rede da Fé', 'Venceram pelo sangue do Cordeiro e pela palavra do testemunho', 'compartilhar', 'medio', 20, CURRENT_DATE + INTERVAL '23 days'),
('Leia Efésios 6 sobre a armadura de Deus', 'Revesti-vos de toda a armadura de Deus', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '24 days'),
('Ore por um país em conflito', 'Orai pela paz de Jerusalém', 'oracao', 'facil', 10, CURRENT_DATE + INTERVAL '25 days'),
('Ajude alguém com uma tarefa prática', 'Servindo uns aos outros em amor', 'acao', 'medio', 20, CURRENT_DATE + INTERVAL '26 days'),
('Leia Gálatas 5 sobre os frutos do Espírito', 'O fruto do Espírito é amor, alegria, paz...', 'leitura', 'medio', 15, CURRENT_DATE + INTERVAL '27 days'),
('Reconcilie-se com alguém em desacordo', 'Bem-aventurados os pacificadores', 'acao', 'dificil', 30, CURRENT_DATE + INTERVAL '28 days'),
('Complete um capítulo inteiro da Bíblia', 'Lâmpada para os meus pés é a tua palavra', 'leitura', 'facil', 10, CURRENT_DATE + INTERVAL '29 days');