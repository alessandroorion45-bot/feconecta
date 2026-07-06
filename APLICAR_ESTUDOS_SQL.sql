-- =============================================
-- ESTUDOS BÍBLICOS — Políticas + 18 novos estudos
-- (novas categorias: Jesus, Espírito Santo, Perdão,
--  Ansiedade, Personagens; não duplica por título)
-- =============================================

-- Políticas (garantia)
ALTER TABLE public.bible_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view studies" ON public.bible_studies;
CREATE POLICY "Anyone can view studies"
ON public.bible_studies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update study counters" ON public.bible_studies;
CREATE POLICY "Anyone can update study counters"
ON public.bible_studies FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.user_study_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  study_id UUID NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, study_id)
);
ALTER TABLE public.user_study_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own study completions" ON public.user_study_completions;
CREATE POLICY "Users view own study completions"
ON public.user_study_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users complete studies" ON public.user_study_completions;
CREATE POLICY "Users complete studies"
ON public.user_study_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Novos estudos
INSERT INTO public.bible_studies
  (title, author, description, category, type, duration, content, verses, application, reflection_questions, views_count, likes_count)
SELECT * FROM (VALUES
  ('Quem é Jesus?', 'Equipe Aliança', 'Uma jornada pelas declarações "Eu Sou" do Evangelho de João.', 'Jesus', 'text', '6 min',
   E'Jesus não deixou dúvidas sobre quem Ele é. No Evangelho de João, Ele declara: "Eu sou o pão da vida", "a luz do mundo", "o caminho, a verdade e a vida". Cada declaração revela uma face do Salvador que supre, ilumina e conduz.\n\nConhecer Jesus não é acumular informação — é relacionamento. Ele mesmo disse que a vida eterna é conhecer ao único Deus verdadeiro e a Jesus Cristo (João 17:3). Quanto mais o conhecemos, mais somos transformados à Sua imagem.',
   ARRAY['João 14:6', 'João 8:12', 'João 6:35'],
   'Escolha uma declaração "Eu Sou" e medite nela durante a semana. Onde você precisa que Jesus seja isso na sua vida hoje?',
   ARRAY['Qual "Eu Sou" de Jesus mais fala com seu momento atual?', 'O que muda quando Jesus é o caminho, e não apenas um caminho?', 'Como você pode conhecê-Lo mais profundamente esta semana?'], 0, 0),

  ('Os Milagres de Jesus', 'Equipe Aliança', 'O que os sinais revelam sobre o coração de Deus.', 'Jesus', 'text', '5 min',
   E'Os milagres de Jesus nunca foram espetáculo — eram sinais. Ao curar o leproso, Ele tocou quem ninguém tocava. Ao multiplicar pães, revelou o Deus que se importa com a fome. Ao acalmar a tempestade, mostrou autoridade sobre o caos.\n\nCada milagre aponta para algo maior: o Reino de Deus invadindo a história. E o mesmo Jesus que agiu ali continua agindo hoje.',
   ARRAY['Marcos 1:40-42', 'João 6:1-14', 'Marcos 4:35-41'],
   'Relembre um "milagre" na sua história — uma provisão, uma cura, um livramento — e agradeça a Deus por escrito.',
   ARRAY['Qual milagre de Jesus mais toca você?', 'O que os milagres revelam sobre o caráter de Deus?', 'Onde você precisa da intervenção de Jesus hoje?'], 0, 0),

  ('O Fruto do Espírito', 'Equipe Aliança', 'As nove virtudes que o Espírito produz em nós.', 'Espírito Santo', 'text', '6 min',
   E'Amor, alegria, paz, paciência, benignidade, bondade, fidelidade, mansidão e domínio próprio. Paulo não fala de "frutos", mas de "fruto" — um caráter único que cresce por inteiro quando permanecemos ligados à videira.\n\nFruto não se fabrica; se cultiva. Cresce devagar, na terra do convívio diário com Deus, regado pela Palavra e pela oração.',
   ARRAY['Gálatas 5:22-23', 'João 15:4-5'],
   'Escolha a virtude mais difícil para você e peça ao Espírito, todos os dias desta semana, que a desenvolva em situações práticas.',
   ARRAY['Qual aspecto do fruto está mais maduro em você? E qual menos?', 'Por que fruto é diferente de esforço próprio?', 'O que significa "permanecer" em Cristo no seu cotidiano?'], 0, 0),

  ('Como Ouvir a Voz de Deus', 'Equipe Aliança', 'Deus fala — aprendamos a reconhecer Sua voz.', 'Espírito Santo', 'text', '5 min',
   E'Deus fala principalmente pela Sua Palavra: tudo que contradiz a Escritura não vem Dele. Fala também pela paz que excede o entendimento, pelo conselho de irmãos maduros e pelas circunstâncias que Ele mesmo alinha.\n\nSamuel aprendeu a dizer: "Fala, Senhor, porque o teu servo ouve". A pergunta não é se Deus fala, mas se estamos ouvindo.',
   ARRAY['1 Samuel 3:10', 'João 10:27', 'Salmos 119:105'],
   'Separe 10 minutos de silêncio hoje, sem celular: leia um Salmo e apenas ouça. Anote o que vier ao coração e compare com a Escritura.',
   ARRAY['O que mais atrapalha você de ouvir Deus?', 'Como distinguir a voz de Deus dos próprios desejos?', 'Quando foi a última vez que você obedeceu a uma direção de Deus?'], 0, 0),

  ('O Poder do Perdão', 'Equipe Aliança', 'Perdoar liberta primeiro quem perdoa.', 'Perdão', 'text', '6 min',
   E'Pedro perguntou se perdoar sete vezes bastava. Jesus respondeu: setenta vezes sete — ou seja, sem contabilidade. O perdão não é sentimento; é decisão de liberar a dívida, como Deus liberou a nossa.\n\nGuardar mágoa é beber veneno esperando que o outro adoeça. Perdoar não significa fingir que não doeu, mas entregar a justiça a Deus e escolher ser livre.',
   ARRAY['Mateus 18:21-22', 'Efésios 4:32', 'Colossenses 3:13'],
   'Há alguém que você precisa perdoar? Ore pelo nome dessa pessoa hoje — e, se possível, dê um passo de reconciliação.',
   ARRAY['O que torna o perdão tão difícil?', 'Como o perdão de Cristo por você muda sua régua?', 'Perdoar é o mesmo que confiar de novo? Por quê?'], 0, 0),

  ('Vencendo a Ansiedade com Fé', 'Equipe Aliança', 'O antídoto de Filipenses 4 para o coração inquieto.', 'Ansiedade', 'text', '6 min',
   E'"Não andeis ansiosos de coisa alguma" — Paulo escreveu isso de uma prisão. O caminho que ele aponta é concreto: em tudo, orar; com gratidão, apresentar os pedidos; e deixar a paz de Deus montar guarda no coração.\n\nJesus completa: olhe para as aves e os lírios. O Pai que os sustenta sabe do que você precisa. Ansiedade diminui quando a confiança aumenta.',
   ARRAY['Filipenses 4:6-7', 'Mateus 6:25-34', '1 Pedro 5:7'],
   'Quando a ansiedade vier esta semana, pare e transforme cada preocupação em um pedido específico com gratidão.',
   ARRAY['O que mais tem roubado sua paz?', 'Qual a diferença entre cuidado responsável e ansiedade?', 'Como a gratidão combate a ansiedade?'], 0, 0),

  ('Davi: Um Coração Segundo Deus', 'Equipe Aliança', 'Do campo ao trono — as lições do pastor que virou rei.', 'Personagens', 'text', '7 min',
   E'Davi foi esquecido pelo próprio pai na hora da unção, mas visto por Deus, que olha o coração. Venceu Golias com fé, respeitou Saul mesmo perseguido, dançou diante da arca — e caiu gravemente com Bate-Seba.\n\nO que fez Davi ser "segundo o coração de Deus" não foi perfeição, mas arrependimento: o Salmo 51 mostra um coração quebrantado que volta correndo para Deus. Grandes quedas não anulam grandes propósitos quando há arrependimento verdadeiro.',
   ARRAY['1 Samuel 16:7', '1 Samuel 17:45', 'Salmos 51:10-12'],
   'Como Davi no Salmo 51, escreva sua própria oração de coração quebrantado sobre uma área em que você falhou.',
   ARRAY['O que Deus viu em Davi que os homens não viam?', 'O que a resposta de Davi ao pecado ensina sobre arrependimento?', 'Em que "vale de Golias" você precisa confiar em Deus hoje?'], 0, 0),

  ('José: Do Poço ao Palácio', 'Equipe Aliança', 'Quando Deus escreve certo por linhas que parecem tortas.', 'Personagens', 'text', '7 min',
   E'Vendido pelos irmãos, caluniado pela mulher de Potifar, esquecido na prisão — José tinha todos os motivos para amargurar. Mas em cada capítulo, a Escritura repete: "O Senhor era com José".\n\nNo fim, diante dos irmãos, ele resume a soberania de Deus: "Vós intentastes o mal contra mim; porém Deus o tornou em bem". Deus não desperdiça nenhuma dor de quem O ama.',
   ARRAY['Gênesis 39:2-3', 'Gênesis 50:20', 'Romanos 8:28'],
   'Identifique uma situação difícil do seu passado e escreva como Deus a usou (ou pode usar) para o bem.',
   ARRAY['Como José manteve a integridade longe de casa?', 'O que o perdão de José aos irmãos custou a ele?', 'Que "poço" da sua vida pode ser caminho para um "palácio"?'], 0, 0),

  ('Ester: Coragem para Tal Tempo', 'Equipe Aliança', 'A rainha que arriscou tudo pelo seu povo.', 'Personagens', 'text', '6 min',
   E'Órfã, estrangeira, escolhida rainha — Ester poderia ter se calado no conforto do palácio. Mas Mordecai a confrontou: "Quem sabe se para tal tempo como este chegaste a este reino?".\n\n"Se perecer, pereci": com jejum, sabedoria e coragem, ela se pôs diante do rei e Deus salvou seu povo. Posição é propósito: onde Deus te colocou não é acaso.',
   ARRAY['Ester 4:14', 'Ester 4:16'],
   'Onde Deus te posicionou (trabalho, escola, família)? Escreva uma atitude corajosa que esse "tal tempo" está pedindo de você.',
   ARRAY['O que a hesitação inicial de Ester ensina?', 'Qual o papel do jejum na decisão dela?', 'Que "posição" Deus te deu para abençoar outros?'], 0, 0),

  ('Pedro: Restaurado para Apascentar', 'Equipe Aliança', 'O apóstolo que negou três vezes e amou três vezes.', 'Personagens', 'text', '6 min',
   E'Pedro andou sobre as águas e afundou; prometeu morrer com Jesus e O negou três vezes diante de uma serva. O galo cantou, e ele chorou amargamente.\n\nMas na praia, o Ressuscitado fez três perguntas — "Tu me amas?" — uma para cada negação. E a cada resposta, uma missão: "Apascenta as minhas ovelhas". Em Cristo, o fracasso não é o fim da história; é onde a graça recomeça.',
   ARRAY['Lucas 22:61-62', 'João 21:15-17', 'Atos 2:14'],
   'Existe um fracasso que ainda te acusa? Leve-o à "praia" com Jesus hoje em oração e receba a restauração.',
   ARRAY['Por que Jesus perguntou três vezes?', 'O que mudou entre o Pedro do galo e o Pedro do Pentecostes?', 'Como Deus usa pessoas restauradas?'], 0, 0),

  ('Paulo: Transformado pela Graça', 'Equipe Aliança', 'De perseguidor a maior missionário da história.', 'Personagens', 'text', '7 min',
   E'Saulo respirava ameaças contra a igreja até ser derrubado por uma luz no caminho de Damasco. "Saulo, Saulo, por que me persegues?" — naquele dia, o perseguidor virou pregador.\n\nPaulo nunca esqueceu de onde veio: "o principal dos pecadores", alcançado pela graça. Por isso trabalhou mais que todos — "todavia não eu, mas a graça de Deus comigo". Ninguém está longe demais para Deus alcançar.',
   ARRAY['Atos 9:3-6', '1 Timóteo 1:15-16', '1 Coríntios 15:10'],
   'Ore hoje por alguém que parece "longe demais" de Deus — lembrando que Paulo também parecia.',
   ARRAY['O que a conversão de Paulo revela sobre a graça?', 'Como o passado de Paulo se tornou plataforma de testemunho?', 'Quem você deixou de evangelizar por achar impossível?'], 0, 0),

  ('A Armadura de Deus', 'Equipe Aliança', 'Vestidos para a batalha espiritual de cada dia.', 'Fé', 'text', '6 min',
   E'Paulo descreve o cristão como um soldado: cinto da verdade, couraça da justiça, calçado do evangelho, escudo da fé, capacete da salvação e a espada do Espírito — a Palavra de Deus.\n\nNossa luta não é contra pessoas, mas contra forças espirituais. Por isso a armadura é espiritual: verdade vivida, justiça praticada, fé levantada e Palavra empunhada — tudo isso "orando em todo tempo".',
   ARRAY['Efésios 6:10-18'],
   'Ao acordar, "vista" mentalmente cada peça da armadura em oração, nomeando a área do dia em que precisará dela.',
   ARRAY['Qual peça da armadura você tem negligenciado?', 'Por que a espada (a Palavra) é a única arma de ataque?', 'Como Jesus usou a Palavra na tentação do deserto?'], 0, 0),

  ('O Pai Nosso: A Oração Modelo', 'Equipe Aliança', 'Jesus nos ensinou a orar — frase por frase.', 'Oração', 'text', '6 min',
   E'"Pai nosso" — intimidade e comunhão. "Santificado seja o teu nome" — adoração antes dos pedidos. "Venha o teu reino" — os planos Dele acima dos nossos. "O pão nosso de cada dia" — dependência diária. "Perdoa-nos... como perdoamos" — graça recebida e repassada. "Não nos deixes cair em tentação" — vigilância.\n\nNão é fórmula para repetir sem pensar; é mapa para o coração orar com direção.',
   ARRAY['Mateus 6:9-13', 'Lucas 11:1-4'],
   'Ore o Pai Nosso hoje frase por frase, parando em cada uma para colocar suas palavras dentro do modelo de Jesus.',
   ARRAY['Qual frase do Pai Nosso você costuma pular na prática?', 'Por que adorar antes de pedir?', 'O que muda ao chamar Deus de "Pai nosso" e não só "meu"?'], 0, 0),

  ('Esperança que Não Decepciona', 'Equipe Aliança', 'A âncora da alma em meio às tempestades.', 'Esperança', 'text', '5 min',
   E'A esperança bíblica não é otimismo — é certeza ancorada no caráter de Deus. Hebreus a chama de "âncora da alma, segura e firme". Romanos diz que ela "não decepciona", porque o amor de Deus já foi derramado em nós.\n\nMesmo no livro de Lamentações há um respiro: "As misericórdias do Senhor se renovam a cada manhã". Nenhuma noite é longa demais para quem sabe que a manhã vem.',
   ARRAY['Hebreus 6:19', 'Romanos 5:5', 'Lamentações 3:22-23'],
   'Escreva 3 promessas de Deus que ancoram sua esperança e cole-as onde você possa vê-las na semana.',
   ARRAY['Qual a diferença entre esperança bíblica e otimismo?', 'Que "tempestade" atual precisa desta âncora?', 'Como sua esperança pode encorajar alguém hoje?'], 0, 0),

  ('Sabedoria para Decisões', 'Equipe Aliança', 'Como Provérbios e Tiago nos guiam nas escolhas.', 'Sabedoria', 'text', '5 min',
   E'"Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento" — o princípio das decisões sábias é a confiança rendida. E Tiago promete: se alguém tem falta de sabedoria, peça a Deus, que dá liberalmente.\n\nSabedoria bíblica combina oração, Palavra, conselho de pessoas maduras e paciência para esperar. Pressa é inimiga do discernimento.',
   ARRAY['Provérbios 3:5-6', 'Tiago 1:5', 'Provérbios 11:14'],
   'Sobre a decisão que você tem pela frente: ore, busque um versículo aplicável e ouça um conselheiro maduro antes de decidir.',
   ARRAY['Em que decisão você tem se apoiado só no próprio entendimento?', 'Quem são seus conselheiros espirituais?', 'Por que Deus às vezes demora a mostrar o caminho?'], 0, 0),

  ('Casamento Segundo Deus', 'Equipe Aliança', 'Aliança de amor, honra e propósito.', 'Família', 'text', '6 min',
   E'O casamento nasceu no Éden: "os dois serão uma só carne". Paulo eleva o padrão — maridos, amem como Cristo amou a igreja (entrega total); esposas e maridos, sujeitem-se uns aos outros no temor de Deus (honra mútua).\n\nUm casamento forte tem três cordões: ele, ela e Deus no centro. "O cordão de três dobras não se quebra tão depressa".',
   ARRAY['Gênesis 2:24', 'Efésios 5:25-33', 'Eclesiastes 4:12'],
   'Casado(a)? Faça hoje um gesto concreto de honra ao cônjuge. Solteiro(a)? Ore pelos casamentos da sua família e igreja.',
   ARRAY['O que significa amar "como Cristo amou"?', 'Onde o egoísmo tem ameaçado relacionamentos ao seu redor?', 'Como colocar Deus no centro na prática?'], 0, 0),

  ('Jovem Segundo o Coração de Deus', 'Equipe Aliança', 'Ninguém despreze a tua mocidade.', 'Jovens', 'text', '5 min',
   E'Paulo escreveu a Timóteo: "Ninguém despreze a tua mocidade; pelo contrário, torna-te padrão dos fiéis, na palavra, no procedimento, no amor, na fé, na pureza". Juventude não é sala de espera — é campo de missão.\n\nDaniel, José, Davi, Maria: Deus sempre usou jovens que se posicionaram. A pergunta do Salmo 119 continua atual: como o jovem manterá puro o seu caminho? Observando-o conforme a Palavra.',
   ARRAY['1 Timóteo 4:12', 'Salmos 119:9', 'Eclesiastes 12:1'],
   'Escolha uma das cinco áreas (palavra, procedimento, amor, fé, pureza) e defina um alvo prático para a semana.',
   ARRAY['Que pressões a sua geração enfrenta que as anteriores não enfrentavam?', 'Em qual das 5 áreas você precisa crescer mais?', 'Quem é seu exemplo de fé — e para quem você é exemplo?'], 0, 0),

  ('Trabalho como Adoração', 'Equipe Aliança', 'Fazendo tudo como para o Senhor.', 'Trabalho', 'text', '5 min',
   E'"Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens." O trabalho não é castigo — Adão já cultivava o jardim antes da queda. É vocação, provisão e vitrine do caráter de Cristo.\n\nExcelência, honestidade e bom ânimo no trabalho pregam mais alto que muitas palavras. Seu crachá também é um chamado.',
   ARRAY['Colossenses 3:23-24', 'Provérbios 22:29', 'Gênesis 2:15'],
   'Esta semana, escolha uma tarefa que você faz de má vontade e faça-a com excelência "como para o Senhor".',
   ARRAY['Seu trabalho tem sido adoração ou apenas obrigação?', 'Como colegas percebem sua fé pelo seu trabalho?', 'O que mudaria se Jesus fosse seu chefe visível?'], 0, 0)
) AS v(title, author, description, category, type, duration, content, verses, application, reflection_questions, views_count, likes_count)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bible_studies b WHERE b.title = v.title
);
