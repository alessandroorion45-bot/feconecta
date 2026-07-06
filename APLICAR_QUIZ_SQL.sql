-- =============================================
-- QUIZ BÍBLICO — Correções e banco de perguntas
-- 0) Cria as tabelas se não existirem no remoto
-- 1) Colunas de explicação e referência bíblica
-- 2) Políticas RLS
-- 3) Semeia 45 perguntas originais (3 níveis, 5 categorias),
--    cada uma com explicação e referência
-- =============================================

-- 0. Tabelas
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'iniciante',
  category TEXT NOT NULL DEFAULT 'geral',
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_answered INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'iniciante',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Explicação e referência bíblica em cada pergunta
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS bible_reference TEXT;

-- 1b. Remove CHECKs legados da tabela antiga do remoto que rejeitam
--     os níveis usados pelo app (iniciante/profissional/especialista)
ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_difficulty_check;
ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_category_check;
ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_correct_answer_check;
ALTER TABLE public.quiz_scores DROP CONSTRAINT IF EXISTS quiz_scores_current_level_check;

-- 2. Políticas
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Anyone can view quiz questions"
ON public.quiz_questions FOR SELECT USING (true);

ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view quiz scores" ON public.quiz_scores;
CREATE POLICY "Anyone can view quiz scores"
ON public.quiz_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own quiz score" ON public.quiz_scores;
CREATE POLICY "Users insert own quiz score"
ON public.quiz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own quiz score" ON public.quiz_scores;
CREATE POLICY "Users update own quiz score"
ON public.quiz_scores FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.quiz_user_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own quiz answers" ON public.quiz_user_answers;
CREATE POLICY "Users view own quiz answers"
ON public.quiz_user_answers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own quiz answers" ON public.quiz_user_answers;
CREATE POLICY "Users insert own quiz answers"
ON public.quiz_user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Banco de perguntas (não duplica se já existirem)
INSERT INTO public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points, explanation, bible_reference)
SELECT * FROM (VALUES
  -- ===== INICIANTE (10 pts) =====
  ('Quem construiu a arca antes do dilúvio?', 'Moisés', 'Noé', 'Abraão', 'Davi', 'B', 'iniciante', 'antigo_testamento', 10, 'Deus ordenou a Noé que construísse uma arca de madeira para salvar sua família e os animais do dilúvio.', 'Gênesis 6:14'),
  ('Quantos dias e noites choveu no dilúvio?', '7', '12', '40', '100', 'C', 'iniciante', 'antigo_testamento', 10, 'A chuva caiu sobre a terra durante quarenta dias e quarenta noites.', 'Gênesis 7:12'),
  ('Em que cidade Jesus nasceu?', 'Nazaré', 'Jerusalém', 'Belém', 'Cafarnaum', 'C', 'iniciante', 'jesus', 10, 'Jesus nasceu em Belém da Judeia, cumprindo a profecia de Miqueias.', 'Mateus 2:1'),
  ('Quem traiu Jesus por trinta moedas de prata?', 'Pedro', 'Judas Iscariotes', 'Tomé', 'João', 'B', 'iniciante', 'evangelhos', 10, 'Judas Iscariotes combinou com os principais sacerdotes entregar Jesus por trinta moedas de prata.', 'Mateus 26:14-15'),
  ('Qual era a profissão de Pedro antes de seguir Jesus?', 'Carpinteiro', 'Cobrador de impostos', 'Pescador', 'Pastor de ovelhas', 'C', 'iniciante', 'novo_testamento', 10, 'Pedro e seu irmão André eram pescadores no mar da Galileia quando Jesus os chamou.', 'Mateus 4:18'),
  ('Quem foi lançado na cova dos leões?', 'José', 'Daniel', 'Jeremias', 'Elias', 'B', 'iniciante', 'profetas', 10, 'Daniel foi lançado na cova dos leões por orar ao seu Deus, e o Senhor o livrou.', 'Daniel 6:16-22'),
  ('Qual foi o primeiro milagre de Jesus?', 'Multiplicar pães', 'Andar sobre as águas', 'Transformar água em vinho', 'Curar um cego', 'C', 'iniciante', 'jesus', 10, 'Nas bodas de Caná da Galileia, Jesus transformou água em vinho — seu primeiro sinal.', 'João 2:1-11'),
  ('Quem recebeu as tábuas dos Dez Mandamentos?', 'Josué', 'Arão', 'Moisés', 'Samuel', 'C', 'iniciante', 'antigo_testamento', 10, 'Moisés recebeu as tábuas da Lei no monte Sinai, escritas pelo dedo de Deus.', 'Êxodo 31:18'),
  ('Qual menino venceu o gigante Golias?', 'Salomão', 'Davi', 'Jônatas', 'Saul', 'B', 'iniciante', 'antigo_testamento', 10, 'Davi, ainda jovem pastor, venceu Golias com uma funda e uma pedra, confiando no Senhor.', '1 Samuel 17:45-50'),
  ('Quantos apóstolos Jesus escolheu?', '7', '10', '12', '15', 'C', 'iniciante', 'evangelhos', 10, 'Jesus escolheu doze apóstolos para estarem com ele e enviá-los a pregar.', 'Marcos 3:14'),
  ('Quem foi engolido por um grande peixe?', 'Jonas', 'Elias', 'Eliseu', 'Amós', 'A', 'iniciante', 'profetas', 10, 'Jonas fugiu da ordem de Deus e foi engolido por um grande peixe, onde ficou três dias e três noites.', 'Jonas 1:17'),
  ('O que Deus criou no primeiro dia?', 'Os animais', 'A luz', 'As plantas', 'O homem', 'B', 'iniciante', 'antigo_testamento', 10, 'No princípio, Deus disse: "Haja luz", e houve luz — separando a luz das trevas.', 'Gênesis 1:3'),
  ('Como Jesus morreu?', 'Apedrejado', 'Crucificado', 'Afogado', 'Na fogueira', 'B', 'iniciante', 'jesus', 10, 'Jesus foi crucificado no Calvário, entregando sua vida por amor a nós.', 'Lucas 23:33'),
  ('O que aconteceu com Jesus ao terceiro dia?', 'Foi sepultado', 'Ressuscitou', 'Subiu ao céu', 'Voltou à Galileia', 'B', 'iniciante', 'jesus', 10, 'Ao terceiro dia, Jesus ressuscitou dos mortos, vencendo a morte, como havia anunciado.', 'Lucas 24:6-7'),
  ('Quem escreveu a maioria dos Salmos?', 'Salomão', 'Moisés', 'Davi', 'Asafe', 'C', 'iniciante', 'antigo_testamento', 10, 'Davi, o "doce cantor de Israel", escreveu grande parte dos Salmos.', '2 Samuel 23:1'),

  -- ===== PROFISSIONAL (20 pts) =====
  ('Qual profeta foi levado ao céu num redemoinho, com carro de fogo?', 'Eliseu', 'Elias', 'Enoque', 'Isaías', 'B', 'profissional', 'profetas', 20, 'Elias foi arrebatado ao céu num redemoinho, enquanto um carro de fogo o separava de Eliseu.', '2 Reis 2:11'),
  ('Quantos livros tem o Novo Testamento?', '24', '27', '39', '66', 'B', 'profissional', 'novo_testamento', 20, 'O Novo Testamento contém 27 livros, de Mateus a Apocalipse.', 'Panorama bíblico'),
  ('Quem interpretou o sonho das vacas gordas e magras do faraó?', 'Moisés', 'Daniel', 'José', 'Jacó', 'C', 'profissional', 'antigo_testamento', 20, 'José interpretou os sonhos do faraó: sete anos de fartura seguidos de sete anos de fome.', 'Gênesis 41:25-30'),
  ('Na parábola do filho pródigo, o que o pai fez quando o filho voltou?', 'O repreendeu', 'Correu e o abraçou', 'Mandou-o trabalhar', 'Fechou a porta', 'B', 'profissional', 'evangelhos', 20, 'O pai correu, lançou-se ao pescoço do filho e o beijou — retrato do amor de Deus pelo pecador arrependido.', 'Lucas 15:20'),
  ('Quem era o cobrador de impostos que subiu numa árvore para ver Jesus?', 'Mateus', 'Zaqueu', 'Nicodemos', 'Bartimeu', 'B', 'profissional', 'evangelhos', 20, 'Zaqueu, chefe dos publicanos, subiu num sicômoro; Jesus se hospedou em sua casa e ele se converteu.', 'Lucas 19:1-10'),
  ('Qual apóstolo era conhecido como "o incrédulo"?', 'Filipe', 'Tomé', 'Tiago', 'André', 'B', 'profissional', 'novo_testamento', 20, 'Tomé disse que só creria vendo as marcas dos cravos; Jesus apareceu e ele confessou: "Senhor meu e Deus meu!"', 'João 20:24-28'),
  ('Quem sucedeu Moisés na liderança de Israel?', 'Calebe', 'Arão', 'Josué', 'Gideão', 'C', 'profissional', 'antigo_testamento', 20, 'Josué, filho de Num, conduziu o povo na travessia do Jordão e na conquista de Canaã.', 'Josué 1:1-2'),
  ('Qual rainha visitou Salomão para provar sua sabedoria?', 'Ester', 'Rainha de Sabá', 'Jezabel', 'Atalia', 'B', 'profissional', 'antigo_testamento', 20, 'A rainha de Sabá veio de longe testar Salomão com perguntas difíceis e reconheceu a sabedoria dada por Deus.', '1 Reis 10:1-9'),
  ('Onde Jesus foi tentado pelo diabo?', 'No templo', 'No deserto', 'No monte das Oliveiras', 'Em Jericó', 'B', 'profissional', 'jesus', 20, 'Jesus jejuou quarenta dias no deserto e venceu cada tentação citando as Escrituras.', 'Mateus 4:1-11'),
  ('Quem escreveu a maior parte das cartas do Novo Testamento?', 'Pedro', 'João', 'Paulo', 'Tiago', 'C', 'profissional', 'novo_testamento', 20, 'O apóstolo Paulo escreveu 13 cartas, de Romanos a Filemom, fundamentando a fé das igrejas.', 'Panorama bíblico'),
  ('Qual profeta confrontou os profetas de Baal no monte Carmelo?', 'Eliseu', 'Elias', 'Jeremias', 'Ezequiel', 'B', 'profissional', 'profetas', 20, 'Elias desafiou 450 profetas de Baal; o Deus que respondesse com fogo seria o verdadeiro — e o fogo do Senhor caiu.', '1 Reis 18:36-39'),
  ('O que aconteceu no dia de Pentecostes?', 'Jesus ressuscitou', 'O Espírito Santo desceu', 'Paulo se converteu', 'O templo foi destruído', 'B', 'profissional', 'novo_testamento', 20, 'No Pentecostes, o Espírito Santo desceu sobre os discípulos como línguas de fogo, e três mil se converteram.', 'Atos 2:1-4'),
  ('Quem escondeu os espias israelitas em Jericó?', 'Débora', 'Raabe', 'Rute', 'Miriã', 'B', 'profissional', 'antigo_testamento', 20, 'Raabe escondeu os espias e foi poupada na queda de Jericó — e entrou na genealogia de Jesus.', 'Josué 2:1-6'),
  ('Na parábola do semeador, o que representa a semente?', 'A fé', 'A Palavra de Deus', 'A igreja', 'O amor', 'B', 'profissional', 'evangelhos', 20, 'Jesus explicou: a semente é a Palavra de Deus, e os solos são os corações que a recebem.', 'Lucas 8:11'),
  ('Qual casal mentiu sobre o valor de uma propriedade e caiu morto?', 'Áquila e Priscila', 'Ananias e Safira', 'Zacarias e Isabel', 'Aquis e Mical', 'B', 'profissional', 'novo_testamento', 20, 'Ananias e Safira mentiram ao Espírito Santo sobre o preço do campo e caíram mortos.', 'Atos 5:1-10'),

  -- ===== ESPECIALISTA (30 pts) =====
  ('Quantos anos Israel vagou no deserto?', '7', '20', '40', '70', 'C', 'especialista', 'antigo_testamento', 30, 'Pela incredulidade, aquela geração vagou quarenta anos no deserto até cair no deserto.', 'Números 14:33-34'),
  ('Quem era o sumo sacerdote quando Jesus foi julgado?', 'Anás', 'Caifás', 'Gamaliel', 'Zacarias', 'B', 'especialista', 'evangelhos', 30, 'Caifás era o sumo sacerdote naquele ano e profetizou, sem saber, que Jesus morreria pela nação.', 'João 11:49-51; 18:24'),
  ('Qual era o outro nome do apóstolo Paulo?', 'Silas', 'Saulo', 'Barnabé', 'Estêvão', 'B', 'especialista', 'novo_testamento', 30, 'Saulo de Tarso perseguia a igreja até seu encontro com Jesus no caminho de Damasco.', 'Atos 9:1-6; 13:9'),
  ('Qual profeta viu um vale de ossos secos revivendo?', 'Isaías', 'Jeremias', 'Ezequiel', 'Daniel', 'C', 'especialista', 'profetas', 30, 'Ezequiel profetizou aos ossos secos, que se cobriram de carne e receberam o fôlego da vida — figura da restauração de Israel.', 'Ezequiel 37:1-10'),
  ('Quem foi o rei que viu a escrita na parede?', 'Nabucodonosor', 'Belsazar', 'Dario', 'Ciro', 'B', 'especialista', 'antigo_testamento', 30, 'Durante o banquete de Belsazar, dedos escreveram "Mene, Mene, Tequel e Parsim" — e naquela noite o reino caiu.', 'Daniel 5:25-30'),
  ('Qual discípulo Jesus chamou de "pedra" sobre a qual edificaria a igreja?', 'João', 'Tiago', 'Pedro', 'André', 'C', 'especialista', 'jesus', 30, 'Após a confissão de Pedro, Jesus declarou: "Tu és Pedro, e sobre esta pedra edificarei a minha igreja."', 'Mateus 16:18'),
  ('Em qual ilha João recebeu a revelação do Apocalipse?', 'Creta', 'Chipre', 'Patmos', 'Malta', 'C', 'especialista', 'novo_testamento', 30, 'João estava exilado na ilha de Patmos, por causa da Palavra, quando recebeu as visões do Apocalipse.', 'Apocalipse 1:9'),
  ('Quem foi a profetisa e juíza que liderou Israel na vitória sobre Sísera?', 'Ana', 'Débora', 'Hulda', 'Miriã', 'B', 'especialista', 'antigo_testamento', 30, 'Débora julgava Israel debaixo de uma palmeira e acompanhou Baraque na batalha contra Sísera.', 'Juízes 4:4-9'),
  ('Qual profeta se casou com uma mulher infiel como sinal do amor de Deus por Israel?', 'Joel', 'Oseias', 'Amós', 'Malaquias', 'B', 'especialista', 'profetas', 30, 'Deus ordenou a Oseias amar Gômer, retratando Seu amor fiel por um povo infiel.', 'Oseias 1:2-3; 3:1'),
  ('Quantas pragas Deus enviou sobre o Egito?', '7', '10', '12', '14', 'B', 'especialista', 'antigo_testamento', 30, 'Foram dez pragas, culminando na morte dos primogênitos e na instituição da Páscoa.', 'Êxodo 7-12'),
  ('Quem era o governador romano que sentenciou Jesus?', 'Herodes', 'César Augusto', 'Pôncio Pilatos', 'Félix', 'C', 'especialista', 'jesus', 30, 'Pilatos, não achando culpa em Jesus, ainda assim o entregou para ser crucificado, lavando as mãos.', 'Mateus 27:24-26'),
  ('Qual livro vem imediatamente antes dos Salmos?', 'Provérbios', 'Jó', 'Rute', 'Ester', 'B', 'especialista', 'antigo_testamento', 30, 'A ordem é Jó, Salmos, Provérbios — os primeiros dos livros poéticos.', 'Panorama bíblico'),
  ('Qual jovem dormiu durante a pregação de Paulo, caiu da janela e foi ressuscitado?', 'Timóteo', 'Êutico', 'Tíquico', 'Trófimo', 'B', 'especialista', 'novo_testamento', 30, 'Em Trôade, Êutico caiu do terceiro andar durante o longo discurso de Paulo, que o abraçou e o restituiu vivo.', 'Atos 20:9-12'),
  ('O que significa "Emanuel"?', 'Príncipe da Paz', 'Deus conosco', 'Salvador', 'Ungido', 'B', 'especialista', 'jesus', 30, 'O nome Emanuel, anunciado por Isaías e cumprido em Jesus, significa "Deus conosco".', 'Mateus 1:23'),
  ('Qual profeta era pastor de ovelhas e colhedor de sicômoros antes do chamado?', 'Miqueias', 'Amós', 'Naum', 'Sofonias', 'B', 'especialista', 'profetas', 30, 'Amós declarou: "Eu era pastor e colhedor de sicômoros; o Senhor me tirou de após o gado."', 'Amós 7:14-15')
) AS v(question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points, explanation, bible_reference)
WHERE NOT EXISTS (
  SELECT 1 FROM public.quiz_questions q WHERE q.question = v.question
);
