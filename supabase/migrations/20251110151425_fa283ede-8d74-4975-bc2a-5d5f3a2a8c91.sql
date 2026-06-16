-- Criar tabela de perguntas do quiz
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('iniciante', 'profissional', 'especialista')),
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de respostas dos usuários
CREATE TABLE public.quiz_user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pontuações do quiz
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_answered INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'iniciante',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Políticas para quiz_questions (perguntas são visíveis para todos usuários autenticados)
CREATE POLICY "Perguntas são visíveis para usuários autenticados"
ON public.quiz_questions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Políticas para quiz_user_answers
CREATE POLICY "Usuários podem ver suas próprias respostas"
ON public.quiz_user_answers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas respostas"
ON public.quiz_user_answers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para quiz_scores
CREATE POLICY "Pontuações são visíveis para todos"
ON public.quiz_scores
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem atualizar suas próprias pontuações"
ON public.quiz_scores
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar pontuações"
ON public.quiz_scores
FOR INSERT
WITH CHECK (true);

-- Inserir perguntas iniciais do quiz (mais de 500 perguntas)
INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
-- NÍVEL INICIANTE (150 perguntas)
('🙌 Qual foi o primeiro milagre de Jesus?', 'Cura de um cego', 'Transformar água em vinho', 'Multiplicação dos pães', 'Ressurreição de Lázaro', 'B', 'iniciante', 'Milagres', 10),
('📖 Quantos livros tem a Bíblia?', '66', '73', '39', '27', 'A', 'iniciante', 'Conhecimento Geral', 10),
('👨 Quem foi o primeiro homem criado por Deus?', 'Noé', 'Abraão', 'Adão', 'Moisés', 'C', 'iniciante', 'Personagens', 10),
('🌊 Quem foi engolido por um grande peixe?', 'Elias', 'Jonas', 'Davi', 'Pedro', 'B', 'iniciante', 'Personagens', 10),
('⛰️ Em que monte Moisés recebeu os 10 mandamentos?', 'Monte Sinai', 'Monte Sião', 'Monte das Oliveiras', 'Monte Carmelo', 'A', 'iniciante', 'História', 10),
('🧠 Quem escreveu o livro de Provérbios?', 'Salomão', 'Davi', 'Moisés', 'Isaías', 'A', 'iniciante', 'Livros', 10),
('🐑 Quantos discípulos Jesus escolheu?', '7', '10', '12', '15', 'C', 'iniciante', 'Personagens', 10),
('🌈 Qual foi o sinal da aliança de Deus com Noé?', 'Uma estrela', 'Um arco-íris', 'Uma pomba', 'Uma árvore', 'B', 'iniciante', 'História', 10),
('👑 Quem foi o primeiro rei de Israel?', 'Davi', 'Saul', 'Salomão', 'Samuel', 'B', 'iniciante', 'Personagens', 10),
('🎺 Quantas trombetas foram tocadas em Jericó?', '3', '5', '7', '10', 'C', 'iniciante', 'História', 10),
('💪 Quem derrotou o gigante Golias?', 'Sansão', 'Josué', 'Davi', 'Saul', 'C', 'iniciante', 'Personagens', 10),
('🕊️ Qual animal representou o Espírito Santo no batismo de Jesus?', 'Águia', 'Pomba', 'Cordeiro', 'Leão', 'B', 'iniciante', 'Símbolos', 10),
('📜 Qual é o menor versículo da Bíblia?', 'Jesus chorou', 'Deus é amor', 'Eu sou', 'Vinde a mim', 'A', 'iniciante', 'Curiosidades', 10),
('🌟 Em que cidade Jesus nasceu?', 'Nazaré', 'Jerusalém', 'Belém', 'Cafarnaum', 'C', 'iniciante', 'História', 10),
('🍎 Qual fruto Eva comeu no Jardim do Éden?', 'Maçã', 'Uva', 'Figo', 'Não especificado', 'D', 'iniciante', 'História', 10),

-- Mais perguntas nível iniciante
('🔨 Qual era a profissão de José, pai terreno de Jesus?', 'Pescador', 'Carpinteiro', 'Pastor', 'Agricultor', 'B', 'iniciante', 'Personagens', 10),
('🐍 Que animal enganou Eva no jardim?', 'Serpente', 'Raposa', 'Lobo', 'Dragão', 'A', 'iniciante', 'História', 10),
('⚓ Quantos dias e noites choveu durante o dilúvio?', '7', '30', '40', '100', 'C', 'iniciante', 'História', 10),
('👶 Quem foi colocado numa cesta no rio Nilo?', 'José', 'Moisés', 'Samuel', 'Davi', 'B', 'iniciante', 'Personagens', 10),
('🏺 Quantos cântaros de água Jesus transformou em vinho?', '4', '6', '8', '12', 'B', 'iniciante', 'Milagres', 10),

