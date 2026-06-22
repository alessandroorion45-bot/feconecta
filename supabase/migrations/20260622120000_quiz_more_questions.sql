-- ============================================
-- MAIS 50 PERGUNTAS BÍBLICAS PARA QUIZ
-- Categorias: Milagres, Parábolas, Apóstolos, Mulheres, Sabedoria
-- ============================================

-- ============================================
-- CATEGORIA: MILAGRES DE JESUS (20 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Qual foi o primeiro milagre de Jesus?', 'Cura de um cego', 'Transformar água em vinho', 'Multiplicação de pães', 'Andar sobre as águas', 'B', 'iniciante', 'milagres', 10),
('Onde Jesus transformou água em vinho?', 'Belém', 'Nazaré', 'Caná da Galileia', 'Cafarnaum', 'C', 'profissional', 'milagres', 20),
('Quantas cestas sobraram na multiplicação dos pães para 5 mil?', '7', '10', '12', '15', 'C', 'profissional', 'milagres', 20),
('Quantas cestas sobraram na multiplicação para 4 mil?', '5', '7', '10', '12', 'B', 'especialista', 'milagres', 30),
('Qual cego Jesus curou com barro?', 'Bartimeu', 'O cego de Jericó', 'O cego de nascença', 'Timeu', 'C', 'profissional', 'milagres', 20),

('Em que mar Jesus acalmou a tempestade?', 'Mar Mediterrâneo', 'Mar da Galileia', 'Mar Morto', 'Mar Vermelho', 'B', 'iniciante', 'milagres', 10),
('Qual foi o nome do homem que Jesus ressuscitou em Betânia?', 'Jairo', 'Lázaro', 'Eutico', 'Tabita', 'B', 'iniciante', 'milagres', 10),
('Quantos dias Lázaro estava morto quando Jesus o ressuscitou?', '1', '2', '4', '7', 'C', 'profissional', 'milagres', 20),
('Qual era o nome da filha de Jairo que Jesus ressuscitou?', 'Não é mencionado', 'Maria', 'Marta', 'Raquel', 'A', 'especialista', 'milagres', 30),
('Quantos anos tinha a filha de Jairo?', '7', '10', '12', '15', 'C', 'profissional', 'milagres', 20),

('Qual era o nome do paralítico de Betesda?', 'Não é mencionado', 'João', 'Pedro', 'Mateus', 'A', 'especialista', 'milagres', 30),
('Quantos anos o paralítico de Betesda estava doente?', '12', '20', '38', '40', 'C', 'especialista', 'milagres', 30),
('Qual foi a doença que Jesus curou à distância?', 'Paralisia', 'Febre', 'Lepra', 'Surdez', 'B', 'profissional', 'milagres', 20),
('De quem era o servo que Jesus curou à distância?', 'Pedro', 'Centurião', 'Fariseu', 'Zaqueu', 'B', 'profissional', 'milagres', 20),
('Quantos leprosos Jesus curou de uma vez?', '1', '5', '10', '100', 'C', 'profissional', 'milagres', 20),

('Quantos leprosos voltaram para agradecer?', '1', '3', '5', '10', 'A', 'profissional', 'milagres', 20),
('Qual era a nacionalidade do leproso que voltou?', 'Judeu', 'Romano', 'Samaritano', 'Egípcio', 'C', 'especialista', 'milagres', 30),
('Que tipo de árvore Zaqueu subiu para ver Jesus?', 'Oliveira', 'Figueira', 'Sicômoro', 'Palmeira', 'C', 'profissional', 'milagres', 20),
('Qual era a profissão de Zaqueu?', 'Pescador', 'Cobrador de impostos', 'Fariseu', 'Carpinteiro', 'B', 'iniciante', 'milagres', 10),
('Quantos demônios Jesus expulsou do endemoninhado gadareno?', 'Não especificado', 'Uma legião', '7', '12', 'B', 'profissional', 'milagres', 20);

-- ============================================
-- CATEGORIA: PARÁBOLAS DE JESUS (15 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Qual parábola Jesus contou sobre um filho que saiu de casa?', 'O Bom Samaritano', 'O Filho Pródigo', 'O Semeador', 'As Dez Virgens', 'B', 'iniciante', 'parabolas', 10),
('Na parábola do semeador, o que representa o solo pedregoso?', 'Quem não entende', 'Quem recebe com alegria mas desiste', 'Quem é sufocado pelas riquezas', 'Quem produz fruto', 'B', 'profissional', 'parabolas', 20),
('Na parábola dos talentos, quantos talentos recebeu o servo preguiçoso?', '1', '2', '5', '10', 'A', 'profissional', 'parabolas', 20),
('Quantos servos estão na parábola dos talentos?', '2', '3', '5', '10', 'B', 'profissional', 'parabolas', 20),
('Na parábola das dez virgens, quantas eram prudentes?', '3', '5', '7', '10', 'B', 'profissional', 'parabolas', 20),

('O que as virgens prudentes levaram a mais?', 'Pão', 'Água', 'Azeite', 'Vinho', 'C', 'profissional', 'parabolas', 20),
('Na parábola do bom samaritano, quem passou primeiro pelo ferido?', 'Levita', 'Sacerdote', 'Samaritano', 'Fariseu', 'B', 'profissional', 'parabolas', 20),
('Quantas moedas de prata a mulher perdeu na parábola?', '1', '5', '10', '100', 'C', 'profissional', 'parabolas', 20),
('Na parábola do rico e Lázaro, qual era o nome do rico?', 'Não é mencionado', 'Zaqueu', 'Nicodemos', 'José', 'A', 'especialista', 'parabolas', 30),
('Na parábola do fariseu e publicano, onde estavam orando?', 'Sinagoga', 'Templo', 'Casa', 'Monte', 'B', 'profissional', 'parabolas', 20),

('Quantos denários devia o servo mau ao rei?', 'Cem', 'Mil', 'Dez mil talentos', 'Cem denários', 'C', 'especialista', 'parabolas', 30),
('Na parábola da ovelha perdida, quantas ovelhas o pastor tinha?', '10', '50', '100', '1000', 'C', 'profissional', 'parabolas', 20),
('Na parábola da vinha, a que hora foram chamados os últimos?', '6h', '9h', '15h', '17h', 'D', 'especialista', 'parabolas', 30),
('Qual parábola fala sobre um juiz injusto?', 'A viúva persistente', 'O amigo importuno', 'O fariseu e o publicano', 'O bom samaritano', 'A', 'profissional', 'parabolas', 20),
('Qual parábola Jesus contou sobre uma grande ceia?', 'As bodas', 'A grande ceia', 'O filho pródigo', 'O bom samaritano', 'B', 'profissional', 'parabolas', 20);

-- ============================================
-- CATEGORIA: APÓSTOLOS (15 perguntas)
-- ============================================

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, points) VALUES
('Quantos apóstolos Jesus escolheu?', '10', '12', '7', '70', 'B', 'iniciante', 'apostolos', 10),
('Qual apóstolo era cobrador de impostos?', 'Pedro', 'João', 'Mateus', 'Tiago', 'C', 'profissional', 'apostolos', 20),
('Quais eram os irmãos filhos de Zebedeu?', 'Pedro e André', 'Tiago e João', 'Tiago e Judas', 'Felipe e Bartolomeu', 'B', 'profissional', 'apostolos', 20),
('Qual era o outro nome de Pedro?', 'Simão', 'Saulo', 'Levi', 'Cefas', 'A', 'profissional', 'apostolos', 20),
('Qual apóstolo Jesus chamou de "a rocha"?', 'Tiago', 'João', 'Pedro', 'André', 'C', 'iniciante', 'apostolos', 10),

('Qual apóstolo duvidou da ressurreição?', 'Pedro', 'João', 'Tomé', 'Felipe', 'C', 'iniciante', 'apostolos', 10),
('Qual era a profissão de Pedro antes de seguir Jesus?', 'Carpinteiro', 'Pescador', 'Cobrador de impostos', 'Fariseu', 'B', 'iniciante', 'apostolos', 10),
('Qual apóstolo era irmão de Pedro?', 'Tiago', 'João', 'André', 'Filipe', 'C', 'profissional', 'apostolos', 20),
('Qual apóstolo levou Natanael a Jesus?', 'Pedro', 'André', 'Felipe', 'Tiago', 'C', 'especialista', 'apostolos', 30),
('Qual era o outro nome de Natanael?', 'Bartolomeu', 'Mateus', 'Judas', 'Simão', 'A', 'especialista', 'apostolos', 30),

('Qual era o outro nome de Mateus?', 'Simão', 'Levi', 'José', 'Barnabé', 'B', 'profissional', 'apostolos', 20),
('Qual apóstolo era chamado de zelote?', 'Simão', 'Judas', 'Tiago', 'Mateus', 'A', 'profissional', 'apostolos', 20),
('Qual apóstolo substituiu Judas Iscariotes?', 'Paulo', 'Barnabé', 'Matias', 'Timóteo', 'C', 'profissional', 'apostolos', 20),
('Quantos Tiagos estavam entre os doze?', '1', '2', '3', '4', 'B', 'profissional', 'apostolos', 20),
('Qual apóstolo Jesus amava?', 'Pedro', 'Tiago', 'João', 'André', 'C', 'profissional', 'apostolos', 20);

-- Total: +50 perguntas
-- Total geral no banco: 260 perguntas
