-- ============================================
-- +200 PERGUNTAS BÍBLICAS PARA QUIZ
-- Categorias: Reis, Mulheres, Salmos, Provérbios, Personagens, Sabedoria
-- Total após migração: 460 perguntas
-- ============================================

-- ============================================
-- CATEGORIA: REIS DE ISRAEL E JUDÁ (40 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES

-- Reis - Iniciante (10pts) - 15 perguntas
('Quem foi o primeiro rei de Israel?', 'Davi', 'Saul', 'Salomão', 'Samuel', 'B', 'iniciante', 'reis', 10),
('Quem foi o rei mais sábio de Israel?', 'Davi', 'Saul', 'Salomão', 'Josias', 'C', 'iniciante', 'reis', 10),
('Qual rei matou o gigante Golias?', 'Saul', 'Davi', 'Salomão', 'Josias', 'B', 'iniciante', 'reis', 10),
('Quem foi o pai do rei Salomão?', 'Saul', 'Samuel', 'Davi', 'Isaí', 'C', 'iniciante', 'reis', 10),
('Qual rei construiu o primeiro templo em Jerusalém?', 'Davi', 'Salomão', 'Ezequias', 'Josias', 'B', 'iniciante', 'reis', 10),

('Quem sucedeu Salomão como rei?', 'Roboão', 'Jeroboão', 'Davi', 'Abias', 'A', 'iniciante', 'reis', 10),
('Qual rei dividiu Israel em dois reinos?', 'Davi', 'Salomão', 'Roboão', 'Jeroboão', 'C', 'iniciante', 'reis', 10),
('Quem foi o rei que escreveu a maioria dos Salmos?', 'Salomão', 'Davi', 'Asafe', 'Moisés', 'B', 'iniciante', 'reis', 10),
('Qual rei foi ungido por Samuel quando ainda era jovem?', 'Saul', 'Davi', 'Salomão', 'Josias', 'B', 'iniciante', 'reis', 10),
('Quem era rei quando Jesus nasceu?', 'Herodes', 'Pilatos', 'César', 'Tibério', 'A', 'iniciante', 'reis', 10),

('Qual rei ficou famoso por sua riqueza?', 'Davi', 'Salomão', 'Josias', 'Ezequias', 'B', 'iniciante', 'reis', 10),
('Quem foi o último rei de Judá?', 'Josias', 'Joaquim', 'Zedequias', 'Jeoaquim', 'C', 'iniciante', 'reis', 10),
('Qual rei reformou o templo e encontrou o livro da Lei?', 'Ezequias', 'Josias', 'Asa', 'Joás', 'B', 'iniciante', 'reis', 10),
('Quem foi o rei gigante que Davi enfrentou?', 'Saul', 'Golias', 'Og', 'Sísera', 'B', 'iniciante', 'reis', 10),
('Qual rei teve 700 esposas e 300 concubinas?', 'Davi', 'Salomão', 'Roboão', 'Acabe', 'B', 'iniciante', 'reis', 10),

-- Reis - Profissional (20pts) - 15 perguntas
('Quantos anos Davi reinou sobre Israel?', '30', '33', '40', '50', 'C', 'profissional', 'reis', 20),
('Em que cidade Davi foi ungido rei pela primeira vez?', 'Jerusalém', 'Hebron', 'Belém', 'Gibeão', 'B', 'profissional', 'reis', 20),
('Qual rei morreu por consultar uma médium?', 'Saul', 'Manassés', 'Acabe', 'Jeroboão', 'A', 'profissional', 'reis', 20),
('Quem foi o rei que orou e Deus acrescentou 15 anos à sua vida?', 'Ezequias', 'Josias', 'Asa', 'Josafá', 'A', 'profissional', 'reis', 20),
('Qual rei se arrependeu após ser confrontado por Natã?', 'Saul', 'Davi', 'Salomão', 'Roboão', 'B', 'profissional', 'reis', 20),

('Quem foi o rei mais ímpio de Judá?', 'Acaz', 'Manassés', 'Jeoaquim', 'Acabe', 'B', 'profissional', 'reis', 20),
('Qual rei fez aliança com Jezabel?', 'Acabe', 'Jeroboão', 'Onri', 'Jorão', 'A', 'profissional', 'reis', 20),
('Quantas esposas Davi tinha?', '8', '10', '18', '100', 'A', 'profissional', 'reis', 20),
('Qual rei introduziu o culto ao bezerro de ouro em Israel?', 'Roboão', 'Jeroboão', 'Acabe', 'Onri', 'B', 'profissional', 'reis', 20),
('Quem foi o rei que purificou Judá e destruiu os altos?', 'Asa', 'Ezequias', 'Josias', 'Todos eles', 'D', 'profissional', 'reis', 20),

('Qual rei foi morto em Meguido?', 'Josias', 'Acazias', 'Jorão', 'Jeú', 'A', 'profissional', 'reis', 20),
('Quem matou o rei Acabe?', 'Jeú', 'Um arqueiro sírio', 'Eliseu', 'Hazael', 'B', 'profissional', 'reis', 20),
('Qual rei teve lepra?', 'Uzias', 'Jotão', 'Acaz', 'Ezequias', 'A', 'profissional', 'reis', 20),
('Quantos anos Salomão reinou?', '30', '33', '40', '50', 'C', 'profissional', 'reis', 20),
('Qual rei construiu Samaria?', 'Jeroboão', 'Onri', 'Acabe', 'Jeú', 'B', 'profissional', 'reis', 20),

-- Reis - Especialista (30pts) - 10 perguntas
('Qual era o nome da mãe do rei Salomão?', 'Bate-Seba', 'Abigail', 'Mical', 'Ainoã', 'A', 'especialista', 'reis', 30),
('Quantos anos tinha Josias quando começou a reinar?', '7', '8', '12', '16', 'B', 'especialista', 'reis', 30),
('Qual rei reinou apenas 7 dias?', 'Zinri', 'Elá', 'Acazias', 'Jorão', 'A', 'especialista', 'reis', 30),
('Quem foi o primeiro rei do reino do Norte (Israel)?', 'Roboão', 'Jeroboão', 'Nadabe', 'Baasa', 'B', 'especialista', 'reis', 30),
('Quantos filhos de Davi morreram durante seu reinado?', '2', '3', '4', '5', 'C', 'especialista', 'reis', 30),

('Qual rei fez o sol voltar 10 graus?', 'Josias', 'Ezequias', 'Asa', 'Josafá', 'B', 'especialista', 'reis', 30),
('Quem foi o rei mais jovem de Judá?', 'Joás (7 anos)', 'Josias (8 anos)', 'Jeoaquim (8 anos)', 'Manassés (12 anos)', 'A', 'especialista', 'reis', 30),
('Qual rei foi levado cativo para Babilônia em correntes?', 'Manassés', 'Joaquim', 'Zedequias', 'Jeoaquim', 'A', 'especialista', 'reis', 30),
('Quantos homens valentes Davi tinha?', '30', '37', '600', '1000', 'B', 'especialista', 'reis', 30),
('Qual rei teve os olhos vazados?', 'Joaquim', 'Zedequias', 'Jeoaquim', 'Acazias', 'B', 'especialista', 'reis', 30);

-- ============================================
-- CATEGORIA: MULHERES DA BÍBLIA (40 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES

-- Mulheres - Iniciante (10pts) - 15 perguntas
('Quem foi a primeira mulher criada por Deus?', 'Maria', 'Sara', 'Eva', 'Rute', 'C', 'iniciante', 'mulheres', 10),
('Quem foi a mãe de Jesus?', 'Isabel', 'Ana', 'Maria', 'Marta', 'C', 'iniciante', 'mulheres', 10),
('Quem foi a esposa de Abraão?', 'Rebeca', 'Sara', 'Raquel', 'Lia', 'B', 'iniciante', 'mulheres', 10),
('Qual mulher foi rainha de Israel e casada com Acabe?', 'Jezabel', 'Ester', 'Vasti', 'Atalia', 'A', 'iniciante', 'mulheres', 10),
('Quem foi a rainha que salvou o povo judeu?', 'Débora', 'Ester', 'Rute', 'Sara', 'B', 'iniciante', 'mulheres', 10),

('Qual mulher foi juíza em Israel?', 'Miriã', 'Débora', 'Ana', 'Hulda', 'B', 'iniciante', 'mulheres', 10),
('Quem foi a esposa de Moisés?', 'Miriã', 'Séfora', 'Raquel', 'Lia', 'B', 'iniciante', 'mulheres', 10),
('Qual moabita se tornou bisavó de Davi?', 'Ester', 'Rute', 'Noemi', 'Orfa', 'B', 'iniciante', 'mulheres', 10),
('Quem era a irmã de Moisés?', 'Débora', 'Ana', 'Miriã', 'Séfora', 'C', 'iniciante', 'mulheres', 10),
('Qual mulher ungiu os pés de Jesus com perfume?', 'Maria Madalena', 'Maria de Betânia', 'Marta', 'Joana', 'B', 'iniciante', 'mulheres', 10),

('Quem foi a primeira testemunha da ressurreição?', 'Maria, mãe de Jesus', 'Maria Madalena', 'Joana', 'Salomé', 'B', 'iniciante', 'mulheres', 10),
('Qual mulher teve um filho aos 90 anos?', 'Ana', 'Sara', 'Isabel', 'Raquel', 'B', 'iniciante', 'mulheres', 10),
('Quem foi a mãe de João Batista?', 'Ana', 'Maria', 'Isabel', 'Marta', 'C', 'iniciante', 'mulheres', 10),
('Qual mulher teve 12 anos de fluxo de sangue?', 'Não é mencionado', 'Maria', 'Marta', 'Ana', 'A', 'iniciante', 'mulheres', 10),
('Quem vendeu púrpura em Filipos?', 'Priscila', 'Lídia', 'Febe', 'Cloé', 'B', 'iniciante', 'mulheres', 10),

-- Mulheres - Profissional (20pts) - 15 perguntas
('Quantos filhos Ana pediu a Deus?', '1', '3', '6', '12', 'A', 'profissional', 'mulheres', 20),
('Qual era o nome da sogra de Rute?', 'Noemi', 'Orfa', 'Ana', 'Raquel', 'A', 'profissional', 'mulheres', 20),
('Quem era a profetisa na época de Josias?', 'Débora', 'Hulda', 'Miriã', 'Ana', 'B', 'profissional', 'mulheres', 20),
('Qual mulher escondeu os espias em Jericó?', 'Raabe', 'Rute', 'Débora', 'Ester', 'A', 'profissional', 'mulheres', 20),
('Quem foi a esposa de Isaque?', 'Sara', 'Rebeca', 'Raquel', 'Lia', 'B', 'profissional', 'mulheres', 20),

('Quantas esposas Jacó teve?', '1', '2', '4', '7', 'C', 'profissional', 'mulheres', 20),
('Qual era o nome da filha de Saul que se casou com Davi?', 'Mical', 'Merab', 'Tamar', 'Abigail', 'A', 'profissional', 'mulheres', 20),
('Quem foi a mulher sábia de Tecoa?', 'Não é mencionado', 'Abigail', 'Hulda', 'Débora', 'A', 'profissional', 'mulheres', 20),
('Qual mulher preparou comida para o profeta Elias?', 'Viúva de Sarepta', 'Viúva de Naim', 'Ana', 'Hulda', 'A', 'profissional', 'mulheres', 20),
('Quem foi a mãe de Samuel?', 'Ana', 'Noemi', 'Sara', 'Rebeca', 'A', 'profissional', 'mulheres', 20),

('Qual rainha visitou Salomão?', 'Rainha de Sabá', 'Ester', 'Vasti', 'Candace', 'A', 'profissional', 'mulheres', 20),
('Quem foi a esposa de Urias?', 'Abigail', 'Bate-Seba', 'Tamar', 'Mical', 'B', 'profissional', 'mulheres', 20),
('Qual mulher matou Sísera?', 'Débora', 'Jael', 'Miriã', 'Hulda', 'B', 'profissional', 'mulheres', 20),
('Quantas filhas de Ló existiram?', '2', '3', '4', '7', 'A', 'profissional', 'mulheres', 20),
('Qual mulher era diaconisa?', 'Priscila', 'Lídia', 'Febe', 'Cloé', 'C', 'profissional', 'mulheres', 20),

-- Mulheres - Especialista (30pts) - 10 perguntas
('Qual era o nome da serva de Sara?', 'Bila', 'Zilpa', 'Agar', 'Rute', 'C', 'especialista', 'mulheres', 30),
('Quantas filhas Ló tinha que eram casadas?', '0', '2', '3', 'Não especificado', 'A', 'especialista', 'mulheres', 30),
('Qual era o nome da mãe de Moisés?', 'Joquebede', 'Miriã', 'Séfora', 'Zípora', 'A', 'especialista', 'mulheres', 30),
('Quem foi a primeira polígama mencionada na Bíblia?', 'Lameque', 'Abraão', 'Jacó', 'Esaú', 'A', 'especialista', 'mulheres', 30),
('Qual mulher ressuscitou através de Pedro?', 'Tabita (Dorcas)', 'Lídia', 'Febe', 'Priscila', 'A', 'especialista', 'mulheres', 30),

('Quantos anos Ana era estéril?', 'Não especificado', '7', '12', '20', 'A', 'especialista', 'mulheres', 30),
('Qual era o nome da filha de Jefté?', 'Não é mencionado', 'Tamar', 'Mical', 'Ana', 'A', 'especialista', 'mulheres', 30),
('Quem foi a mãe de Sansão?', 'Não é mencionado', 'Débora', 'Ana', 'Dalila', 'A', 'especialista', 'mulheres', 30),
('Qual era a profissão de Lídia?', 'Vendedora de púrpura', 'Padeira', 'Tecelã', 'Pastora', 'A', 'especialista', 'mulheres', 30),
('Quem era a esposa de Áquila?', 'Febe', 'Priscila', 'Lídia', 'Cloé', 'B', 'especialista', 'mulheres', 30);

-- ============================================
-- CATEGORIA: SALMOS (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES

-- Salmos - Iniciante (10pts) - 12 perguntas
('Qual é o primeiro versículo do Salmo 23?', 'O Senhor é meu pastor', 'Bem-aventurado o homem', 'Louvai ao Senhor', 'Deus é nosso refúgio', 'A', 'iniciante', 'salmos', 10),
('Quantos salmos existem no livro de Salmos?', '100', '120', '150', '200', 'C', 'iniciante', 'salmos', 10),
('Qual salmo começa com "Bem-aventurado o homem"?', 'Salmo 1', 'Salmo 23', 'Salmo 91', 'Salmo 119', 'A', 'iniciante', 'salmos', 10),
('Qual é o salmo mais longo?', 'Salmo 23', 'Salmo 91', 'Salmo 119', 'Salmo 150', 'C', 'iniciante', 'salmos', 10),
('Quem escreveu a maioria dos Salmos?', 'Moisés', 'Salomão', 'Davi', 'Asafe', 'C', 'iniciante', 'salmos', 10),

('Qual salmo fala sobre proteção divina?', 'Salmo 1', 'Salmo 23', 'Salmo 91', 'Salmo 150', 'C', 'iniciante', 'salmos', 10),
('Qual salmo é conhecido como o salmo do pastor?', 'Salmo 1', 'Salmo 23', 'Salmo 100', 'Salmo 121', 'B', 'iniciante', 'salmos', 10),
('Qual é o último salmo?', 'Salmo 100', 'Salmo 119', 'Salmo 145', 'Salmo 150', 'D', 'iniciante', 'salmos', 10),
('Qual salmo diz "Louvai ao Senhor com harpa"?', 'Salmo 33', 'Salmo 98', 'Salmo 150', 'Todos eles', 'D', 'iniciante', 'salmos', 10),
('Qual salmo fala da criação dos céus?', 'Salmo 8', 'Salmo 19', 'Salmo 104', 'Todos eles', 'D', 'iniciante', 'salmos', 10),

('Qual salmo é um salmo de arrependimento?', 'Salmo 32', 'Salmo 51', 'Ambos', 'Nenhum', 'C', 'iniciante', 'salmos', 10),
('Qual salmo Jesus citou na cruz?', 'Salmo 22', 'Salmo 23', 'Salmo 69', 'Salmo 110', 'A', 'iniciante', 'salmos', 10),

-- Salmos - Profissional (20pts) - 12 perguntas
('Quantos versículos tem o Salmo 119?', '100', '119', '150', '176', 'D', 'profissional', 'salmos', 20),
('Quantos salmos foram escritos por Asafe?', '10', '12', '15', '73', 'B', 'profissional', 'salmos', 20),
('Qual salmo Davi escreveu após pecar com Bate-Seba?', 'Salmo 32', 'Salmo 38', 'Salmo 51', 'Salmo 103', 'C', 'profissional', 'salmos', 20),
('Quantos livros dividem o livro de Salmos?', '3', '5', '7', '10', 'B', 'profissional', 'salmos', 20),
('Qual é o salmo mais curto?', 'Salmo 23', 'Salmo 100', 'Salmo 117', 'Salmo 150', 'C', 'profissional', 'salmos', 20),

('Quantos versículos tem o Salmo 117?', '2', '3', '5', '10', 'A', 'profissional', 'salmos', 20),
('Qual salmo fala sobre os filhos como herança?', 'Salmo 103', 'Salmo 127', 'Salmo 128', 'Salmo 133', 'B', 'profissional', 'salmos', 20),
('Quantos salmos Moisés escreveu?', '1', '5', '10', 'Nenhum', 'A', 'profissional', 'salmos', 20),
('Qual é o único salmo escrito por Moisés?', 'Salmo 1', 'Salmo 90', 'Salmo 100', 'Salmo 119', 'B', 'profissional', 'salmos', 20),
('Quantos salmos são atribuídos a Salomão?', '1', '2', '3', '5', 'B', 'profissional', 'salmos', 20),

('Qual salmo fala da unidade dos irmãos?', 'Salmo 122', 'Salmo 127', 'Salmo 133', 'Salmo 134', 'C', 'profissional', 'salmos', 20),
('Quantos salmos são chamados de "Cânticos de Romagem"?', '10', '12', '15', '20', 'C', 'profissional', 'salmos', 20),

-- Salmos - Especialista (30pts) - 6 perguntas
('Qual é o versículo central da Bíblia?', 'Salmo 117:1', 'Salmo 118:8', 'Salmo 119:89', 'João 3:16', 'B', 'especialista', 'salmos', 30),
('Quantos salmos são acrósticos alfabéticos?', '5', '7', '9', '12', 'C', 'especialista', 'salmos', 30),
('Qual salmo é totalmente acróstico?', 'Salmo 111', 'Salmo 112', 'Salmo 119', 'Todos eles', 'D', 'especialista', 'salmos', 30),
('Quantos salmos são "Salmos de Aleluia"?', '12', '15', '18', '24', 'B', 'especialista', 'salmos', 30),
('Qual salmo termina cada um dos 5 livros de Salmos?', '41, 72, 89, 106, 150', '40, 80, 100, 120, 150', '50, 75, 90, 110, 150', 'Não há divisão', 'A', 'especialista', 'salmos', 30),
('Quantas vezes a palavra "Aleluia" aparece no Salmo 150?', '5', '7', '10', '13', 'D', 'especialista', 'salmos', 30);

-- ============================================
-- CATEGORIA: PROVÉRBIOS (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES

-- Provérbios - Iniciante (10pts) - 12 perguntas
('Quem escreveu a maioria dos Provérbios?', 'Davi', 'Salomão', 'Moisés', 'Asafe', 'B', 'iniciante', 'proverbios', 10),
('Quantos capítulos tem o livro de Provérbios?', '21', '28', '31', '40', 'C', 'iniciante', 'proverbios', 10),
('Qual é o princípio da sabedoria segundo Provérbios?', 'O amor', 'O temor do Senhor', 'A humildade', 'A fé', 'B', 'iniciante', 'proverbios', 10),
('Provérbios 31 fala sobre qual tipo de mulher?', 'Mulher tola', 'Mulher virtuosa', 'Mulher adúltera', 'Mulher estéril', 'B', 'iniciante', 'proverbios', 10),
('Qual animal Provérbios diz que devemos observar?', 'Formiga', 'Leão', 'Águia', 'Serpente', 'A', 'iniciante', 'proverbios', 10),

('"A resposta branda desvia o furor" - qual capítulo?', 'Provérbios 1', 'Provérbios 10', 'Provérbios 15', 'Provérbios 31', 'C', 'iniciante', 'proverbios', 10),
('Qual livro é chamado de livro da sabedoria?', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cantares', 'B', 'iniciante', 'proverbios', 10),
('"Confia no Senhor de todo teu coração" está em qual capítulo?', 'Provérbios 1', 'Provérbios 3', 'Provérbios 10', 'Provérbios 31', 'B', 'iniciante', 'proverbios', 10),
('Provérbios ensina principalmente sobre:', 'Profecia', 'História', 'Sabedoria prática', 'Leis', 'C', 'iniciante', 'proverbios', 10),
('Quantos provérbios Salomão proferiu?', '1.000', '3.000', '5.000', '10.000', 'B', 'iniciante', 'proverbios', 10),

('"O preguiçoso mete a mão no prato" aparece em qual livro?', 'Eclesiastes', 'Provérbios', 'Salmos', 'Cantares', 'B', 'iniciante', 'proverbios', 10),
('"Há caminho que ao homem parece direito" está em qual capítulo?', 'Provérbios 12', 'Provérbios 14', 'Provérbios 16', 'Provérbios 20', 'C', 'iniciante', 'proverbios', 10),

-- Provérbios - Profissional (20pts) - 12 perguntas
('Quantos provérbios são atribuídos a Agur?', 'Todo o capítulo 30', 'Versículos 1-9 cap 30', 'Não há', '1.000', 'A', 'profissional', 'proverbios', 20),
('Quem é Lemuel em Provérbios 31?', 'Um rei', 'Salomão', 'Um profeta', 'Não identificado', 'A', 'profissional', 'proverbios', 20),
('Quantas coisas são pequenas mas sábias segundo Provérbios 30?', '2', '4', '6', '7', 'B', 'profissional', 'proverbios', 20),
('Quantas coisas o olho nunca se farta segundo Provérbios?', '3', '4', '6', '7', 'B', 'profissional', 'proverbios', 20),
('"O temor do Senhor é o princípio da sabedoria" está em qual verso?', 'Prov 1:7', 'Prov 3:5', 'Prov 9:10', 'Ambas A e C', 'D', 'profissional', 'proverbios', 20),

('Quantos filhos a mulher virtuosa tem?', 'Não especificado', '2', '7', '12', 'A', 'profissional', 'proverbios', 20),
('"Como águas profundas são as palavras da boca do homem" - capítulo?', 'Prov 10', 'Prov 16', 'Prov 18', 'Prov 20', 'C', 'profissional', 'proverbios', 20),
('Quantas coisas Deus aborrece segundo Provérbios 6?', '3', '6', '7', '10', 'C', 'profissional', 'proverbios', 20),
('"O ferro com ferro se afia" está em qual capítulo?', 'Prov 15', 'Prov 20', 'Prov 27', 'Prov 31', 'C', 'profissional', 'proverbios', 20),
('Quantas vezes Provérbios menciona "preguiçoso"?', '5-10', '11-15', '16-20', 'Mais de 20', 'D', 'profissional', 'proverbios', 20),

('"Melhor é morar no deserto" está em qual capítulo?', 'Prov 19', 'Prov 21', 'Prov 25', 'Prov 27', 'B', 'profissional', 'proverbios', 20),
('Quantos capítulos foram copiados pelos homens de Ezequias?', '5', '10', '15', '25', 'A', 'profissional', 'proverbios', 20),

-- Provérbios - Especialista (30pts) - 6 perguntas
('Qual é o versículo mais longo de Provérbios?', 'Prov 7:14', 'Prov 24:3-4', 'Prov 31:10', 'Não há verso longo', 'A', 'especialista', 'proverbios', 30),
('Quantos provérbios numéricos existem?', '8', '10', '12', '15', 'C', 'especialista', 'proverbios', 30),
('"Seis coisas aborrece o Senhor, e a sétima a sua alma abomina" - quais?', 'Mentira, orgulho, assassinato, etc', 'Adultério, roubo, etc', 'Idolatria, feitiçaria, etc', 'Não especificado', 'A', 'especialista', 'proverbios', 30),
('Quantas vezes a palavra "sabedoria" aparece em Provérbios?', '50-60', '70-80', '90-100', 'Mais de 100', 'D', 'especialista', 'proverbios', 30),
('Provérbios 25-29 foram copiados por quem?', 'Homens de Salomão', 'Homens de Davi', 'Homens de Ezequias', 'Escribas de Josias', 'C', 'especialista', 'proverbios', 30),
('Quantos versículos tem Provérbios 31?', '22', '28', '31', '35', 'C', 'especialista', 'proverbios', 30);

-- ============================================
-- CATEGORIA: PERSONAGENS BÍBLICOS (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES

-- Personagens - Iniciante (10pts) - 12 perguntas
('Quem foi o primeiro homem criado?', 'Caim', 'Abel', 'Adão', 'Noé', 'C', 'iniciante', 'personagens', 10),
('Quem construiu a arca?', 'Moisés', 'Abraão', 'Noé', 'Davi', 'C', 'iniciante', 'personagens', 10),
('Quem foi vendido como escravo por seus irmãos?', 'Jacó', 'José', 'Benjamim', 'Judá', 'B', 'iniciante', 'personagens', 10),
('Quem abriu o Mar Vermelho?', 'Josué', 'Moisés', 'Arão', 'Elias', 'B', 'iniciante', 'personagens', 10),
('Quem foi o profeta levado ao céu numa carruagem de fogo?', 'Elias', 'Eliseu', 'Enoque', 'Moisés', 'A', 'iniciante', 'personagens', 10),

('Quem foi engolido por um grande peixe?', 'Pedro', 'Jonas', 'Noé', 'João', 'B', 'iniciante', 'personagens', 10),
('Quem foi o homem mais sábio?', 'Davi', 'Salomão', 'Daniel', 'José', 'B', 'iniciante', 'personagens', 10),
('Quem foi o homem mais forte?', 'Davi', 'Golias', 'Sansão', 'Josué', 'C', 'iniciante', 'personagens', 10),
('Quem foi traído por Dalila?', 'Sansão', 'Saul', 'Davi', 'Absalão', 'A', 'iniciante', 'personagens', 10),
('Quem negou Jesus 3 vezes?', 'João', 'Tiago', 'Pedro', 'Judas', 'C', 'iniciante', 'personagens', 10),

('Quem traiu Jesus por 30 moedas?', 'Pedro', 'João', 'Judas', 'Tomé', 'C', 'iniciante', 'personagens', 10),
('Quem escreveu mais cartas no Novo Testamento?', 'Pedro', 'Paulo', 'João', 'Tiago', 'B', 'iniciante', 'personagens', 10),

-- Personagens - Profissional (20pts) - 12 perguntas
('Quantos filhos Jacó teve?', '10', '12', '14', '7', 'B', 'profissional', 'personagens', 20),
('Quantos anos Noé viveu?', '365', '777', '950', '969', 'C', 'profissional', 'personagens', 20),
('Quem foi o homem mais velho da Bíblia?', 'Adão', 'Noé', 'Matusalém', 'Enoque', 'C', 'profissional', 'personagens', 20),
('Quantos anos Matusalém viveu?', '777', '895', '950', '969', 'D', 'profissional', 'personagens', 20),
('Quantos filhos Abraão teve?', '2', '8', '12', '70', 'B', 'profissional', 'personagens', 20),

('Qual era o outro nome de Jacó?', 'Israel', 'Judá', 'José', 'Abraão', 'A', 'profissional', 'personagens', 20),
('Qual era o outro nome de Paulo?', 'Simão', 'Saulo', 'Barnabé', 'Silas', 'B', 'profissional', 'personagens', 20),
('Quantos anos Moisés tinha quando morreu?', '100', '110', '120', '130', 'C', 'profissional', 'personagens', 20),
('Quem foi o sucessor de Moisés?', 'Josué', 'Arão', 'Calebe', 'Eleazar', 'A', 'profissional', 'personagens', 20),
('Quantos discípulos Jesus escolheu?', '10', '12', '70', '120', 'B', 'profissional', 'personagens', 20),

('Quem substituiu Judas Iscariotes?', 'Paulo', 'Barnabé', 'Matias', 'Timóteo', 'C', 'profissional', 'personagens', 20),
('Quantos irmãos José tinha?', '10', '11', '12', '13', 'B', 'profissional', 'personagens', 20),

-- Personagens - Especialista (30pts) - 6 perguntas
('Quantos anos Abraão tinha quando Isaque nasceu?', '75', '85', '90', '100', 'D', 'especialista', 'personagens', 30),
('Qual era o nome do pai de Abraão?', 'Terá', 'Naor', 'Harã', 'Sem', 'A', 'especialista', 'personagens', 30),
('Quantos filhos Adão e Eva tiveram mencionados?', '2', '3', 'Muitos', 'Não especificado', 'C', 'especialista', 'personagens', 30),
('Qual era o nome do bisavô de Noé?', 'Matusalém', 'Enoque', 'Jarede', 'Lameque', 'B', 'especialista', 'personagens', 30),
('Quantos anos Isaque viveu?', '147', '175', '180', '200', 'C', 'especialista', 'personagens', 30),
('Quem foi o pai de João Batista?', 'José', 'Zacarias', 'Simeão', 'Joaquim', 'B', 'especialista', 'personagens', 30);

-- ============================================
-- CATEGORIA: SABEDORIA (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES

-- Sabedoria - Iniciante (10pts) - 12 perguntas
('Qual é o princípio da sabedoria?', 'O amor', 'O temor do Senhor', 'A fé', 'A esperança', 'B', 'iniciante', 'sabedoria', 10),
('"Confia no Senhor de todo o teu coração" está em qual livro?', 'Salmos', 'Provérbios', 'Eclesiastes', 'João', 'B', 'iniciante', 'sabedoria', 10),
('Qual rei pediu sabedoria a Deus?', 'Davi', 'Saul', 'Salomão', 'Josias', 'C', 'iniciante', 'sabedoria', 10),
('"A resposta branda desvia o furor" está em qual livro?', 'Salmos', 'Provérbios', 'Tiago', 'Pedro', 'B', 'iniciante', 'sabedoria', 10),
('Qual livro é chamado de livro de sabedoria?', 'Salmos', 'Provérbios', 'Eclesiastes', 'Jó', 'B', 'iniciante', 'sabedoria', 10),

('"Tudo tem o seu tempo determinado" está em qual livro?', 'Provérbios', 'Eclesiastes', 'Jó', 'Tiago', 'B', 'iniciante', 'sabedoria', 10),
('"Se alguém necessita de sabedoria, peça a Deus" está em:', 'Provérbios', 'Eclesiastes', 'Tiago', '1 Coríntios', 'C', 'iniciante', 'sabedoria', 10),
('Quem escreveu Eclesiastes?', 'Davi', 'Salomão', 'Moisés', 'Jó', 'B', 'iniciante', 'sabedoria', 10),
('"Lâmpada para os meus pés é a tua palavra" está em:', 'Salmos', 'Provérbios', 'João', 'Hebreus', 'A', 'iniciante', 'sabedoria', 10),
('"O temor do Senhor é o princípio da ciência" - livro?', 'Provérbios', 'Salmos', 'Eclesiastes', 'Jó', 'A', 'iniciante', 'sabedoria', 10),

('Qual livro trata da questão do sofrimento?', 'Salmos', 'Provérbios', 'Jó', 'Lamentações', 'C', 'iniciante', 'sabedoria', 10),
('"Bem-aventurado o homem que acha sabedoria" - livro?', 'Salmos', 'Provérbios', 'Eclesiastes', 'Tiago', 'B', 'iniciante', 'sabedoria', 10),

-- Sabedoria - Profissional (20pts) - 12 perguntas
('Quantos amigos de Jó vieram consolá-lo?', '2', '3', '4', '7', 'B', 'profissional', 'sabedoria', 20),
('Quem foi o quarto amigo de Jó?', 'Bildade', 'Zofar', 'Eliú', 'Elifaz', 'C', 'profissional', 'sabedoria', 20),
('Quantos capítulos tem Eclesiastes?', '10', '12', '14', '31', 'B', 'profissional', 'sabedoria', 20),
('Quantos capítulos tem Jó?', '31', '40', '42', '50', 'C', 'profissional', 'sabedoria', 20),
('"Vaidade de vaidades, tudo é vaidade" está em:', 'Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'D', 'profissional', 'sabedoria', 20),

('"Há tempo de nascer e tempo de morrer" - capítulo?', 'Eclesiastes 1', 'Eclesiastes 3', 'Eclesiastes 12', 'Provérbios 3', 'B', 'profissional', 'sabedoria', 20),
('Quantos filhos Jó perdeu?', '7', '10', '12', '14', 'B', 'profissional', 'sabedoria', 20),
('Quantos filhos Jó tinha antes da provação?', '7 filhos e 3 filhas', '3 filhos e 7 filhas', '10 filhos', '5 filhos e 5 filhas', 'A', 'profissional', 'sabedoria', 20),
('"Lembra-te do teu Criador nos dias da tua mocidade" - livro?', 'Provérbios', 'Eclesiastes', 'Salmos', 'Cantares', 'B', 'profissional', 'sabedoria', 20),
('Quem disse "Nu saí do ventre de minha mãe"?', 'Salomão', 'Jó', 'Davi', 'Paulo', 'B', 'profissional', 'sabedoria', 20),

('"Adquire sabedoria, adquire inteligência" está em:', 'Provérbios 4', 'Salmos 19', 'Eclesiastes 7', 'Tiago 1', 'A', 'profissional', 'sabedoria', 20),
('Qual livro menciona "um tempo para cada propósito"?', 'Provérbios', 'Eclesiastes', 'Jó', 'Salmos', 'B', 'profissional', 'sabedoria', 20),

-- Sabedoria - Especialista (30pts) - 6 perguntas
('Quantas vezes Jó foi restaurado?', 'O dobro', 'O triplo', 'Igual ao que tinha', 'Não foi restaurado', 'A', 'especialista', 'sabedoria', 30),
('Quantos anos Jó viveu após sua restauração?', '70', '100', '120', '140', 'D', 'especialista', 'sabedoria', 30),
('Quantas coisas há "debaixo do céu" em Eclesiastes 3?', '14', '24', '28', '30', 'C', 'especialista', 'sabedoria', 30),
('Qual era a terra de Jó?', 'Uz', 'Ur', 'Edom', 'Sabá', 'A', 'especialista', 'sabedoria', 30),
('Quantos capítulos Deus fala com Jó?', '2', '3', '4', '5', 'C', 'especialista', 'sabedoria', 30),
('"O fim de uma coisa é melhor que o princípio" - livro?', 'Provérbios', 'Eclesiastes', 'Jó', 'Salmos', 'B', 'especialista', 'sabedoria', 30);

-- Total: +200 perguntas
-- Total geral no banco: 460 perguntas (260 anteriores + 200 novas)