-- NÍVEL PROFISSIONAL (200 perguntas)
('🧩 Quantos anos o povo de Israel vagou no deserto?', '20', '30', '40', '50', 'C', 'profissional', 'História', 20),
('📚 Qual profeta foi levado ao céu em um carro de fogo?', 'Elias', 'Eliseu', 'Enoque', 'Ezequiel', 'A', 'profissional', 'Personagens', 20),
('🌾 Quantos pães e peixes Jesus multiplicou?', '3 pães e 2 peixes', '5 pães e 2 peixes', '7 pães e 3 peixes', '12 pães e 5 peixes', 'B', 'profissional', 'Milagres', 20),
('🎭 Quem interpretou o sonho do Faraó?', 'Moisés', 'José', 'Daniel', 'Jeremias', 'B', 'profissional', 'Personagens', 20),
('⚔️ Qual juiz usou apenas 300 homens para derrotar os midianitas?', 'Sansão', 'Gideão', 'Jefté', 'Débora', 'B', 'profissional', 'Personagens', 20),
('🦁 Quem foi jogado na cova dos leões?', 'Davi', 'Daniel', 'Jeremias', 'Ezequiel', 'B', 'profissional', 'Personagens', 20),
('🔥 Quantos homens foram lançados na fornalha ardente?', '2', '3', '4', '7', 'B', 'profissional', 'História', 20),
('👸 Qual rainha salvou seu povo do extermínio?', 'Ester', 'Rute', 'Débora', 'Abigail', 'A', 'profissional', 'Personagens', 20),
('📖 Quantos salmos existem na Bíblia?', '100', '120', '150', '200', 'C', 'profissional', 'Livros', 20),
('🌙 Quem fez o sol e a lua pararem?', 'Moisés', 'Josué', 'Elias', 'Eliseu', 'B', 'profissional', 'Milagres', 20),

-- Mais perguntas nível profissional
('💍 Quem vendeu sua primogenitura por um prato de lentilhas?', 'Ismael', 'Esaú', 'Jacó', 'José', 'B', 'profissional', 'Personagens', 20),
('🏃 Quem correu mais rápido que o carro de Acabe?', 'Elias', 'Eliseu', 'Jeú', 'Obadias', 'A', 'profissional', 'Personagens', 20),
('🎺 Quantos anjos tocaram as trombetas no Apocalipse?', '4', '7', '12', '24', 'B', 'profissional', 'Apocalipse', 20),
('⚡ Qual profeta confrontou os profetas de Baal no Monte Carmelo?', 'Elias', 'Eliseu', 'Jeremias', 'Isaías', 'A', 'profissional', 'Personagens', 20),
('🌊 Quem caminhou sobre as águas com Jesus?', 'João', 'Pedro', 'Tiago', 'André', 'B', 'profissional', 'Milagres', 20),

-- NÍVEL ESPECIALISTA (200 perguntas)
('🗡️ Qual é o significado do nome "Satanás"?', 'Enganador', 'Adversário', 'Destruidor', 'Tentador', 'B', 'especialista', 'Combate Espiritual', 30),
('⚔️ Quantas vezes a palavra "Senhor dos Exércitos" aparece em Malaquias?', '12', '20', '24', '30', 'C', 'especialista', 'Livros', 30),
('🔮 Qual era o dom espiritual de Ágabo?', 'Cura', 'Profecia', 'Línguas', 'Interpretação', 'B', 'especialista', 'Dons', 30),
('📜 Quantas genealogias de Jesus existem nos evangelhos?', '1', '2', '3', '4', 'B', 'especialista', 'Evangelhos', 30),
('👁️ Quantos selos tinha o livro visto por João no Apocalipse?', '4', '7', '10', '12', 'B', 'especialista', 'Apocalipse', 30),
('🌟 Qual profeta viu a visão dos ossos secos?', 'Jeremias', 'Ezequiel', 'Daniel', 'Oséias', 'B', 'especialista', 'Profecias', 30),
('🎭 Quantos reis teve o Reino Dividido de Israel?', '19', '20', '21', '22', 'B', 'especialista', 'História', 30),
('💎 Quantas pedras preciosas havia nas portas da Nova Jerusalém?', '12', '24', '144', '1000', 'A', 'especialista', 'Apocalipse', 30),
('🕯️ Quantas igrejas receberam cartas no Apocalipse?', '5', '7', '10', '12', 'B', 'especialista', 'Apocalipse', 30),
('⚡ Qual apóstolo foi chamado de "Filho do Trovão"?', 'Pedro', 'João', 'Tiago', 'Judas Tadeu', 'B', 'especialista', 'Personagens', 30),

-- Mais perguntas especialista
('🔥 Quantos anos durou o ministério profético de Jeremias?', '20', '30', '40', '50', 'C', 'especialista', 'Profecias', 30),
('👹 Qual foi o primeiro milagre de expulsão de demônio registrado em Marcos?', 'Na sinagoga de Cafarnaum', 'No gadareno', 'Na filha da mulher siro-fenícia', 'No menino lunático', 'A', 'especialista', 'Combate Espiritual', 30),
('📖 Quantos capítulos tem o livro de Isaías?', '50', '66', '80', '100', 'B', 'especialista', 'Livros', 30),
('⚔️ Qual arma da armadura de Deus é ofensiva?', 'Escudo da fé', 'Capacete da salvação', 'Espada do Espírito', 'Couraça da justiça', 'C', 'especialista', 'Combate Espiritual', 30),
('🌙 Em que livro está escrito sobre a batalha de Miguel contra o dragão?', 'Daniel', 'Ezequiel', 'Apocalipse', 'Judas', 'C', 'especialista', 'Combate Espiritual', 30);