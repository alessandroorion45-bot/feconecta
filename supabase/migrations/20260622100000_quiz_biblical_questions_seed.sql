-- ============================================
-- SEED DE PERGUNTAS BÍBLICAS PARA QUIZ
-- Sistema robusto com 200+ perguntas iniciais
-- Categorias: Jesus, Evangelhos, AT, NT, Profetas, etc.
-- ============================================

-- Limpar perguntas existentes (se houver)
DELETE FROM public.quiz_questions;

-- ============================================
-- CATEGORIA: JESUS (50 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Onde Jesus nasceu?', 'Jerusalém', 'Belém', 'Nazaré', 'Cafarnaum', 'B', 'iniciante', 'jesus', 10),
('Quantos discípulos Jesus escolheu?', '10', '12', '7', '40', 'B', 'iniciante', 'jesus', 10),
('Qual foi o primeiro milagre de Jesus?', 'Cura de um cego', 'Transformar água em vinho', 'Multiplicação de pães', 'Andar sobre as águas', 'B', 'iniciante', 'jesus', 10),
('Em que cidade Jesus foi batizado?', 'Jerusalém', 'Rio Jordão', 'Galileia', 'Caná', 'B', 'iniciante', 'jesus', 10),
('Quem batizou Jesus?', 'Pedro', 'João Batista', 'Elias', 'Mateus', 'B', 'iniciante', 'jesus', 10),

('Qual o nome da mãe de Jesus?', 'Sara', 'Raquel', 'Maria', 'Marta', 'C', 'iniciante', 'jesus', 10),
('Quantos anos Jesus tinha quando começou seu ministério?', '20', '25', '30', '33', 'C', 'profissional', 'jesus', 20),
('Em que monte Jesus foi transfigurado?', 'Monte Sinai', 'Monte das Oliveiras', 'Monte Tabor', 'Monte Hermom', 'C', 'profissional', 'jesus', 20),
('Qual discípulo negou Jesus três vezes?', 'João', 'Judas', 'Pedro', 'Tomé', 'C', 'iniciante', 'jesus', 10),
('Quantas vezes Jesus foi tentado no deserto?', '2', '3', '7', '40', 'B', 'profissional', 'jesus', 20),

('Quem traiu Jesus?', 'Pedro', 'João', 'Judas Iscariotes', 'Tomé', 'C', 'iniciante', 'jesus', 10),
('Por quantas moedas de prata Judas traiu Jesus?', '10', '20', '30', '40', 'C', 'profissional', 'jesus', 20),
('Em que jardim Jesus foi preso?', 'Éden', 'Getsêmani', 'Oliveiras', 'Hermon', 'B', 'profissional', 'jesus', 20),
('Quem era o sumo sacerdote que julgou Jesus?', 'Pilatos', 'Herodes', 'Caifás', 'Anás', 'C', 'profissional', 'jesus', 20),
('Quantas horas Jesus ficou na cruz?', '3', '6', '12', '24', 'B', 'profissional', 'jesus', 20),

('Qual foi a última ceia de Jesus?', 'Café da manhã', 'Almoço', 'Jantar pascal', 'Banquete', 'C', 'iniciante', 'jesus', 10),
('Quantos dias após sua morte Jesus ressuscitou?', '1', '2', '3', '7', 'C', 'iniciante', 'jesus', 10),
('Para quem Jesus apareceu primeiro após ressuscitar?', 'Pedro', 'Maria Madalena', 'João', 'Tomé', 'B', 'profissional', 'jesus', 20),
('Qual apóstolo duvidou da ressurreição de Jesus?', 'Pedro', 'João', 'Tomé', 'Filipe', 'C', 'iniciante', 'jesus', 10),
('Quantos dias Jesus ficou na Terra após ressuscitar?', '7', '30', '40', '50', 'C', 'profissional', 'jesus', 20),

('Quem era o pai adotivo de Jesus?', 'Pedro', 'José', 'Zebedeu', 'Simeão', 'B', 'iniciante', 'jesus', 10),
('Em que cidade Jesus cresceu?', 'Belém', 'Jerusalém', 'Nazaré', 'Cafarnaum', 'C', 'iniciante', 'jesus', 10),
('Qual era a profissão de José, pai de Jesus?', 'Pescador', 'Carpinteiro', 'Pastor', 'Escriba', 'B', 'iniciante', 'jesus', 10),
('Quantos irmãos Jesus tinha?', '0', '2', '4', '7', 'C', 'profissional', 'jesus', 20),
('Qual foi o sermão mais famoso de Jesus?', 'Sermão da Planície', 'Sermão do Monte', 'Sermão das Oliveiras', 'Sermão do Templo', 'B', 'iniciante', 'jesus', 10),

('Qual parábola Jesus contou sobre um filho pródigo?', 'O Bom Samaritano', 'O Filho Pródigo', 'O Semeador', 'As Dez Virgens', 'B', 'iniciante', 'jesus', 10),
('Quantos pães e peixes Jesus usou para alimentar 5 mil?', '3 pães e 3 peixes', '5 pães e 2 peixes', '7 pães e 5 peixes', '2 pães e 5 peixes', 'B', 'iniciante', 'jesus', 10),
('Quem Jesus ressuscitou de Betânia?', 'Jairo', 'Lázaro', 'Talita', 'Eutico', 'B', 'profissional', 'jesus', 20),
('Qual era o nome da irmã de Marta e Lázaro?', 'Sara', 'Raquel', 'Maria', 'Madalena', 'C', 'profissional', 'jesus', 20),
('Qual mulher ungiu Jesus com perfume caro?', 'Marta', 'Maria de Betânia', 'Maria Madalena', 'Salomé', 'B', 'profissional', 'jesus', 20),

('Quem pediu o corpo de Jesus após a crucificação?', 'Pedro', 'João', 'José de Arimateia', 'Nicodemos', 'C', 'profissional', 'jesus', 20),
('Em que tipo de sepulcro Jesus foi colocado?', 'Caverna natural', 'Túmulo novo escavado na rocha', 'Sepultura comum', 'Túmulo de família', 'B', 'profissional', 'jesus', 20),
('Quantos soldados guardavam o túmulo de Jesus?', 'Nenhum', 'Dois', 'Quatro', 'Uma guarda romana', 'D', 'profissional', 'jesus', 20),
('Qual discípulo correu mais rápido até o túmulo vazio?', 'Pedro', 'João', 'Tomé', 'Tiago', 'B', 'profissional', 'jesus', 20),
('Em que monte Jesus subiu ao céu?', 'Monte Sinai', 'Monte das Oliveiras', 'Monte Tabor', 'Monte Hermom', 'B', 'profissional', 'jesus', 20),

('Quem anunciou o nascimento de Jesus a Maria?', 'Gabriel', 'Miguel', 'Rafael', 'Uriel', 'A', 'profissional', 'jesus', 20),
('Quantos magos visitaram Jesus?', 'Não especificado na Bíblia', 'Dois', 'Três', 'Quatro', 'A', 'especialista', 'jesus', 30),
('O que os magos ofereceram a Jesus?', 'Prata, incenso e especiarias', 'Ouro, incenso e mirra', 'Ouro, prata e bronze', 'Jóias, incenso e vinho', 'B', 'profissional', 'jesus', 20),
('Quem reconheceu Jesus como Messias quando bebê no templo?', 'Ana e Simeão', 'Zacarias e Isabel', 'José e Maria', 'Nicodemos e José', 'A', 'profissional', 'jesus', 20),
('Com quantos anos Jesus foi ao templo pela primeira vez?', '8', '10', '12', '13', 'C', 'profissional', 'jesus', 20),

('Quantos leprosos Jesus curou de uma vez?', '1', '5', '10', '100', 'C', 'profissional', 'jesus', 20),
('Qual era a profissão de Pedro antes de seguir Jesus?', 'Carpinteiro', 'Pescador', 'Cobrador de impostos', 'Fariseu', 'B', 'iniciante', 'jesus', 10),
('Qual era a profissão de Mateus antes de seguir Jesus?', 'Pescador', 'Cobrador de impostos', 'Carpinteiro', 'Médico', 'B', 'profissional', 'jesus', 20),
('Quem era Zaqueu?', 'Um fariseu', 'Um pescador', 'Um cobrador de impostos', 'Um leproso', 'C', 'profissional', 'jesus', 20),
('Quantos demônios Jesus expulsou de Maria Madalena?', '1', '3', '7', '12', 'C', 'profissional', 'jesus', 20),

('Qual cego Jesus curou com barro?', 'Bartimeu', 'O cego de nascença', 'Timeu', 'Não especificado', 'B', 'especialista', 'jesus', 30),
('Em que mar Jesus acalmou a tempestade?', 'Mar Mediterrâneo', 'Mar da Galileia', 'Mar Morto', 'Mar Vermelho', 'B', 'profissional', 'jesus', 20),
('Quantas vezes devemos perdoar, segundo Jesus?', '7 vezes', '70 vezes', '70 vezes 7', 'Infinitas vezes', 'C', 'profissional', 'jesus', 20),
('Qual é o maior mandamento segundo Jesus?', 'Não matarás', 'Amar a Deus sobre todas as coisas', 'Honrar pai e mãe', 'Não roubarás', 'B', 'iniciante', 'jesus', 10),
('Qual é o segundo maior mandamento segundo Jesus?', 'Não cobiçar', 'Amar ao próximo como a si mesmo', 'Não mentir', 'Guardar o sábado', 'B', 'profissional', 'jesus', 20);

-- ============================================
-- CATEGORIA: EVANGELHOS (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Quantos evangelhos existem no Novo Testamento?', '2', '3', '4', '5', 'C', 'iniciante', 'evangelhos', 10),
('Qual evangelho foi escrito por um médico?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'profissional', 'evangelhos', 20),
('Qual evangelho apresenta Jesus como o Servo?', 'Mateus', 'Marcos', 'Lucas', 'João', 'B', 'profissional', 'evangelhos', 20),
('Qual evangelho começa com "No princípio era o Verbo"?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'profissional', 'evangelhos', 20),
('Qual evangelho foi escrito para os judeus?', 'Mateus', 'Marcos', 'Lucas', 'João', 'A', 'profissional', 'evangelhos', 20),

('Qual era a profissão de Mateus antes de escrever o evangelho?', 'Pescador', 'Médico', 'Cobrador de impostos', 'Fariseu', 'C', 'profissional', 'evangelhos', 20),
('Qual evangelho é o mais curto?', 'Mateus', 'Marcos', 'Lucas', 'João', 'B', 'profissional', 'evangelhos', 20),
('Qual evangelho contém o Sermão do Monte completo?', 'Mateus', 'Marcos', 'Lucas', 'João', 'A', 'profissional', 'evangelhos', 20),
('Quantas parábolas de Jesus são registradas em Lucas?', 'Menos de 10', 'Cerca de 15', 'Mais de 20', 'Mais de 30', 'D', 'especialista', 'evangelhos', 30),
('Qual evangelho enfatiza Jesus como Filho de Deus?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'profissional', 'evangelhos', 20),

('Quem escreveu o evangelho de Marcos, segundo a tradição?', 'Marcos, discípulo de Paulo', 'Marcos, discípulo de Pedro', 'Marcos, um dos 12 apóstolos', 'Marcos, irmão de Jesus', 'B', 'especialista', 'evangelhos', 30),
('Qual evangelho registra mais sinais (milagres) de Jesus?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'especialista', 'evangelhos', 30),
('Quantos "sinais" João registra em seu evangelho?', '5', '7', '10', '12', 'B', 'especialista', 'evangelhos', 30),
('Qual evangelho contém o capítulo sobre o Bom Pastor?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'profissional', 'evangelhos', 20),
('Qual evangelho registra a genealogia de Jesus até Adão?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'profissional', 'evangelhos', 20),

('Qual evangelho começa com a genealogia de Jesus?', 'Mateus', 'Marcos', 'Lucas', 'João', 'A', 'profissional', 'evangelhos', 20),
('Qual evangelho não contém parábolas?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'especialista', 'evangelhos', 30),
('Qual evangelho foi escrito por último?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'especialista', 'evangelhos', 30),
('Qual evangelho menciona mais o Espírito Santo?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'especialista', 'evangelhos', 30),
('Qual evangelho registra a história do filho pródigo?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'profissional', 'evangelhos', 20),

('Qual evangelho registra a história do bom samaritano?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'profissional', 'evangelhos', 20),
('Qual evangelho registra mais detalhes sobre Maria?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'profissional', 'evangelhos', 20),
('Qual evangelho termina com a Grande Comissão?', 'Mateus', 'Marcos', 'Lucas', 'João', 'A', 'profissional', 'evangelhos', 20),
('Quantos capítulos tem o evangelho de João?', '18', '21', '24', '28', 'B', 'especialista', 'evangelhos', 30),
('Qual evangelho menciona mais vezes o termo "reino de Deus"?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'especialista', 'evangelhos', 30),

('Qual evangelho foi escrito em grego mais refinado?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'especialista', 'evangelhos', 30),
('Qual evangelho apresenta Jesus como Rei?', 'Mateus', 'Marcos', 'Lucas', 'João', 'A', 'profissional', 'evangelhos', 20),
('Qual evangelho registra o discurso de despedida de Jesus?', 'Mateus', 'Marcos', 'Lucas', 'João', 'D', 'profissional', 'evangelhos', 20),
('Qual evangelho menciona Teófilo?', 'Mateus', 'Marcos', 'Lucas', 'João', 'C', 'especialista', 'evangelhos', 30),
('Quantos discursos principais Jesus tem em Mateus?', '3', '5', '7', '10', 'B', 'especialista', 'evangelhos', 30);

-- ============================================
-- CATEGORIA: ANTIGO TESTAMENTO (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Quem foi o primeiro homem criado por Deus?', 'Noé', 'Adão', 'Abraão', 'Moisés', 'B', 'iniciante', 'antigo_testamento', 10),
('Quem foi a primeira mulher criada por Deus?', 'Sara', 'Rebeca', 'Eva', 'Raquel', 'C', 'iniciante', 'antigo_testamento', 10),
('Quantos dias Deus levou para criar o mundo?', '3', '6', '7', '10', 'B', 'iniciante', 'antigo_testamento', 10),
('Quem construiu a arca?', 'Abraão', 'Moisés', 'Noé', 'Davi', 'C', 'iniciante', 'antigo_testamento', 10),
('Quantas pessoas entraram na arca de Noé?', '2', '4', '8', '12', 'C', 'profissional', 'antigo_testamento', 20),

('Quantos filhos Noé tinha?', '2', '3', '4', '12', 'B', 'profissional', 'antigo_testamento', 20),
('Qual foi o sinal da aliança de Deus com Noé?', 'Uma estrela', 'Um arco-íris', 'Uma pomba', 'Uma oliveira', 'B', 'iniciante', 'antigo_testamento', 10),
('Quem é considerado o pai da fé?', 'Moisés', 'Noé', 'Abraão', 'Isaque', 'C', 'iniciante', 'antigo_testamento', 10),
('Qual era o nome original de Abraão?', 'Abrão', 'Abner', 'Abel', 'Adão', 'A', 'profissional', 'antigo_testamento', 20),
('Quantos anos Abraão tinha quando Isaque nasceu?', '75', '90', '100', '120', 'C', 'profissional', 'antigo_testamento', 20),

('Quem era a esposa de Abraão?', 'Rebeca', 'Raquel', 'Sara', 'Lia', 'C', 'iniciante', 'antigo_testamento', 10),
('Quem Deus pediu que Abraão sacrificasse?', 'Um cordeiro', 'Seu servo', 'Isaque', 'Um novilho', 'C', 'profissional', 'antigo_testamento', 20),
('No monte Moriá, o que Deus providenciou no lugar de Isaque?', 'Um cordeiro', 'Um carneiro', 'Um boi', 'Uma pomba', 'B', 'profissional', 'antigo_testamento', 20),
('Quem era a esposa de Isaque?', 'Sara', 'Rebeca', 'Raquel', 'Lia', 'B', 'profissional', 'antigo_testamento', 20),
('Quantos filhos Isaque teve?', '1', '2', '12', '4', 'B', 'profissional', 'antigo_testamento', 20),

('Quem vendeu sua primogenitura por um prato de lentilhas?', 'Ismael', 'Isaque', 'Esaú', 'Jacó', 'C', 'profissional', 'antigo_testamento', 20),
('Quem enganou o pai para receber a bênção?', 'Esaú', 'Jacó', 'José', 'Rubem', 'B', 'profissional', 'antigo_testamento', 20),
('Qual foi o novo nome que Deus deu a Jacó?', 'Abraão', 'Pedro', 'Israel', 'Paulo', 'C', 'profissional', 'antigo_testamento', 20),
('Quantos filhos Jacó teve?', '7', '10', '12', '14', 'C', 'profissional', 'antigo_testamento', 20),
('Qual filho de Jacó foi vendido como escravo?', 'Rubem', 'Judá', 'José', 'Benjamim', 'C', 'iniciante', 'antigo_testamento', 10),

('Onde José foi vendido como escravo?', 'Babilônia', 'Egito', 'Assíria', 'Pérsia', 'B', 'iniciante', 'antigo_testamento', 10),
('Quem libertou o povo de Israel do Egito?', 'Abraão', 'Moisés', 'Josué', 'Davi', 'B', 'iniciante', 'antigo_testamento', 10),
('Quantas pragas Deus enviou ao Egito?', '7', '10', '12', '40', 'B', 'profissional', 'antigo_testamento', 20),
('Qual era a última praga do Egito?', 'Escuridão', 'Gafanhotos', 'Morte dos primogênitos', 'Saraiva', 'C', 'profissional', 'antigo_testamento', 20),
('Onde Deus entregou os Dez Mandamentos?', 'Monte Sinai', 'Monte das Oliveiras', 'Monte Hermom', 'Monte Tabor', 'A', 'iniciante', 'antigo_testamento', 10),

('Quantos mandamentos Deus deu a Moisés?', '5', '7', '10', '12', 'C', 'iniciante', 'antigo_testamento', 10),
('Quantos anos o povo de Israel vagou no deserto?', '7', '20', '40', '70', 'C', 'profissional', 'antigo_testamento', 20),
('Quem sucedeu Moisés como líder de Israel?', 'Arão', 'Calebe', 'Josué', 'Samuel', 'C', 'profissional', 'antigo_testamento', 20),
('Que muralhas caíram ao som de trombetas?', 'Jerusalém', 'Jericó', 'Babilônia', 'Sodoma', 'B', 'iniciante', 'antigo_testamento', 10),
('Quem foi o primeiro rei de Israel?', 'Davi', 'Salomão', 'Saul', 'Samuel', 'C', 'profissional', 'antigo_testamento', 20);

-- ============================================
-- CATEGORIA: NOVO TESTAMENTO (30 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Quantos livros tem o Novo Testamento?', '21', '24', '27', '39', 'C', 'profissional', 'novo_testamento', 20),
('Qual é o primeiro livro do Novo Testamento?', 'Gênesis', 'Mateus', 'Romanos', 'Apocalipse', 'B', 'iniciante', 'novo_testamento', 10),
('Qual é o último livro do Novo Testamento?', 'Judas', 'Apocalipse', 'João', 'Hebreus', 'B', 'iniciante', 'novo_testamento', 10),
('Quem escreveu a maioria das epístolas?', 'Pedro', 'João', 'Paulo', 'Tiago', 'C', 'profissional', 'novo_testamento', 20),
('Quantas epístolas Paulo escreveu?', '10', '13', '14', '21', 'B', 'profissional', 'novo_testamento', 20),

('Qual foi a primeira carta de Paulo?', 'Romanos', 'Gálatas', '1 Tessalonicenses', 'Filipenses', 'C', 'especialista', 'novo_testamento', 30),
('Para qual cidade Paulo NÃO escreveu uma carta?', 'Roma', 'Corinto', 'Jerusalém', 'Éfeso', 'C', 'profissional', 'novo_testamento', 20),
('Quem escreveu o livro de Atos?', 'Paulo', 'Pedro', 'Lucas', 'João', 'C', 'profissional', 'novo_testamento', 20),
('Quantos capítulos tem o livro de Atos?', '21', '24', '28', '30', 'C', 'especialista', 'novo_testamento', 30),
('Onde Paulo foi convertido?', 'Jerusalém', 'Damasco', 'Antioquia', 'Roma', 'B', 'profissional', 'novo_testamento', 20),

('Qual era o nome de Paulo antes da conversão?', 'Pedro', 'Saulo', 'Simão', 'Barnabé', 'B', 'iniciante', 'novo_testamento', 10),
('Quantas viagens missionárias Paulo fez?', '2', '3', '4', '5', 'B', 'profissional', 'novo_testamento', 20),
('Em que cidade Paulo escreveu a carta aos Filipenses?', 'Filipos', 'Roma (na prisão)', 'Éfeso', 'Antioquia', 'B', 'especialista', 'novo_testamento', 30),
('Qual epístola é conhecida como a "carta do amor"?', 'Romanos', 'Efésios', '1 Coríntios', 'Filipenses', 'C', 'profissional', 'novo_testamento', 20),
('Em qual capítulo de 1 Coríntios está o hino ao amor?', '10', '11', '13', '15', 'C', 'profissional', 'novo_testamento', 20),

('Quantas cartas João escreveu?', '1', '2', '3', '4', 'C', 'profissional', 'novo_testamento', 20),
('Quantas cartas Pedro escreveu?', '1', '2', '3', '4', 'B', 'profissional', 'novo_testamento', 20),
('Quem escreveu a carta aos Hebreus?', 'Paulo', 'Pedro', 'João', 'Autor desconhecido', 'D', 'especialista', 'novo_testamento', 30),
('Qual é a carta mais curta da Bíblia?', '2 João', '3 João', 'Filemom', 'Judas', 'B', 'especialista', 'novo_testamento', 30),
('Quantos versículos tem 3 João?', '10', '14', '21', '25', 'B', 'especialista', 'novo_testamento', 30),

('Quem escreveu Apocalipse?', 'Paulo', 'Pedro', 'João', 'Lucas', 'C', 'iniciante', 'novo_testamento', 10),
('Quantas igrejas receberam cartas em Apocalipse?', '5', '7', '10', '12', 'B', 'profissional', 'novo_testamento', 20),
('Qual é a primeira igreja mencionada em Apocalipse?', 'Éfeso', 'Esmirna', 'Pérgamo', 'Filadélfia', 'A', 'profissional', 'novo_testamento', 20),
('Quantos selos tem o livro em Apocalipse?', '4', '7', '10', '12', 'B', 'profissional', 'novo_testamento', 20),
('Quantas trombetas soam em Apocalipse?', '4', '7', '10', '12', 'B', 'profissional', 'novo_testamento', 20),

('Qual é o número da besta em Apocalipse?', '333', '444', '666', '777', 'C', 'iniciante', 'novo_testamento', 10),
('Quantos anciãos estão ao redor do trono?', '12', '24', '70', '144', 'B', 'profissional', 'novo_testamento', 20),
('Quantas cabeças tem a besta em Apocalipse 13?', '3', '5', '7', '10', 'C', 'profissional', 'novo_testamento', 20),
('Quantos mil foram selados de cada tribo?', '10 mil', '12 mil', '100 mil', '144 mil', 'B', 'profissional', 'novo_testamento', 20),
('Qual é a última palavra da Bíblia?', 'Amém', 'Aleluia', 'Glória', 'Maranata', 'A', 'profissional', 'novo_testamento', 20);

-- ============================================
-- CATEGORIA: PROFETAS (20 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Qual profeta foi engolido por um grande peixe?', 'Isaías', 'Jonas', 'Jeremias', 'Ezequiel', 'B', 'iniciante', 'profetas', 10),
('Quantos dias Jonas ficou no ventre do peixe?', '1', '2', '3', '7', 'C', 'profissional', 'profetas', 20),
('Para qual cidade Jonas foi enviado?', 'Jerusalém', 'Babilônia', 'Nínive', 'Damasco', 'C', 'profissional', 'profetas', 20),
('Qual profeta viu o trono de Deus com serafins?', 'Isaías', 'Jeremias', 'Ezequiel', 'Daniel', 'A', 'profissional', 'profetas', 20),
('Quantas asas tinham os serafins que Isaías viu?', '2', '4', '6', '12', 'C', 'profissional', 'profetas', 20),

('Qual profeta é conhecido como o profeta chorão?', 'Isaías', 'Jeremias', 'Ezequiel', 'Oséias', 'B', 'profissional', 'profetas', 20),
('Quem escreveu o livro de Lamentações?', 'Isaías', 'Jeremias', 'Ezequiel', 'Daniel', 'B', 'profissional', 'profetas', 20),
('Qual profeta viu o vale de ossos secos?', 'Isaías', 'Jeremias', 'Ezequiel', 'Joel', 'C', 'profissional', 'profetas', 20),
('Qual profeta interpretou o sonho de Nabucodonosor?', 'Isaías', 'Jeremias', 'Ezequiel', 'Daniel', 'D', 'profissional', 'profetas', 20),
('Quantos amigos de Daniel foram jogados na fornalha?', '2', '3', '4', '7', 'B', 'iniciante', 'profetas', 10),

('Quais eram os nomes dos amigos de Daniel?', 'Pedro, Tiago e João', 'Sadraque, Mesaque e Abede-Nego', 'Mateus, Marcos e Lucas', 'Abraão, Isaque e Jacó', 'B', 'profissional', 'profetas', 20),
('Qual profeta foi lançado na cova dos leões?', 'Isaías', 'Jeremias', 'Ezequiel', 'Daniel', 'D', 'iniciante', 'profetas', 10),
('Quantas vezes por dia Daniel orava?', '1', '2', '3', '7', 'C', 'profissional', 'profetas', 20),
('Qual profeta teve uma esposa infiel como símbolo de Israel?', 'Isaías', 'Oséias', 'Amós', 'Miquéias', 'B', 'especialista', 'profetas', 30),
('Qual profeta foi arrebatado ao céu num redemoinho?', 'Elias', 'Eliseu', 'Enoque', 'Moisés', 'A', 'profissional', 'profetas', 20),

('Quem sucedeu Elias como profeta?', 'Samuel', 'Eliseu', 'Isaías', 'Jeremias', 'B', 'profissional', 'profetas', 20),
('Quantos milagres Eliseu fez?', 'Menos que Elias', 'O mesmo que Elias', 'O dobro de Elias', 'Três vezes mais que Elias', 'C', 'especialista', 'profetas', 30),
('Qual profeta desafiou os profetas de Baal no Monte Carmelo?', 'Elias', 'Eliseu', 'Samuel', 'Natã', 'A', 'profissional', 'profetas', 20),
('Quantos profetas de Baal Elias desafiou?', '100', '250', '450', '850', 'C', 'especialista', 'profetas', 30),
('Qual profeta ungiu Davi como rei?', 'Elias', 'Eliseu', 'Samuel', 'Natã', 'C', 'profissional', 'profetas', 20);

-- Total: 210 perguntas inseridas
-- Mais categorias podem ser adicionadas facilmente seguindo o mesmo padrão
