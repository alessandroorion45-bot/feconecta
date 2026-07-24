-- Banco de perguntas do Quiz Biblico pre-geradas (custo de IA zero).
-- Idempotente: NOT EXISTS por texto da pergunta. Rollback: nao necessario
-- (dados de conteudo; para remover, delete por category/texto se preciso).

-- Lote 1 do banco de perguntas do Quiz Biblico (pre-geradas, custo de IA zero).
-- Insere so o que ainda nao existe (dedup por texto da pergunta).
insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE (10 pts) =====================
('Quem construiu a arca para se salvar do diluvio?','Abraao','Noe','Moises','Davi','B','criacao','iniciante',10,'Deus mandou Noe construir a arca para salvar sua familia e os animais do diluvio.','Genesis 6:14'),
('Em quantos dias Deus criou o mundo, descansando no setimo?','5','6','7','8','B','criacao','iniciante',10,'Deus criou tudo em seis dias e descansou no setimo.','Genesis 2:2'),
('Qual foi o primeiro homem criado por Deus?','Caim','Abel','Adao','Sete','C','criacao','iniciante',10,'Adao foi o primeiro homem, formado do po da terra.','Genesis 2:7'),
('Qual era o nome da primeira mulher?','Sara','Eva','Raquel','Lia','B','criacao','iniciante',10,'Eva foi a primeira mulher, formada da costela de Adao.','Genesis 3:20'),
('Qual fruto Adao e Eva foram proibidos de comer?','Uva','Figo','Da arvore do conhecimento do bem e do mal','Romã','C','criacao','iniciante',10,'Deus proibiu que comessem da arvore do conhecimento do bem e do mal.','Genesis 2:17'),
('Quem matou seu irmao Abel por inveja?','Sete','Caim','Enoque','Lameque','B','patriarcas','iniciante',10,'Caim matou Abel por inveja da oferta aceita por Deus.','Genesis 4:8'),
('Quantos filhos Jaco teve, que originaram as tribos de Israel?','10','11','12','13','C','patriarcas','iniciante',10,'Jaco teve doze filhos, pais das doze tribos de Israel.','Genesis 35:22'),
('Qual mar Moises abriu para o povo de Israel atravessar?','Mar Mediterraneo','Mar Vermelho','Mar da Galileia','Mar Morto','B','exodo','iniciante',10,'Deus abriu o Mar Vermelho para o povo fugir do Egito.','Exodo 14:21'),
('Quem recebeu os Dez Mandamentos no monte Sinai?','Josue','Arao','Moises','Cale','C','exodo','iniciante',10,'Moises recebeu as tabuas da Lei no monte Sinai.','Exodo 31:18'),
('Quantos mandamentos Deus deu a Moises?','7','10','12','40','B','exodo','iniciante',10,'Foram os Dez Mandamentos.','Exodo 20:1'),
('Quem derrotou o gigante Golias com uma funda e uma pedra?','Saul','Davi','Jonatas','Samuel','B','reis','iniciante',10,'O jovem Davi derrotou Golias com uma pedra e uma funda.','1 Samuel 17:49'),
('Qual rei era conhecido por sua grande sabedoria?','Saul','Davi','Salomao','Roboao','C','reis','iniciante',10,'Salomao pediu sabedoria a Deus e ficou conhecido por ela.','1 Reis 3:12'),
('Quem foi lancado na cova dos leoes e saiu ileso?','Jose','Daniel','Jonas','Eliseu','B','profetas','iniciante',10,'Daniel foi protegido por Deus na cova dos leoes.','Daniel 6:22'),
('Qual profeta foi engolido por um grande peixe?','Elias','Jonas','Isaias','Jeremias','B','profetas','iniciante',10,'Jonas ficou tres dias no ventre do grande peixe.','Jonas 1:17'),
('Em que cidade Jesus nasceu?','Nazare','Jerusalem','Belem','Cafarnaum','C','jesus','iniciante',10,'Jesus nasceu em Belem da Judeia.','Mateus 2:1'),
('Quem era a mae de Jesus?','Marta','Maria','Isabel','Ana','B','jesus','iniciante',10,'Maria foi a mae de Jesus.','Lucas 1:31'),
('Quem batizou Jesus no rio Jordao?','Pedro','Joao Batista','Andre','Tiago','B','jesus','iniciante',10,'Joao Batista batizou Jesus no rio Jordao.','Mateus 3:13'),
('Quantos discipulos Jesus escolheu?','7','10','12','15','C','jesus','iniciante',10,'Jesus escolheu doze apostolos.','Marcos 3:14'),
('Qual foi o primeiro milagre de Jesus, nas bodas de Cana?','Curar um cego','Transformar agua em vinho','Multiplicar paes','Acalmar a tempestade','B','milagres','iniciante',10,'Jesus transformou agua em vinho nas bodas de Cana.','Joao 2:9'),
('Em quantos dias Jesus ressuscitou apos a crucificacao?','No mesmo dia','No segundo dia','No terceiro dia','No setimo dia','C','jesus','iniciante',10,'Jesus ressuscitou ao terceiro dia.','Lucas 24:7'),
('Qual apostolo negou Jesus tres vezes?','Joao','Pedro','Tiago','Tome','B','evangelhos','iniciante',10,'Pedro negou conhecer Jesus tres vezes antes do galo cantar.','Lucas 22:61'),
('Quem traiu Jesus por trinta moedas de prata?','Pedro','Judas Iscariotes','Tome','Filipe','B','evangelhos','iniciante',10,'Judas Iscariotes traiu Jesus por trinta moedas de prata.','Mateus 26:15'),
('Qual era a profissao de varios discipulos antes de seguir Jesus?','Carpinteiros','Pescadores','Soldados','Sacerdotes','B','evangelhos','iniciante',10,'Varios discipulos, como Pedro e Andre, eram pescadores.','Mateus 4:18'),
('Qual livro e o primeiro da Biblia?','Exodo','Genesis','Salmos','Mateus','B','antigo_testamento','iniciante',10,'Genesis e o primeiro livro da Biblia.','Genesis 1:1'),
('Qual livro e o ultimo da Biblia?','Malaquias','Judas','Apocalipse','Atos','C','novo_testamento','iniciante',10,'Apocalipse encerra a Biblia.','Apocalipse 22:21'),
('Quem foi vendido pelos irmaos e tornou-se governador no Egito?','Benjamim','Jose','Judah','Ruben','B','patriarcas','iniciante',10,'Jose foi vendido pelos irmaos e chegou a governador do Egito.','Genesis 41:41'),
('A quem Deus pediu que sacrificasse o filho, mas impediu no ultimo momento?','Isaque','Abraao','Jaco','Ismael','B','patriarcas','iniciante',10,'Deus pediu a Abraao o sacrificio de Isaque e depois o impediu.','Genesis 22:12'),
('Qual cidade teve suas muralhas derrubadas apos o povo marchar ao redor dela?','Ai','Jerico','Babilonia','Ninive','B','antigo_testamento','iniciante',10,'As muralhas de Jerico cairam depois da marcha do povo.','Josue 6:20'),
('Quem foi o homem mais forte, cuja forca estava nos cabelos?','Sansao','Gideao','Baraque','Jefte','A','antigo_testamento','iniciante',10,'A forca de Sansao estava ligada ao voto e aos seus cabelos.','Juizes 16:17'),
('Qual salmo comeca com O Senhor e o meu pastor?','Salmo 1','Salmo 23','Salmo 91','Salmo 150','B','sabedoria','iniciante',10,'O Salmo 23 comeca com O Senhor e o meu pastor.','Salmos 23:1'),
-- ===================== PROFISSIONAL (20 pts) =====================
('Quantos anos os israelitas peregrinaram no deserto?','7','20','40','70','C','exodo','profissional',20,'O povo peregrinou quarenta anos no deserto.','Numeros 14:33'),
('Quem sucedeu Moises na lideranca do povo de Israel?','Arao','Josue','Cale','Gideao','B','antigo_testamento','profissional',20,'Josue conduziu o povo a terra prometida apos Moises.','Josue 1:2'),
('Qual profeta desafiou os profetas de Baal no monte Carmelo?','Eliseu','Elias','Isaias','Ezequiel','B','profetas','profissional',20,'Elias desafiou os profetas de Baal no Carmelo.','1 Reis 18:20'),
('Quem foi o primeiro rei de Israel?','Davi','Saul','Salomao','Samuel','B','reis','profissional',20,'Saul foi ungido o primeiro rei de Israel.','1 Samuel 10:1'),
('Qual rainha arriscou a vida para salvar seu povo dos planos de Hama?','Rute','Ester','Debora','Mical','B','antigo_testamento','profissional',20,'Ester intercedeu ao rei e salvou os judeus.','Ester 7:3'),
('Quem escreveu a maioria dos Salmos?','Salomao','Davi','Asafe','Moises','B','sabedoria','profissional',20,'Davi e o autor atribuido a maior parte dos Salmos.','Salmos 3:1'),
('Qual profeta teve a visao de um vale de ossos secos?','Daniel','Ezequiel','Jeremias','Oseias','B','profetas','profissional',20,'Ezequiel teve a visao do vale de ossos secos.','Ezequiel 37:1'),
('Quantos livros compoem o Novo Testamento?','27','39','40','66','A','novo_testamento','profissional',20,'O Novo Testamento tem 27 livros.','Mateus 1:1'),
('Qual discipulo era chamado de o incredulo por duvidar da ressurreicao?','Pedro','Tome','Filipe','Bartolomeu','B','evangelhos','profissional',20,'Tome duvidou ate ver as marcas de Jesus.','Joao 20:25'),
('Em qual monte Jesus proferiu o famoso Sermao das Bem-aventurancas?','Monte das Oliveiras','Monte Sinai','Monte da Beatitude (o monte)','Monte Carmelo','C','evangelhos','profissional',20,'O Sermao do Monte inclui as Bem-aventurancas.','Mateus 5:1'),
('Quem foi o publicano que subiu numa arvore para ver Jesus?','Mateus','Zaqueu','Nicodemos','Jose de Arimateia','B','evangelhos','profissional',20,'Zaqueu subiu num sicomoro para ver Jesus.','Lucas 19:4'),
('Qual apostolo perseguia cristaos antes de se converter no caminho de Damasco?','Pedro','Paulo','Barnabe','Tiago','B','cartas','profissional',20,'Saulo (Paulo) perseguia cristaos antes de sua conversao.','Atos 9:3'),
('Qual foi o primeiro martir cristao, apedrejado por sua fe?','Tiago','Estevao','Filipe','Barnabe','B','atos_igreja','profissional',20,'Estevao foi o primeiro martir cristao.','Atos 7:59'),
('Em qual cidade os seguidores de Jesus foram chamados cristaos pela primeira vez?','Jerusalem','Antioquia','Roma','Corinto','B','atos_igreja','profissional',20,'Foi em Antioquia que os discipulos foram chamados cristaos.','Atos 11:26'),
('Qual mulher ungiu os pes de Jesus e os enxugou com os cabelos?','Marta','Maria','Salome','Joana','B','evangelhos','profissional',20,'Maria ungiu os pes de Jesus e os enxugou com os cabelos.','Joao 12:3'),
('Quantas pessoas Jesus alimentou com cinco paes e dois peixes (so os homens)?','1000','3000','5000','10000','C','milagres','profissional',20,'Jesus alimentou cerca de cinco mil homens, alem de mulheres e criancas.','Mateus 14:21'),
('Qual profeta foi levado ao ceu num redemoinho, com carro de fogo?','Eliseu','Elias','Enoque','Isaias','B','profetas','profissional',20,'Elias foi levado ao ceu num redemoinho.','2 Reis 2:11'),
('Quem interpretou os sonhos do farao sobre as vacas gordas e magras?','Daniel','Jose','Moises','Arao','B','patriarcas','profissional',20,'Jose interpretou os sonhos do farao.','Genesis 41:25'),
('Qual juiz derrotou os midianitas com apenas 300 homens?','Sansao','Gideao','Jefte','Otniel','B','antigo_testamento','profissional',20,'Gideao venceu os midianitas com 300 homens.','Juizes 7:7'),
('Quem foi a moabita que disse O teu povo sera o meu povo a sua sogra?','Orfa','Rute','Noemi','Abigail','B','antigo_testamento','profissional',20,'Rute foi fiel a sua sogra Noemi.','Rute 1:16'),
-- ===================== ESPECIALISTA (30 pts) =====================
('Quantos anos Matusalem viveu, sendo o homem mais velho citado na Biblia?','800','912','969','999','C','patriarcas','especialista',30,'Matusalem viveu 969 anos.','Genesis 5:27'),
('Qual era o nome original de Abraao antes de Deus o mudar?','Abrao','Abimeleque','Abner','Absalao','A','patriarcas','especialista',30,'Abrao teve o nome mudado para Abraao.','Genesis 17:5'),
('Qual profeta se casou com Gomer por ordem de Deus, como sinal ao povo?','Amos','Oseias','Joel','Miqueias','B','profetas','especialista',30,'Oseias se casou com Gomer como sinal profetico.','Oseias 1:3'),
('Quantos anos durou o reinado do rei Davi?','20','33','40','50','C','reis','especialista',30,'Davi reinou quarenta anos sobre Israel.','1 Reis 2:11'),
('Qual rei de Juda estendeu sua vida em 15 anos apos orar a Deus?','Josias','Ezequias','Manasses','Uzias','B','reis','especialista',30,'Ezequias teve 15 anos acrescentados a sua vida.','2 Reis 20:6'),
('Qual foi o profeta menor que profetizou sobre o dia do Senhor e o derramar do Espirito?','Amos','Joel','Obadias','Naum','B','profetas','especialista',30,'Joel profetizou o derramamento do Espirito.','Joel 2:28'),
('Em qual ilha Joao recebeu a revelacao do Apocalipse?','Chipre','Patmos','Creta','Malta','B','apocalipse','especialista',30,'Joao estava na ilha de Patmos.','Apocalipse 1:9'),
('Quantas igrejas da Asia sao mencionadas no inicio do Apocalipse?','5','7','10','12','B','apocalipse','especialista',30,'Sao sete igrejas da Asia.','Apocalipse 1:11'),
('Qual discipulo substituiu Judas Iscariotes entre os doze?','Barnabe','Matias','Estevao','Silas','B','atos_igreja','especialista',30,'Matias foi escolhido para substituir Judas.','Atos 1:26'),
('Qual carta de Paulo foi escrita a um dono de escravos sobre Onesimo?','Tito','Filemom','Colossenses','Filipenses','B','cartas','especialista',30,'A carta a Filemom trata de Onesimo.','Filemom 1:10'),
('Qual era a profissao de Lucas, autor do evangelho e de Atos?','Pescador','Medico','Publicano','Fariseu','B','novo_testamento','especialista',30,'Lucas era medico, chamado por Paulo de amado medico.','Colossenses 4:14'),
('Quantos anos tinha Josias quando comecou a reinar em Juda?','8','12','16','21','A','reis','especialista',30,'Josias tinha oito anos ao comecar a reinar.','2 Reis 22:1'),
('Qual profeta comprou um campo como sinal de esperanca durante o cerco de Jerusalem?','Ezequiel','Jeremias','Isaias','Habacuque','B','profetas','especialista',30,'Jeremias comprou um campo em Anatote.','Jeremias 32:9'),
('Qual o nome do vale onde Davi enfrentou Golias?','Vale de Elá','Vale de Josafa','Vale de Hinom','Vale de Aijalom','A','reis','especialista',30,'A batalha foi no vale de Elá.','1 Samuel 17:2'),
('Qual mulher juiza de Israel liderou o povo junto com Baraque?','Jael','Debora','Ana','Miriã','B','antigo_testamento','especialista',30,'Debora foi juiza e profetisa em Israel.','Juizes 4:4'),
('Qual rei babilonico teve o sonho da estatua interpretado por Daniel?','Belsazar','Nabucodonosor','Dario','Ciro','B','profetas','especialista',30,'Nabucodonosor sonhou com a grande estatua.','Daniel 2:31'),
('Qual apostolo escreveu o maior numero de cartas do Novo Testamento?','Pedro','Joao','Paulo','Tiago','C','cartas','especialista',30,'Paulo escreveu a maioria das cartas (epistolas).','Romanos 1:1'),
('Qual foi o monte onde Moises viu a terra prometida antes de morrer?','Sinai','Nebo','Horebe','Hermom','B','antigo_testamento','especialista',30,'Moises viu a terra do alto do monte Nebo.','Deuteronomio 34:1'),
('Quem foi o sogro de Moises que o aconselhou a delegar o julgamento do povo?','Arao','Jetro','Hobabe','Labao','B','exodo','especialista',30,'Jetro aconselhou Moises a nomear juizes auxiliares.','Exodo 18:24'),
('Qual era o nome hebraico de Daniel na corte da Babilonia?','Sadraque','Beltessazar','Mesaque','Abednego','B','profetas','especialista',30,'Daniel recebeu o nome babilonico de Beltessazar.','Daniel 1:7')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);

select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE =====================
('Quem foi engolido pela terra por se rebelar contra Moises?','Core, Data e Abirao','Balaao','Aca','Nadabe','A','exodo','iniciante',10,'Core, Data e Abirao foram tragados pela terra na rebeliao.','Numeros 16:32'),
('Qual animal falou com o profeta Balaao?','Um camelo','Uma jumenta','Um leao','Um corvo','B','antigo_testamento','iniciante',10,'A jumenta de Balaao falou por intervencao de Deus.','Numeros 22:28'),
('Qual foi o sinal da alianca de Deus com Noe apos o diluvio?','Uma estrela','O arco-iris','O sol','Uma pomba','B','criacao','iniciante',10,'O arco-iris foi o sinal da alianca de Deus com a terra.','Genesis 9:13'),
('Que ave Noe soltou e voltou com uma folha de oliveira?','Corvo','Pomba','Aguia','Andorinha','B','criacao','iniciante',10,'A pomba voltou com uma folha de oliveira, sinal de terra seca.','Genesis 8:11'),
('Qual cidade foi destruida com fogo e enxofre junto com Gomorra?','Ninive','Sodoma','Babel','Jerico','B','patriarcas','iniciante',10,'Sodoma e Gomorra foram destruidas por fogo e enxofre.','Genesis 19:24'),
('A esposa de Lo se transformou em que ao olhar para tras?','Sal (estatua de sal)','Pedra','Arvore','Fumaca','A','patriarcas','iniciante',10,'A mulher de Lo virou estatua de sal.','Genesis 19:26'),
('Quem foi chamado por Deus quando era um menino, dizendo Fala, que o teu servo ouve?','Davi','Samuel','Josias','Salomao','B','antigo_testamento','iniciante',10,'O menino Samuel respondeu ao chamado de Deus.','1 Samuel 3:10'),
('Qual era o nome do jardim onde Adao e Eva viviam?','Getsemani','Eden','Gilgal','Sarom','B','criacao','iniciante',10,'Adao e Eva viviam no jardim do Eden.','Genesis 2:8'),
('Qual discipulo andou sobre as aguas ate comecar a afundar?','Joao','Pedro','Andre','Tiago','B','milagres','iniciante',10,'Pedro andou sobre as aguas ate duvidar e afundar.','Mateus 14:29'),
('Quantos leprosos Jesus curou, sendo que so um voltou para agradecer?','5','7','10','12','C','milagres','iniciante',10,'Jesus curou dez leprosos e apenas um voltou.','Lucas 17:17'),
('O que Jesus multiplicou para alimentar a multidao?','Peixe e pao','Frutas','Trigo','Vinho','A','milagres','iniciante',10,'Jesus multiplicou paes e peixes.','Joao 6:11'),
('Qual era o nome do irmao de Marta e Maria que Jesus ressuscitou?','Lazaro','Simao','Nicodemos','Bartimeu','A','milagres','iniciante',10,'Jesus ressuscitou Lazaro em Betania.','Joao 11:43'),
('Onde Jesus foi crucificado?','Betania','Golgota (Calvario)','Getsemani','Cafarnaum','B','jesus','iniciante',10,'Jesus foi crucificado no Golgota, o lugar da caveira.','Joao 19:17'),
('Quantos dias Jesus jejuou no deserto sendo tentado?','7','30','40','50','C','jesus','iniciante',10,'Jesus jejuou quarenta dias no deserto.','Mateus 4:2'),
('Qual mulher no poco conversou com Jesus sobre a agua viva?','A samaritana','Marta','Salome','Joana','A','evangelhos','iniciante',10,'A mulher samaritana conversou com Jesus sobre a agua viva.','Joao 4:10'),
('Qual e o menor versiculo da Biblia, sobre Jesus diante do tumulo de Lazaro?','Jesus chorou','Deus e amor','Orai sem cessar','Amai-vos','A','evangelhos','iniciante',10,'Jesus chorou e um dos versiculos mais curtos.','Joao 11:35'),
('Quantos livros tem a Biblia (Antigo e Novo Testamento juntos)?','27','39','66','73','C','antigo_testamento','iniciante',10,'A Biblia protestante tem 66 livros.','Genesis 1:1'),
('Qual foi o alimento que caiu do ceu para alimentar Israel no deserto?','Trigo','Mana','Cevada','Codornizes apenas','B','exodo','iniciante',10,'Deus enviou o mana do ceu no deserto.','Exodo 16:15'),
('Quem foi o pai de Joao Batista?','Jose','Zacarias','Simeao','Eli','B','evangelhos','iniciante',10,'Zacarias, sacerdote, foi o pai de Joao Batista.','Lucas 1:13'),
('Qual estrela guiou os magos ate Jesus?','A estrela do oriente','A estrela polar','Venus','Sirio','A','jesus','iniciante',10,'Os magos seguiram a estrela do oriente ate Jesus.','Mateus 2:2'),
-- ===================== PROFISSIONAL =====================
('Qual profeta ungiu Davi como rei ainda jovem?','Nata','Samuel','Gade','Elias','B','reis','profissional',20,'Samuel ungiu Davi na casa de Jesse.','1 Samuel 16:13'),
('Qual filho de Davi se rebelou e tentou tomar o trono?','Salomao','Absalao','Amnon','Adonias','B','reis','profissional',20,'Absalao se rebelou contra seu pai Davi.','2 Samuel 15:10'),
('Qual profeta multiplicou o azeite da viuva para pagar suas dividas?','Elias','Eliseu','Isaias','Natan','B','profetas','profissional',20,'Eliseu multiplicou o azeite da viuva.','2 Reis 4:6'),
('Quantas vezes Naama mergulhou no Jordao para ser curado da lepra?','3','5','7','10','C','profetas','profissional',20,'Naama mergulhou sete vezes e foi curado.','2 Reis 5:14'),
('Qual rei mandou construir o primeiro templo em Jerusalem?','Davi','Salomao','Ezequias','Josias','B','reis','profissional',20,'Salomao construiu o primeiro templo.','1 Reis 6:14'),
('Qual imperio levou o reino de Juda ao cativeiro na Babilonia?','Assirio','Babilonico','Persa','Egipcio','B','antigo_testamento','profissional',20,'A Babilonia levou Juda ao cativeiro.','2 Reis 25:11'),
('Qual rei persa permitiu que os judeus voltassem para reconstruir o templo?','Dario','Ciro','Assuero','Artaxerxes','B','antigo_testamento','profissional',20,'Ciro decretou o retorno dos judeus.','Esdras 1:1'),
('Quem liderou a reconstrucao dos muros de Jerusalem apos o exilio?','Esdras','Neemias','Zorobabel','Ageu','B','antigo_testamento','profissional',20,'Neemias liderou a reconstrucao dos muros.','Neemias 6:15'),
('Qual parabola fala de um homem que caiu entre ladroes e foi socorrido?','O filho prodigo','O bom samaritano','O semeador','Os talentos','B','parabolas','profissional',20,'A parabola do bom samaritano.','Lucas 10:33'),
('Na parabola dos talentos, quantos talentos recebeu o servo que os escondeu?','1','2','5','10','A','parabolas','profissional',20,'O servo que escondeu recebera um talento.','Mateus 25:18'),
('Qual discipulo era cobrador de impostos antes de seguir Jesus?','Pedro','Mateus','Andre','Filipe','B','evangelhos','profissional',20,'Mateus era publicano (cobrador de impostos).','Mateus 9:9'),
('Quem ajudou Jesus a carregar a cruz a caminho do Calvario?','Jose de Arimateia','Simao Cireneu','Nicodemos','Barrabas','B','jesus','profissional',20,'Simao Cireneu foi obrigado a carregar a cruz.','Marcos 15:21'),
('Quem pediu o corpo de Jesus a Pilatos para sepulta-lo?','Nicodemos','Jose de Arimateia','Pedro','Joao','B','jesus','profissional',20,'Jose de Arimateia pediu o corpo de Jesus.','Mateus 27:58'),
('Qual casal caiu morto por mentir ao Espirito Santo sobre a oferta?','Aquila e Priscila','Ananias e Safira','Aquia e Debora','Boaz e Rute','B','atos_igreja','profissional',20,'Ananias e Safira mentiram e cairam mortos.','Atos 5:5'),
('Qual mulher vendedora de purpura se converteu ao ouvir Paulo em Filipos?','Dorcas','Lidia','Priscila','Febe','B','atos_igreja','profissional',20,'Lidia, vendedora de purpura, creu em Filipos.','Atos 16:14'),
('Qual foi o discipulo ressuscitado por Pedro, tambem chamada Dorcas?','Lidia','Tabita','Priscila','Safira','B','atos_igreja','profissional',20,'Tabita (Dorcas) foi ressuscitada por Pedro.','Atos 9:40'),
('Qual apostolo teve a visao do lencol com animais, entendendo que o evangelho e para os gentios?','Paulo','Pedro','Joao','Tiago','B','atos_igreja','profissional',20,'Pedro teve a visao do lencol com animais.','Atos 10:11'),
('Em qual cidade Paulo pregou sobre o deus desconhecido no Areopago?','Corinto','Atenas','Efeso','Roma','B','cartas','profissional',20,'Paulo pregou no Areopago, em Atenas.','Atos 17:23'),
('Qual dupla missionaria acompanhou Paulo em sua primeira viagem?','Silas','Barnabe','Timoteo','Lucas','B','atos_igreja','profissional',20,'Barnabe acompanhou Paulo na primeira viagem.','Atos 13:2'),
('Qual jovem discipulo Paulo chamava de seu filho na fe e escreveu duas cartas?','Tito','Timoteo','Filemom','Onesimo','B','cartas','profissional',20,'Paulo escreveu duas cartas a Timoteo.','1 Timoteo 1:2'),
-- ===================== ESPECIALISTA =====================
('Quantas pragas Deus enviou sobre o Egito?','7','10','12','40','B','exodo','especialista',30,'Foram dez pragas sobre o Egito.','Exodo 7:14'),
('Qual foi a ultima praga do Egito?','Rãs','Gafanhotos','Morte dos primogenitos','Trevas','C','exodo','especialista',30,'A ultima praga foi a morte dos primogenitos.','Exodo 12:29'),
('Qual sumo sacerdote criou o menino Samuel no templo?','Zadoque','Eli','Abiatar','Arao','B','antigo_testamento','especialista',30,'O sacerdote Eli criou Samuel no templo.','1 Samuel 1:25'),
('Quantos anos tinha Sara quando deu a luz Isaque?','65','90','99','120','B','patriarcas','especialista',30,'Sara tinha noventa anos ao gerar Isaque.','Genesis 17:17'),
('Qual foi o preco pago por Judas para trair Jesus?','15 moedas','20 moedas','30 moedas de prata','50 moedas','C','evangelhos','especialista',30,'Judas recebeu trinta moedas de prata.','Mateus 26:15'),
('Quantos anos o paralitico esteve doente antes de Jesus cura-lo no tanque de Betesda?','12','18','38','40','C','milagres','especialista',30,'O homem estava doente havia trinta e oito anos.','Joao 5:5'),
('Qual era o nome do cego curado por Jesus a saida de Jerico?','Zaqueu','Bartimeu','Malco','Simao','B','milagres','especialista',30,'Bartimeu, o cego, foi curado perto de Jerico.','Marcos 10:46'),
('Qual foi a primeira das sete ultimas palavras de Jesus na cruz sobre perdao?','Tudo esta consumado','Pai, perdoa-lhes','Tenho sede','Esta e tua mae','B','jesus','especialista',30,'Pai, perdoa-lhes, porque nao sabem o que fazem.','Lucas 23:34'),
('Quantas pessoas se salvaram na arca de Noe?','4','6','8','10','C','criacao','especialista',30,'Salvaram-se oito pessoas: Noe, a esposa, tres filhos e as noras.','Genesis 7:13'),
('Qual profeta previu que o Messias nasceria em Belem?','Isaias','Miqueias','Zacarias','Malaquias','B','profetas','especialista',30,'Miqueias profetizou Belem como o lugar do nascimento.','Miqueias 5:2'),
('Qual foi o rei que sonhou com uma arvore enorme que seria cortada, sinal de sua loucura?','Belsazar','Nabucodonosor','Dario','Ciro','B','profetas','especialista',30,'Nabucodonosor sonhou com a grande arvore.','Daniel 4:10'),
('Qual mao escreveu na parede durante o banquete de Belsazar?','A mao de Daniel','Uma mao misteriosa (dedos de mao)','A mao do rei','A mao de um anjo visivel','B','profetas','especialista',30,'Dedos de uma mao escreveram na parede.','Daniel 5:5'),
('Quantos capitulos tem o livro de Salmos?','100','120','150','176','C','sabedoria','especialista',30,'O livro de Salmos tem 150 capitulos.','Salmos 150:1'),
('Qual e o capitulo mais longo da Biblia, um salmo sobre a Palavra de Deus?','Salmo 23','Salmo 91','Salmo 119','Salmo 150','C','sabedoria','especialista',30,'O Salmo 119 e o capitulo mais longo da Biblia.','Salmos 119:1'),
('Qual profeta menor teve seu livro composto por uma unica visao contra Edom?','Joel','Obadias','Naum','Ageu','B','profetas','especialista',30,'Obadias, o menor livro do AT, profetiza contra Edom.','Obadias 1:1'),
('Qual foi o rei de Israel que introduziu a adoracao a Baal por influencia de Jezabel?','Jeroboao','Acabe','Omri','Jeu','B','reis','especialista',30,'Acabe, marido de Jezabel, promoveu a adoracao a Baal.','1 Reis 16:31'),
('Quantos anos durou o cativeiro babilonico segundo a profecia de Jeremias?','40','50','70','120','C','profetas','especialista',30,'Jeremias profetizou setenta anos de cativeiro.','Jeremias 25:11'),
('Qual apostolo escreveu o livro de Apocalipse?','Pedro','Paulo','Joao','Tiago','C','apocalipse','especialista',30,'O apostolo Joao escreveu o Apocalipse.','Apocalipse 1:1'),
('Qual era o nome do carcereiro de Filipos que se converteu apos o terremoto?','Nao e citado pelo nome','Cornelio','Publio','Aristarco','A','atos_igreja','especialista',30,'O carcereiro de Filipos se converteu, mas seu nome nao e dado.','Atos 16:33'),
('Qual foi a primeira igreja mencionada a receber uma carta no Apocalipse?','Esmirna','Efeso','Laodiceia','Sardes','B','apocalipse','especialista',30,'A primeira carta e a igreja de Efeso.','Apocalipse 2:1')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE =====================
('O que Deus criou no primeiro dia?','As plantas','A luz','Os animais','O homem','B','criacao','iniciante',10,'No primeiro dia Deus disse: Haja luz.','Genesis 1:3'),
('Em que dia Deus criou o sol, a lua e as estrelas?','Segundo','Terceiro','Quarto','Quinto','C','criacao','iniciante',10,'Os luminares foram criados no quarto dia.','Genesis 1:16'),
('Qual irmao vendeu seu direito de primogenitura por um prato de comida?','Jaco','Esau','Jose','Ruben','B','patriarcas','iniciante',10,'Esau vendeu a primogenitura a Jaco por um prato de lentilhas.','Genesis 25:33'),
('De que material era feita a tunica especial que Jaco deu a Jose?','De pele','De varias cores','De linho','De ouro','B','patriarcas','iniciante',10,'Jose recebeu uma tunica de varias cores.','Genesis 37:3'),
('Onde a mae de Moises o escondeu quando bebe?','Numa caverna','Num cesto no rio','Numa casa','Num campo','B','exodo','iniciante',10,'Moises foi colocado num cesto e deixado no rio Nilo.','Exodo 2:3'),
('De dentro de que objeto Deus falou com Moises pela primeira vez?','Uma nuvem','Uma sarca ardente','Um trovao','Uma rocha','B','exodo','iniciante',10,'Deus falou com Moises na sarca que ardia sem se consumir.','Exodo 3:2'),
('O que o povo fez de ouro para adorar enquanto Moises estava no monte?','Uma serpente','Um bezerro','Um touro alado','Um leao','B','exodo','iniciante',10,'O povo fez um bezerro de ouro.','Exodo 32:4'),
('Quem escondeu os espioes de Israel em Jerico?','Debora','Raabe','Rute','Ana','B','antigo_testamento','iniciante',10,'Raabe escondeu os espioes em Jerico.','Josue 2:4'),
('O sol parou no ceu a pedido de qual lider durante uma batalha?','Moises','Josue','Gideao','Davi','B','antigo_testamento','iniciante',10,'A pedido de Josue, o sol se deteve.','Josue 10:13'),
('Quem foi a mulher que orou por um filho e gerou Samuel?','Ana','Sara','Raquel','Isabel','A','antigo_testamento','iniciante',10,'Ana orou e Deus lhe deu Samuel.','1 Samuel 1:20'),
('Quem foi o melhor amigo de Davi, filho do rei Saul?','Absalao','Jonatas','Joabe','Abner','B','reis','iniciante',10,'Jonatas era o grande amigo de Davi.','1 Samuel 18:1'),
('Qual rainha visitou Salomao para testar sua sabedoria?','Jezabel','A rainha de Saba','Ester','Vasti','B','reis','iniciante',10,'A rainha de Saba visitou Salomao.','1 Reis 10:1'),
('Quem alimentou o profeta Elias no deserto trazendo pao e carne?','Anjos','Corvos','Pombas','Um menino','B','profetas','iniciante',10,'Os corvos levavam pao e carne a Elias.','1 Reis 17:6'),
('Quantos amigos de Daniel foram lancados na fornalha ardente?','2','3','4','7','B','profetas','iniciante',10,'Sadraque, Mesaque e Abednego, tres amigos.','Daniel 3:23'),
('Em que animal Jesus entrou em Jerusalem no Domingo de Ramos?','Cavalo','Jumentinho','Camelo','A pe','B','jesus','iniciante',10,'Jesus entrou montado num jumentinho.','Mateus 21:7'),
('O que o povo estendia no chao quando Jesus entrou em Jerusalem?','Flores','Ramos e mantos','Ouro','Agua','B','jesus','iniciante',10,'O povo estendia ramos e mantos no caminho.','Mateus 21:8'),
('Qual foi a refeicao que Jesus partilhou com os discipulos antes de morrer?','Cafe da manha','A ultima ceia','Um banquete','Um jejum','B','jesus','iniciante',10,'Jesus partilhou a ultima ceia (a Pascoa) com os discipulos.','Lucas 22:19'),
('Em qual jardim Jesus orou antes de ser preso?','Eden','Getsemani','Do rei','Das Oliveiras (jardim)','B','jesus','iniciante',10,'Jesus orou no jardim do Getsemani.','Mateus 26:36'),
('Quem apareceu primeiro a Jesus ressuscitado no jardim?','Pedro','Maria Madalena','Joao','Tome','B','evangelhos','iniciante',10,'Maria Madalena viu Jesus ressuscitado primeiro.','Joao 20:16'),
('Qual foi a arvore que Jesus amaldicoou por nao ter frutos?','Videira','Figueira','Oliveira','Sicomoro','B','evangelhos','iniciante',10,'Jesus amaldicoou a figueira sem frutos.','Marcos 11:14'),
('Qual foi o dom que desceu sobre os discipulos no dia de Pentecostes?','Riquezas','O Espirito Santo','Ouro','Sabedoria apenas','B','atos_igreja','iniciante',10,'O Espirito Santo desceu no Pentecostes.','Atos 2:4'),
('Que sinal apareceu sobre os discipulos no Pentecostes?','Aguas','Linguas de fogo','Estrelas','Nuvens','B','atos_igreja','iniciante',10,'Apareceram linguas como de fogo.','Atos 2:3'),
('Qual profeta menor pregou arrependimento a cidade de Ninive?','Amos','Jonas','Naum','Oseias','B','profetas','iniciante',10,'Jonas pregou a Ninive, que se arrependeu.','Jonas 3:5'),
('Qual era o alimento de Joao Batista no deserto?','Pao','Gafanhotos e mel silvestre','Peixe','Frutas','B','evangelhos','iniciante',10,'Joao comia gafanhotos e mel silvestre.','Mateus 3:4'),
('Quem carregou o menino Jesus e sua mae para o Egito para fugir de Herodes?','Zacarias','Jose','Simeao','Um anjo','B','jesus','iniciante',10,'Jose levou Maria e o menino ao Egito.','Mateus 2:14'),
('Onde o menino Jesus foi encontrado aos 12 anos, conversando com os mestres?','Em casa','No templo','Numa festa','No mercado','B','jesus','iniciante',10,'Jesus foi achado no templo entre os doutores.','Lucas 2:46'),
-- ===================== PROFISSIONAL =====================
('Com quem Jaco lutou a noite inteira, recebendo o nome de Israel?','Um anjo/homem (com Deus)','Esau','Labao','Um profeta','A','patriarcas','profissional',20,'Jaco lutou e recebeu o nome Israel.','Genesis 32:28'),
('Qual objeto sagrado ficava dentro do Santo dos Santos, com as tabuas da Lei?','O altar','A arca da alianca','O candelabro','A mesa','B','exodo','profissional',20,'A arca da alianca guardava as tabuas da Lei.','Exodo 25:16'),
('Quantos espioes Moises enviou para observar a terra de Canaa?','7','10','12','40','C','exodo','profissional',20,'Foram doze espioes, um por tribo.','Numeros 13:2'),
('Quais dois espioes trouxeram um bom relatorio e creram em Deus?','Josue e Cale','Arao e Hur','Nadabe e Abiu','Datã e Abirao','A','antigo_testamento','profissional',20,'Josue e Cale confiaram em Deus.','Numeros 14:6'),
('O que Moises fez de bronze para curar quem fosse picado pelas serpentes?','Uma espada','Uma serpente','Um altar','Um escudo','B','exodo','profissional',20,'Moises fez uma serpente de bronze.','Numeros 21:9'),
('Qual juiz fez um voto precipitado envolvendo sua filha?','Gideao','Jefte','Sansao','Otniel','B','antigo_testamento','profissional',20,'Jefte fez um voto que envolveu sua filha.','Juizes 11:30'),
('Como Sansao matou mil filisteus?','Com uma espada','Com uma queixada de jumento','Com pedras','Com fogo','B','antigo_testamento','profissional',20,'Sansao usou uma queixada de jumento.','Juizes 15:15'),
('Quem cortou o cabelo de Sansao, tirando sua forca?','Jael','Dalila','Rute','Noemi','B','antigo_testamento','profissional',20,'Dalila descobriu o segredo e cortou seus cabelos.','Juizes 16:19'),
('Quem foi o bisavo de Davi, marido de Rute?','Obede','Boaz','Jesse','Isai','B','antigo_testamento','profissional',20,'Boaz casou com Rute; seu filho Obede foi avo de Davi.','Rute 4:13'),
('Que rei consultou uma medium em En-Dor antes de morrer?','Davi','Saul','Salomao','Acabe','B','reis','profissional',20,'Saul consultou a feiticeira de En-Dor.','1 Samuel 28:7'),
('Qual profeta confrontou Davi por causa de Bate-Seba com a parabola da ovelhinha?','Gade','Nata','Samuel','Elias','B','reis','profissional',20,'O profeta Natan confrontou Davi.','2 Samuel 12:7'),
('Como Salomao descobriu a verdadeira mae do bebe em disputa?','Perguntando ao povo','Propondo dividir a crianca','Consultando profetas','Tirando a sorte','B','reis','profissional',20,'Salomao propos dividir a crianca e a verdadeira mae se revelou.','1 Reis 3:25'),
('Qual profeta ouviu a voz de Deus num cicio tranquilo e suave?','Eliseu','Elias','Isaias','Amos','B','profetas','profissional',20,'Elias ouviu a voz de Deus num cicio suave.','1 Reis 19:12'),
('Qual rei tomou a vinha de Nabote apos sua morte, provocada por Jezabel?','Jeroboao','Acabe','Jeu','Omri','B','reis','profissional',20,'Acabe tomou a vinha de Nabote.','1 Reis 21:16'),
('O que Eliseu fez flutuar na agua para recuperar do rio?','Uma pedra','Um machado (ferro)','Um barco','Uma rede','B','profetas','profissional',20,'Eliseu fez o ferro do machado flutuar.','2 Reis 6:6'),
('Qual homem paciente perdeu tudo mas nao amaldicoou a Deus?','Jose','Jo (Jó)','Jeremias','Daniel','B','sabedoria','profissional',20,'Jo suportou o sofrimento sem amaldicoar a Deus.','Jó 1:22'),
('Segundo Proverbios, qual e o principio da sabedoria?','O estudo','O temor do Senhor','A riqueza','A experiencia','B','sabedoria','profissional',20,'O temor do Senhor e o principio da sabedoria.','Proverbios 9:10'),
('Qual profeta viu o Senhor no trono com serafins que clamavam Santo, Santo, Santo?','Ezequiel','Isaias','Jeremias','Daniel','B','profetas','profissional',20,'Isaias teve a visao do trono com os serafins.','Isaias 6:3'),
('De quem fala o capitulo 53 de Isaias, o servo sofredor?','De um rei','Do Messias (Jesus)','De Isaias','De Davi','B','profetas','profissional',20,'Isaias 53 profetiza o servo sofredor, o Messias.','Isaias 53:5'),
('Qual mestre da lei visitou Jesus a noite e ouviu que precisava nascer de novo?','Gamaliel','Nicodemos','Jose','Caifas','B','evangelhos','profissional',20,'Nicodemos ouviu de Jesus sobre nascer de novo.','Joao 3:3'),
('Na transfiguracao, quais dois personagens do AT apareceram com Jesus?','Abraao e Davi','Moises e Elias','Isaias e Jeremias','Adao e Noe','B','evangelhos','profissional',20,'Moises e Elias apareceram na transfiguracao.','Mateus 17:3'),
('Qual apostolo cortou a orelha de um servo na prisao de Jesus?','Joao','Pedro','Tiago','Andre','B','evangelhos','profissional',20,'Pedro cortou a orelha de Malco.','Joao 18:10'),
('Quem Pilatos libertou no lugar de Jesus a pedido do povo?','Barrabas','Judas','Simao','Estevao','A','jesus','profissional',20,'Pilatos soltou Barrabas.','Marcos 15:15'),
('O que se rasgou no templo no momento da morte de Jesus?','A porta','O veu (cortina)','O altar','O teto','B','jesus','profissional',20,'O veu do templo se rasgou de alto a baixo.','Mateus 27:51'),
-- ===================== ESPECIALISTA =====================
('Qual era o nome do poco onde Jaco encontrou Raquel?','Sozinho nao dito','Haran (junto ao poco)','Berseba','Betel','B','patriarcas','especialista',30,'Jaco encontrou Raquel perto de Haran, no poco.','Genesis 29:10'),
('Quantos anos Jaco serviu a Labao para se casar com Raquel (ao todo)?','7','10','14','20','C','patriarcas','especialista',30,'Foram sete por Lia e mais sete por Raquel.','Genesis 29:30'),
('Qual foi a praga do Egito que cobriu a terra de trevas?','Sexta','Oitava','Nona','Decima','C','exodo','especialista',30,'A nona praga foi de trevas por tres dias.','Exodo 10:22'),
('O que fez a vara de Arao para provar a escolha de sua tribo?','Virou serpente','Floresceu e deu amendoas','Secou','Brilhou','B','exodo','especialista',30,'A vara de Arao floresceu e produziu amendoas.','Numeros 17:8'),
('Qual foi o pecado que impediu Moises de entrar na terra prometida?','Idolatria','Ferir a rocha em vez de falar a ela','Mentira','Roubo','B','exodo','especialista',30,'Moises feriu a rocha em vez de falar, e nao entrou na terra.','Numeros 20:11'),
('Como Jael, esposa de Heber, matou o general Sisera?','Com espada','Com uma estaca de tenda','Com pedra','Com veneno','B','antigo_testamento','especialista',30,'Jael cravou uma estaca na cabeca de Sisera.','Juizes 4:21'),
('Qual deus dos filisteus caiu quebrado diante da arca da alianca?','Baal','Dagom','Moloque','Astarote','B','antigo_testamento','especialista',30,'A imagem de Dagom caiu diante da arca.','1 Samuel 5:4'),
('Quantos anos Davi tinha quando comecou a reinar?','20','30','40','16','B','reis','especialista',30,'Davi tinha trinta anos ao comecar a reinar.','2 Samuel 5:4'),
('Qual rei do reino do norte fez dois bezerros de ouro em Betel e Da?','Acabe','Jeroboao','Omri','Jeu','B','reis','especialista',30,'Jeroboao fez os dois bezerros de ouro.','1 Reis 12:28'),
('Como morreu a rainha Jezabel?','Envenenada','Lancada da janela e devorada por caes','Na guerra','De doenca','B','reis','especialista',30,'Jezabel foi lancada da janela e comida pelos caes.','2 Reis 9:33'),
('Qual rei de Juda achou o Livro da Lei no templo e promoveu uma reforma?','Ezequias','Josias','Manasses','Uzias','B','reis','especialista',30,'Josias achou o Livro da Lei e reformou a nacao.','2 Reis 22:8'),
('Qual profeta usou a figura do oleiro e do barro para falar de Israel?','Ezequiel','Jeremias','Isaias','Oseias','B','profetas','especialista',30,'Jeremias usou a figura do oleiro e do barro.','Jeremias 18:6'),
('Qual profeta menor viu um prumo (fio de prumo) como sinal do juizo de Deus?','Joel','Amos','Miqueias','Naum','B','profetas','especialista',30,'Amos viu o prumo, sinal do juizo.','Amos 7:8'),
('Qual profeta menor disse que o justo vivera pela fe?','Ageu','Habacuque','Sofonias','Zacarias','B','profetas','especialista',30,'Habacuque escreveu que o justo vivera pela fe.','Habacuque 2:4'),
('Qual profeta reprovou o povo por reter os dizimos, dizendo Trazei todos os dizimos a casa do tesouro?','Ageu','Zacarias','Malaquias','Joel','C','profetas','especialista',30,'Malaquias falou sobre trazer os dizimos.','Malaquias 3:10'),
('Quem eram Simeao e Ana, que reconheceram o menino Jesus no templo?','Sacerdotes','Um justo e uma profetisa','Reis','Escribas','B','jesus','especialista',30,'Simeao era justo e Ana era profetisa.','Lucas 2:36'),
('Na parabola, o que a mulher perdeu e procurou varrendo a casa?','Uma ovelha','Uma moeda (dracma)','Um anel','Uma joia','B','parabolas','especialista',30,'A mulher perdeu uma dracma e a procurou.','Lucas 15:8'),
('Na parabola do rico e Lazaro, para onde foi o mendigo apos morrer?','Ao inferno','Ao seio de Abraao','Ao mar','Ao templo','B','parabolas','especialista',30,'Lazaro foi levado ao seio de Abraao.','Lucas 16:22'),
('Qual apostolo caiu de uma janela do terceiro andar e foi ressuscitado por Paulo?','Eutico','Trofimo','Tiquico','Aristarco','A','atos_igreja','especialista',30,'Eutico caiu e Paulo o ressuscitou.','Atos 20:9'),
('Que animal picou Paulo na ilha de Malta sem lhe causar mal?','Escorpiao','Uma vibora','Uma aranha','Uma cobra marinha','B','atos_igreja','especialista',30,'Uma vibora mordeu Paulo, mas ele nao sofreu mal.','Atos 28:3'),
('Qual capitulo de 1 Corintios e conhecido como o capitulo do amor?','12','13','14','15','B','cartas','especialista',30,'1 Corintios 13 e o capitulo do amor.','1 Corintios 13:4'),
('Quantos sao os frutos do Espirito listados em Galatas?','7','9','10','12','B','cartas','especialista',30,'Sao nove: amor, alegria, paz, longanimidade, benignidade, bondade, fe, mansidao, dominio proprio.','Galatas 5:22'),
('Qual capitulo de Hebreus e conhecido como a galeria dos herois da fe?','10','11','12','13','B','cartas','especialista',30,'Hebreus 11 lista os herois da fe.','Hebreus 11:1'),
('Como Joao descreve Jesus no inicio do Apocalipse: Eu sou o Alfa e o...?','Fim apenas','Omega','Principio apenas','Cordeiro','B','apocalipse','especialista',30,'Eu sou o Alfa e o Omega.','Apocalipse 1:8')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE =====================
('Onde Jesus foi colocado ao nascer, por nao haver lugar na hospedaria?','Numa cama','Numa manjedoura','No chao','Numa casa','B','jesus','iniciante',10,'Jesus foi deitado numa manjedoura.','Lucas 2:7'),
('A quem os anjos anunciaram primeiro o nascimento de Jesus?','Aos reis','Aos pastores','Aos sacerdotes','Aos magos','B','jesus','iniciante',10,'Os anjos anunciaram aos pastores no campo.','Lucas 2:8'),
('Quantos presentes os magos trouxeram a Jesus?','1','2','3','5','C','jesus','iniciante',10,'Trouxeram ouro, incenso e mirra: tres presentes.','Mateus 2:11'),
('Qual desses foi um presente dos magos a Jesus?','Prata','Ouro','Trigo','Vinho','B','jesus','iniciante',10,'Os magos ofertaram ouro, incenso e mirra.','Mateus 2:11'),
('Jesus disse: Eu sou o pao da...?','Terra','Vida','Luz','Paz','B','jesus','iniciante',10,'Jesus disse: Eu sou o pao da vida.','Joao 6:35'),
('Jesus disse: Eu sou a luz do...?','Ceu','Mundo','Sol','Dia','B','jesus','iniciante',10,'Jesus disse: Eu sou a luz do mundo.','Joao 8:12'),
('Jesus se chamou de o bom...?','Rei','Pastor','Mestre','Pai','B','jesus','iniciante',10,'Jesus disse: Eu sou o bom pastor.','Joao 10:11'),
('Complete: Eu sou o caminho, a verdade e a...?','Luz','Vida','Paz','Graca','B','jesus','iniciante',10,'Eu sou o caminho, a verdade e a vida.','Joao 14:6'),
('Quantos livros formam os evangelhos?','2','3','4','5','C','evangelhos','iniciante',10,'Mateus, Marcos, Lucas e Joao: quatro evangelhos.','Mateus 1:1'),
('Qual destes e um dos quatro evangelhos?','Atos','Marcos','Romanos','Tiago','B','evangelhos','iniciante',10,'Os evangelhos sao Mateus, Marcos, Lucas e Joao.','Marcos 1:1'),
('Qual mulher era prima de Maria e mae de Joao Batista?','Ana','Isabel','Marta','Salome','B','evangelhos','iniciante',10,'Isabel, prima de Maria, foi mae de Joao Batista.','Lucas 1:36'),
('Qual apostolo e conhecido como o discipulo amado?','Pedro','Joao','Tiago','Andre','B','evangelhos','iniciante',10,'Joao e chamado o discipulo a quem Jesus amava.','Joao 21:20'),
('Quem desceu do teto de uma casa para ser curado por Jesus?','Um cego','Um paralitico','Um leproso','Um surdo','B','milagres','iniciante',10,'Um paralitico foi descido pelo teto ate Jesus.','Marcos 2:4'),
('O que Jesus acalmou com uma palavra, deixando os discipulos admirados?','O fogo','A tempestade','A multidao','O vento apenas','B','milagres','iniciante',10,'Jesus acalmou a tempestade no mar.','Marcos 4:39'),
('Qual foi a montanha onde Moises recebeu a Lei?','Nebo','Sinai','Carmelo','Hermom','B','exodo','iniciante',10,'Foi no monte Sinai.','Exodo 19:20'),
('Quem foi o irmao de Moises que falava por ele diante do farao?','Josue','Arao','Hur','Cale','B','exodo','iniciante',10,'Arao falava por Moises.','Exodo 4:14'),
('Qual era a irma de Moises que cuidou dele no rio?','Debora','Miria (Miriam)','Ana','Rute','B','exodo','iniciante',10,'Miriam, irma de Moises, cuidou dele no rio.','Exodo 2:4'),
('Quem foi a esposa de Boaz, avo do rei Davi?','Noemi','Rute','Ana','Abigail','B','antigo_testamento','iniciante',10,'Rute casou com Boaz e foi bisavo de Davi.','Rute 4:13'),
('O que Deus deu de comer ao povo alem do mana no deserto?','Peixe','Codornizes','Cordeiro','Pao','B','exodo','iniciante',10,'Deus enviou codornizes ao povo.','Exodo 16:13'),
('Qual foi o primeiro dos Dez Mandamentos?','Nao matar','Nao ter outros deuses','Nao roubar','Honrar os pais','B','exodo','iniciante',10,'Nao teras outros deuses diante de mim.','Exodo 20:3'),
-- ===================== PROFISSIONAL =====================
('Na tentacao, o que o diabo pediu que Jesus transformasse em pao?','Agua','Pedras','Areia','Madeira','B','jesus','profissional',20,'O diabo pediu que Jesus transformasse pedras em paes.','Mateus 4:3'),
('Segundo as Bem-aventurancas, os mansos herdarao o que?','O ceu','A terra','A riqueza','A sabedoria','B','evangelhos','profissional',20,'Bem-aventurados os mansos, porque herdarao a terra.','Mateus 5:5'),
('Jesus ensinou a orar dizendo: Pai nosso que estais nos...?','Coracoes','Ceus','Altos','Templos','B','evangelhos','profissional',20,'Pai nosso que estais nos ceus.','Mateus 6:9'),
('Jesus disse que os discipulos sao o sal da terra e a luz do que?','Ceu','Mundo','Templo','Caminho','B','evangelhos','profissional',20,'Vos sois a luz do mundo.','Mateus 5:14'),
('Na parabola, a que o Reino dos ceus e comparado, sendo a menor das sementes?','Trigo','Grao de mostarda','Cevada','Videira','B','parabolas','profissional',20,'O Reino e como um grao de mostarda.','Mateus 13:31'),
('Na parabola das dez virgens, quantas eram prudentes?','2','3','5','7','C','parabolas','profissional',20,'Cinco eram prudentes e cinco insensatas.','Mateus 25:2'),
('Quem foi o centuriao cuja fe admirou Jesus ao pedir cura para seu servo?','De Cafarnaum','Cornelio','Nao nomeado','Julio','C','milagres','profissional',20,'Um centuriao, sem nome citado, teve grande fe.','Mateus 8:5'),
('Qual filha Jesus ressuscitou, dizendo Talita cumi?','A filha da viuva','A filha de Jairo','A filha de Herodes','A filha de Pedro','B','milagres','profissional',20,'Jesus ressuscitou a filha de Jairo.','Marcos 5:41'),
('Qual mulher foi curada ao tocar na orla do manto de Jesus?','A que tinha fluxo de sangue','Maria','Marta','A viuva','A','milagres','profissional',20,'A mulher com fluxo de sangue tocou o manto e foi curada.','Marcos 5:29'),
('Como Jesus curou o homem que nasceu cego?','Com palavras','Com lodo e cuspe nos olhos','Tocando a testa','Com agua','B','milagres','profissional',20,'Jesus fez lodo com saliva e passou nos olhos do cego.','Joao 9:6'),
('Onde Pedro encontrou a moeda para pagar o imposto, conforme Jesus mandou?','No chao','Na boca de um peixe','Numa bolsa','No mercado','B','milagres','profissional',20,'A moeda estava na boca do peixe.','Mateus 17:27'),
('Qual sinal Jesus deu de que um dos doze o trairia na ultima ceia?','Um beijo','O pao molhado','Um olhar','Uma palavra','B','evangelhos','profissional',20,'Jesus deu o bocado (pao molhado) a Judas.','Joao 13:26'),
('O que Judas fez com as trinta moedas apos se arrepender?','Guardou','Lancou no templo','Deu aos pobres','Comprou um campo','B','evangelhos','profissional',20,'Judas lancou as moedas no templo.','Mateus 27:5'),
('Que inscricao Pilatos mandou pregar na cruz de Jesus?','Filho de Deus','Rei dos judeus','Salvador','Messias','B','jesus','profissional',20,'A inscricao dizia: Jesus Nazareno, Rei dos Judeus.','Joao 19:19'),
('A quem Jesus se revelou a caminho de Emaus apos ressuscitar?','A Pedro e Joao','A dois discipulos','A Maria','Aos onze','B','evangelhos','profissional',20,'Jesus caminhou com dois discipulos a Emaus.','Lucas 24:15'),
('Quantas vezes Jesus perguntou a Pedro se ele o amava, apos a ressurreicao?','1','2','3','7','C','evangelhos','profissional',20,'Jesus perguntou tres vezes: Tu me amas?','Joao 21:17'),
('Qual homem coxo foi curado por Pedro e Joao a porta do templo chamada Formosa?','Nao nomeado','Eneias','Malco','Bartimeu','A','atos_igreja','profissional',20,'Um coxo de nascenca foi curado a porta Formosa.','Atos 3:2'),
('Quem Filipe batizou apos explicar as Escrituras numa carruagem?','Cornelio','O eunuco etiope','Simao','Lidia','B','atos_igreja','profissional',20,'Filipe batizou o eunuco etiope.','Atos 8:38'),
('Qual rei foi ferido por um anjo e comido por vermes por aceitar honra de deus?','Herodes Agripa','Herodes Antipas','Pilatos','Festo','A','atos_igreja','profissional',20,'Herodes foi ferido por um anjo e comido de vermes.','Atos 12:23'),
('Diante de qual rei Paulo fez sua defesa dizendo por pouco me persuades a ser cristao?','Felix','Festo','Agripa','Cesar','C','atos_igreja','profissional',20,'Paulo se defendeu diante do rei Agripa.','Atos 26:28'),
-- ===================== ESPECIALISTA =====================
('Segundo Apocalipse, quantos sao selados das tribos de Israel?','12000','70000','144000','1000000','C','apocalipse','especialista',30,'Sao cento e quarenta e quatro mil selados.','Apocalipse 7:4'),
('Quantos cavaleiros aparecem quando o Cordeiro abre os primeiros selos?','3','4','7','10','B','apocalipse','especialista',30,'Sao os quatro cavaleiros do Apocalipse.','Apocalipse 6:1'),
('Como e chamada a cidade que desce do ceu no fim do Apocalipse?','Babilonia','Nova Jerusalem','Siao','Eden','B','apocalipse','especialista',30,'A Nova Jerusalem desce do ceu.','Apocalipse 21:2'),
('Qual arvore esta na Nova Jerusalem, cujas folhas servem para a cura das nacoes?','A oliveira','A arvore da vida','A figueira','A videira','B','apocalipse','especialista',30,'A arvore da vida esta na cidade celestial.','Apocalipse 22:2'),
('Qual profeta teve a visao de quatro seres viventes e rodas cheias de olhos?','Daniel','Ezequiel','Isaias','Zacarias','B','profetas','especialista',30,'Ezequiel viu os seres viventes e as rodas.','Ezequiel 1:15'),
('Quem explicou a Daniel a visao das setenta semanas?','Miguel','Gabriel','Um serafim','Um anciao','B','profetas','especialista',30,'O anjo Gabriel explicou a visao a Daniel.','Daniel 9:21'),
('Qual profeta menor incentivou o povo a reconstruir o templo apos o exilio?','Malaquias','Ageu','Sofonias','Naum','B','profetas','especialista',30,'Ageu animou o povo a reconstruir o templo.','Ageu 1:8'),
('Quem liderou o retorno dos primeiros exilados e lancou os fundamentos do templo?','Neemias','Zorobabel','Esdras','Ageu','B','antigo_testamento','especialista',30,'Zorobabel liderou o retorno e o inicio do templo.','Esdras 3:8'),
('Qual esposa de Davi impediu que ele derramasse sangue, levando-lhe provisoes?','Mical','Abigail','Bate-Seba','Ainoa','B','reis','especialista',30,'Abigail apaziguou Davi com provisoes.','1 Samuel 25:18'),
('Qual filha de Saul foi a primeira esposa de Davi?','Merabe','Mical','Abigail','Ainoa','B','reis','especialista',30,'Mical, filha de Saul, casou com Davi.','1 Samuel 18:27'),
('Quantos anos Salomao levou para construir o templo?','3','7','13','20','B','reis','especialista',30,'O templo foi construido em sete anos.','1 Reis 6:38'),
('Qual profeta foi alimentado por uma viuva em Sarepta durante a seca?','Eliseu','Elias','Isaias','Amos','B','profetas','especialista',30,'A viuva de Sarepta sustentou Elias.','1 Reis 17:9'),
('Como Eliseu puniu os jovens que zombaram de sua calvicie?','Com fogo','Com dois ursos','Com pragas','Com cegueira','B','profetas','especialista',30,'Dois ursos sairam do bosque contra os zombadores.','2 Reis 2:24'),
('Segundo Eclesiastes, ha um tempo para tudo debaixo do que?','Sol (ceu)','Mar','Templo','Trono','A','sabedoria','especialista',30,'Ha tempo para todo proposito debaixo do ceu.','Eclesiastes 3:1'),
('Como e descrita a mulher virtuosa no fim de Proverbios: o seu valor excede o de?','Ouro','Rubis (pedras preciosas)','Prata','Perolas','B','sabedoria','especialista',30,'O seu valor excede o de rubis.','Proverbios 31:10'),
('Segundo o Salmo 1, o homem bem-aventurado e como uma arvore plantada junto a?','Montanhas','Correntes de aguas','Campos','Cidades','B','sabedoria','especialista',30,'Como arvore plantada junto a ribeiros de aguas.','Salmos 1:3'),
('De onde vem o socorro, segundo o Salmo 121?','Dos montes','Do Senhor, que fez o ceu e a terra','Do templo','Dos anjos','B','sabedoria','especialista',30,'O meu socorro vem do Senhor, que fez o ceu e a terra.','Salmos 121:2'),
('Qual casal ensinou o caminho de Deus a Apolo e ajudou Paulo?','Ananias e Safira','Aquila e Priscila','Boaz e Rute','Zacarias e Isabel','B','cartas','especialista',30,'Aquila e Priscila instruiram Apolo.','Atos 18:26'),
('Qual mulher e chamada por Paulo de serva da igreja de Cencreia?','Lidia','Febe','Priscila','Dorcas','B','cartas','especialista',30,'Paulo recomenda Febe, serva da igreja de Cencreia.','Romanos 16:1'),
('Segundo Efesios, qual peca da armadura de Deus e a Palavra de Deus?','O escudo','A espada do Espirito','O capacete','O cinturao','B','cartas','especialista',30,'A espada do Espirito e a Palavra de Deus.','Efesios 6:17'),
('Segundo Tiago, a fe sem obras e?','Forte','Morta','Suficiente','Viva','B','cartas','especialista',30,'A fe sem obras e morta.','Tiago 2:26'),
('Qual apostolo escreveu que Deus e amor?','Paulo','Pedro','Joao','Tiago','C','cartas','especialista',30,'Joao escreveu que Deus e amor.','1 Joao 4:8')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE =====================
('Quem andou com Deus e foi arrebatado sem passar pela morte?','Noe','Enoque','Elias','Matusalem','B','patriarcas','iniciante',10,'Enoque andou com Deus e foi arrebatado.','Genesis 5:24'),
('Que torre o povo tentou construir ate o ceu, e Deus confundiu as linguas?','Torre de Siloe','Torre de Babel','Torre de Davi','Torre de Siao','B','criacao','iniciante',10,'A torre de Babel; Deus confundiu as linguas.','Genesis 11:9'),
('Deus prometeu a Abraao uma descendencia tao numerosa como o que?','As pedras','As estrelas do ceu','As arvores','As montanhas','B','patriarcas','iniciante',10,'Descendencia como as estrelas do ceu.','Genesis 15:5'),
('Qual foi o filho de Abraao com a serva Agar?','Isaque','Ismael','Esau','Midia','B','patriarcas','iniciante',10,'Ismael nasceu de Abraao e Agar.','Genesis 16:15'),
('Que sinal marcava as casas de Israel para o anjo da morte passar na Pascoa?','Uma cruz','Sangue nos umbrais','Uma luz','Um pano','B','exodo','iniciante',10,'O sangue do cordeiro nos umbrais protegia as casas.','Exodo 12:13'),
('Como Deus guiava o povo de Israel de dia no deserto?','Por uma estrela','Por uma coluna de nuvem','Por um anjo visivel','Pelo sol','B','exodo','iniciante',10,'De dia uma coluna de nuvem os guiava.','Exodo 13:21'),
('Como Deus guiava o povo de Israel a noite no deserto?','Pela lua','Por uma coluna de fogo','Por tochas','Por estrelas','B','exodo','iniciante',10,'A noite, uma coluna de fogo os iluminava.','Exodo 13:21'),
('Qual era a oracao central de Israel: Ouve, o Israel, o Senhor nosso Deus e o unico...?','Rei','Senhor','Pai','Juiz','B','antigo_testamento','iniciante',10,'Ouve, Israel: o Senhor nosso Deus e o unico Senhor.','Deuteronomio 6:4'),
('Quem foi a rainha da Persia, esposa do rei antes de Ester?','Vasti','Jezabel','Atalia','Herodias','A','antigo_testamento','iniciante',10,'Vasti foi destituida antes de Ester ser rainha.','Ester 1:19'),
('Quem criou Ester como se fosse filha?','Neemias','Mardoqueu','Esdras','Zorobabel','B','antigo_testamento','iniciante',10,'Mardoqueu criou Ester, sua prima.','Ester 2:7'),
('Segundo o Salmo 23, o Senhor e o meu pastor e nada me...?','Falta (faltara)','Assusta','Impede','Cansa','A','sabedoria','iniciante',10,'O Senhor e o meu pastor, nada me faltara.','Salmos 23:1'),
('Complete: Lampada para os meus pes e a tua...?','Luz','Palavra','Graca','Verdade','B','sabedoria','iniciante',10,'Lampada para os meus pes e a tua palavra.','Salmos 119:105'),
('Segundo Joao 3:16, Deus amou o mundo de tal maneira que deu seu Filho...?','Amado','Unigenito','Servo','Primogenito','B','evangelhos','iniciante',10,'Deu o seu Filho unigenito.','Joao 3:16'),
('Quem escreveu no chao quando trouxeram a mulher adultera a Jesus?','Pedro','Jesus','Um escriba','Joao','B','evangelhos','iniciante',10,'Jesus escreveu no chao com o dedo.','Joao 8:6'),
('O que Jesus disse a quem quisesse atirar a primeira pedra na adultera?','Que fosse embora','Que estivesse sem pecado','Que orasse','Que a perdoasse','B','evangelhos','iniciante',10,'Quem estiver sem pecado atire a primeira pedra.','Joao 8:7'),
('Qual oferta pequena de uma viuva Jesus elogiou no templo?','Duas moedinhas','Um pao','Um cordeiro','Uma joia','A','evangelhos','iniciante',10,'A viuva deu duas pequenas moedas, tudo o que tinha.','Marcos 12:42'),
('Qual foi o primeiro homem a ser chamado por Jesus para segui-lo?','Andre','Pedro','Filipe','Mateus','A','evangelhos','iniciante',10,'Andre foi um dos primeiros a seguir Jesus.','Joao 1:40'),
('Onde Jesus cresceu, sendo chamado de nazareno?','Belem','Nazare','Cafarnaum','Jerusalem','B','jesus','iniciante',10,'Jesus cresceu em Nazare.','Mateus 2:23'),
('Qual era a profissao de Jose, pai adotivo de Jesus?','Pescador','Carpinteiro','Sacerdote','Pastor','B','jesus','iniciante',10,'Jose era carpinteiro.','Mateus 13:55'),
('Filipe disse a Natanael: vem e ve. Onde Jesus o tinha visto antes?','No templo','Debaixo da figueira','No mar','Na sinagoga','B','evangelhos','iniciante',10,'Jesus viu Natanael debaixo da figueira.','Joao 1:48'),
-- ===================== PROFISSIONAL =====================
('Quem abencoou Abraao e era rei de Salem e sacerdote do Deus Altissimo?','Ismael','Melquisedeque','Lo','Abimeleque','B','patriarcas','profissional',20,'Melquisedeque, rei de Salem, abencoou Abraao.','Genesis 14:18'),
('Como Jaco enganou o pai Isaque para receber a bencao de Esau?','Com um presente','Cobrindo-se de peles para parecer peludo','Mentindo o nome','Escondendo-se','B','patriarcas','profissional',20,'Jaco se cobriu de peles para imitar Esau.','Genesis 27:16'),
('Jaco sonhou com uma escada que ligava a terra ao que?','Ao mar','Ao ceu','Ao templo','Ao deserto','B','patriarcas','profissional',20,'Jaco sonhou com a escada que chegava ao ceu.','Genesis 28:12'),
('Quantas pessoas da familia de Jaco desceram ao Egito?','40','70','100','120','B','patriarcas','profissional',20,'Setenta almas da casa de Jaco foram ao Egito.','Genesis 46:27'),
('Enquanto Moises erguia as maos, Israel vencia. Quem sustentou seus bracos?','Josue e Cale','Arao e Hur','Nadabe e Abiu','Jetro e Hobabe','B','exodo','profissional',20,'Arao e Hur sustentaram as maos de Moises.','Exodo 17:12'),
('Qual foi o pecado de Aca que trouxe derrota a Israel em Ai?','Idolatria','Roubar objetos consagrados','Mentir','Fugir da batalha','B','antigo_testamento','profissional',20,'Aca escondeu objetos consagrados do despojo.','Josue 7:1'),
('Qual juiz era canhoto e matou o rei Eglom de Moabe?','Otniel','Eude','Sangar','Baraque','B','antigo_testamento','profissional',20,'Eude, canhoto, matou o rei Eglom.','Juizes 3:21'),
('Que teste Gideao propos a Deus usando um velo de la?','Fogo do ceu','Orvalho no velo','Uma nuvem','Um trovao','B','antigo_testamento','profissional',20,'Gideao pediu o sinal do orvalho no velo.','Juizes 6:37'),
('Qual enigma Sansao propos sobre o que achou num leao morto?','Agua da rocha','Mel','Ouro','Trigo','B','antigo_testamento','profissional',20,'Sansao achou mel na carcaca do leao e fez um enigma.','Juizes 14:8'),
('Quem foram os filhos maus de Eli que morreram no mesmo dia?','Nadabe e Abiu','Hofni e Fineias','Amnon e Absalao','Core e Da','B','antigo_testamento','profissional',20,'Hofni e Fineias, filhos de Eli, morreram.','1 Samuel 4:11'),
('Por que Deus rejeitou Saul como rei apos a batalha contra Amaleque?','Por covardia','Por poupar Agague e o melhor gado','Por idolatria','Por mentir','B','reis','profissional',20,'Saul poupou o rei Agague e o melhor do gado, desobedecendo.','1 Samuel 15:9'),
('O que aconteceu a Uza ao tocar na arca da alianca para firma-la?','Ficou cego','Morreu','Ficou mudo','Foi curado','B','reis','profissional',20,'Uza morreu ao tocar na arca.','2 Samuel 6:7'),
('Qual rei menino foi escondido no templo e escapou da rainha Atalia?','Uzias','Joas','Amazias','Acaz','B','reis','profissional',20,'Joas foi escondido e depois proclamado rei.','2 Reis 11:2'),
('Segundo Proverbios, o que devemos fazer para que Deus enderece nossos caminhos?','Trabalhar muito','Confiar no Senhor de todo o coracao','Buscar riqueza','Orar so de manha','B','sabedoria','profissional',20,'Confia no Senhor de todo o teu coracao.','Proverbios 3:5'),
('Segundo Isaias, os que esperam no Senhor renovam as forcas e sobem como aguias com o que?','Coragem','Asas','Forca','Fe','B','profetas','profissional',20,'Subirao com asas como aguias.','Isaias 40:31'),
('Qual sinal Isaias deu de que uma virgem conceberia e daria a luz um filho?','Emanuel','Jesus','Josue','Isaias','A','profetas','profissional',20,'O filho se chamaria Emanuel, Deus conosco.','Isaias 7:14'),
('Segundo Jeremias, quais pensamentos Deus tem para o seu povo?','De guerra','De paz e nao de mal','De juizo','De prova','B','profetas','profissional',20,'Pensamentos de paz e nao de mal, para dar futuro e esperanca.','Jeremias 29:11'),
('Como o profeta Miqueias resume o que o Senhor pede: praticar a justica, amar a misericordia e...?','Jejuar','Andar humildemente com Deus','Ofertar muito','Orar sempre','B','profetas','profissional',20,'Andar humildemente com o teu Deus.','Miqueias 6:8'),
('No inicio do evangelho de Joao, o Verbo se fez o que e habitou entre nos?','Luz','Carne','Palavra','Espirito','B','evangelhos','profissional',20,'O Verbo se fez carne e habitou entre nos.','Joao 1:14'),
('Qual foi o maior mandamento segundo Jesus?','Nao matar','Amar a Deus sobre todas as coisas','Honrar os pais','Guardar o sabado','B','evangelhos','profissional',20,'Amaras o Senhor teu Deus de todo o coracao.','Mateus 22:37'),
-- ===================== ESPECIALISTA =====================
('Qual patriarca teve gemeos chamados Esau e Jaco?','Abraao','Isaque','Jaco','Jose','B','patriarcas','especialista',30,'Isaque e Rebeca tiveram Esau e Jaco.','Genesis 25:24'),
('Que sonhos Jose interpretou na prisao para dois presos do farao?','Do padeiro e do copeiro','De dois soldados','De dois sacerdotes','De dois reis','A','patriarcas','especialista',30,'Jose interpretou os sonhos do copeiro e do padeiro.','Genesis 40:8'),
('Qual foi a primeira praga, em que as aguas do Nilo viraram sangue?','Segunda','Primeira','Terceira','Quarta','B','exodo','especialista',30,'A primeira praga transformou o Nilo em sangue.','Exodo 7:20'),
('Quantos anos Israel devia deixar a terra descansar, no ano sabatico?','A cada 3 anos','A cada 7 anos','A cada 10 anos','A cada 50 anos','B','antigo_testamento','especialista',30,'A cada sete anos a terra descansava.','Levitico 25:4'),
('A cada quantos anos era celebrado o Jubileu em Israel?','7','25','49','50','D','antigo_testamento','especialista',30,'O Jubileu era no quinquagesimo (50) ano.','Levitico 25:10'),
('Como se chamavam as cidades onde alguem que matasse sem intencao podia se refugiar?','Cidades santas','Cidades de refugio','Cidades levitas','Cidades altas','B','antigo_testamento','especialista',30,'Eram as cidades de refugio.','Numeros 35:11'),
('Qual neto de Saul, coxo dos pes, foi tratado com bondade por Davi?','Isbosete','Mefibosete','Abner','Zibá','B','reis','especialista',30,'Davi honrou Mefibosete, filho de Jonatas.','2 Samuel 9:6'),
('Onde Davi comprou a eira para levantar um altar apos a peste?','De Nabote','De Arauna, o jebuseu','De Boaz','De Zadoque','B','reis','especialista',30,'Davi comprou a eira de Arauna.','2 Samuel 24:24'),
('Qual rei de Juda ficou leproso por invadir o templo para queimar incenso?','Acaz','Uzias','Josias','Ezequias','B','reis','especialista',30,'Uzias ficou leproso por usurpar funcao sacerdotal.','2 Cronicas 26:19'),
('Qual oracao pediu bencao e ampliacao de territorio, sendo atendida por Deus?','De Ana','De Jabez','de Ezequias','De Salomao','B','sabedoria','especialista',30,'A oracao de Jabez foi atendida por Deus.','1 Cronicas 4:10'),
('Segundo o Salmo 51, o que Davi pede a Deus que crie nele?','Um coracao puro','Um novo caminho','Uma nova casa','Riquezas','A','sabedoria','especialista',30,'Cria em mim um coracao puro, o Deus.','Salmos 51:10'),
('Segundo o Salmo 139, como o salmista se descreve diante da criacao de Deus?','Forte e valente','Formado de modo assombroso e maravilhoso','Pequeno e fraco','Sabio e justo','B','sabedoria','especialista',30,'Formado de maneira assombrosa e maravilhosa.','Salmos 139:14'),
('Qual besta gigante e descrita no livro de Jó, alem do Leviata?','Golias','Beemote','Reem','Dragao','B','sabedoria','especialista',30,'Deus descreve o Beemote a Jo.','Jó 40:15'),
('Quanto Deus restituiu a Jó no final, em relacao ao que ele tinha?','O mesmo','O dobro','O triplo','Dez vezes','B','sabedoria','especialista',30,'Deus deu a Jo o dobro do que tinha antes.','Jó 42:10'),
('Segundo Romanos, todos pecaram e carecem da que de Deus?','Bondade','Gloria','Justica','Paciencia','B','cartas','especialista',30,'Todos pecaram e carecem da gloria de Deus.','Romanos 3:23'),
('Segundo Romanos, qual e o salario do pecado?','A doenca','A morte','A pobreza','A tristeza','B','cartas','especialista',30,'O salario do pecado e a morte.','Romanos 6:23'),
('Segundo Filipenses, Paulo diz: tudo posso naquele que me...?','Ama','Fortalece','Ajuda','Guia','B','cartas','especialista',30,'Tudo posso naquele que me fortalece.','Filipenses 4:13'),
('Segundo 1 Timoteo, qual e a raiz de todos os males?','O orgulho','O amor ao dinheiro','A mentira','A preguica','B','cartas','especialista',30,'O amor ao dinheiro e a raiz de todos os males.','1 Timoteo 6:10'),
('Segundo 2 Timoteo, Paulo declara: combati o bom combate, acabei a carreira e guardei a...?','Lei','Fe','Palavra','Promessa','B','cartas','especialista',30,'Combati o bom combate, guardei a fe.','2 Timoteo 4:7'),
('Segundo Hebreus, sem que e impossivel agradar a Deus?','Amor','Fe','Obras','Oracao','B','cartas','especialista',30,'Sem fe e impossivel agradar a Deus.','Hebreus 11:6'),
('Segundo Apocalipse, Jesus diz: eis que estou a porta e...?','Chamo','Bato','Entro','Espero','B','apocalipse','especialista',30,'Eis que estou a porta e bato.','Apocalipse 3:20')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE =====================
('Deus criou o homem a sua imagem e...?','Semelhanca','Forca','Sabedoria','Vontade','A','criacao','iniciante',10,'Deus criou o homem a sua imagem e semelhanca.','Genesis 1:27'),
('Qual animal tentou Eva no jardim do Eden?','O leao','A serpente','O corvo','O lobo','B','criacao','iniciante',10,'A serpente enganou Eva.','Genesis 3:1'),
('Quem foi o terceiro filho de Adao e Eva, apos Caim e Abel?','Enoque','Sete','Lameque','Jafé','B','criacao','iniciante',10,'Sete nasceu depois de Caim e Abel.','Genesis 4:25'),
('Quantos de cada animal impuro entraram na arca de Noe?','1 par','2 (um casal)','7','10','B','criacao','iniciante',10,'Dos impuros, entraram dois, macho e femea.','Genesis 7:2'),
('Quem foi a esposa que Abraao mandou buscar para seu filho Isaque?','Raquel','Rebeca','Lia','Sara','B','patriarcas','iniciante',10,'Rebeca tornou-se esposa de Isaque.','Genesis 24:67'),
('Qual foi o sinal da alianca que Deus deu a Abraao na carne?','O batismo','A circuncisao','O sabado','A pascoa','B','patriarcas','iniciante',10,'A circuncisao foi o sinal da alianca.','Genesis 17:11'),
('Quem foi o sogro de Moises, sacerdote de Midia?','Hobabe','Jetro','Labao','Reuel apenas','B','exodo','iniciante',10,'Jetro, sacerdote de Midia, foi sogro de Moises.','Exodo 3:1'),
('Quantos anos Moises tinha ao morrer, com a vista ainda boa?','80','100','120','150','C','exodo','iniciante',10,'Moises morreu aos 120 anos.','Deuteronomio 34:7'),
('O que Josue mandou montar com 12 pedras do Jordao como memorial?','Um altar','Um monte de pedras','Uma parede','Uma coluna','B','antigo_testamento','iniciante',10,'Doze pedras foram postas como memorial.','Josue 4:20'),
('Quem disse: Eu e a minha casa serviremos ao Senhor?','Moises','Josue','Gideao','Davi','B','antigo_testamento','iniciante',10,'Josue declarou que serviria ao Senhor.','Josue 24:15'),
('Quando o povo pedia agua, Deus disse a Moises para falar ou ferir uma rocha. O que saiu dela?','Fogo','Agua','Fumaca','Oleo','B','exodo','iniciante',10,'Agua saiu da rocha para o povo beber.','Exodo 17:6'),
('Qual instrumento o rei Davi tocava para acalmar o rei Saul?','Trombeta','Harpa','Flauta','Tambor','B','reis','iniciante',10,'Davi tocava harpa e Saul se acalmava.','1 Samuel 16:23'),
('Quantos filhos de Jesse passaram antes de Davi ser escolhido para ser ungido?','5','7','9','10','B','reis','iniciante',10,'Sete filhos passaram antes de Davi.','1 Samuel 16:10'),
('O que Elias pediu que caisse do ceu no monte Carmelo, provando que Deus e o verdadeiro?','Chuva','Fogo','Trovao','Granizo','B','profetas','iniciante',10,'O fogo do Senhor caiu e consumiu o holocausto.','1 Reis 18:38'),
('Segundo o Salmo 46, Deus e o nosso refugio e...?','Escudo','Fortaleza','Rocha','Guia','B','sabedoria','iniciante',10,'Deus e o nosso refugio e fortaleza.','Salmos 46:1'),
('Jesus disse: Deixai vir a mim os...?','Doentes','Meninos (criancas)','Pobres','Pecadores','B','evangelhos','iniciante',10,'Deixai vir a mim os pequeninos.','Marcos 10:14'),
('Quantas vezes Jesus disse que devemos perdoar (setenta vezes...)?','Sete','Setenta vezes sete','Cem','Mil','B','evangelhos','iniciante',10,'Ate setenta vezes sete.','Mateus 18:22'),
('Qual apostolo era irmao de Pedro?','Tiago','Andre','Joao','Filipe','B','evangelhos','iniciante',10,'Andre era irmao de Simao Pedro.','Joao 1:40'),
('Que ave lembra a Pedro sua negacao, ao cantar?','A pomba','O galo','O corvo','A aguia','B','evangelhos','iniciante',10,'O galo cantou apos a negacao de Pedro.','Mateus 26:74'),
('Onde Jesus subiu ao ceu diante dos discipulos?','No templo','No monte das Oliveiras','Em Belem','No Calvario','B','jesus','iniciante',10,'Jesus foi elevado ao ceu do monte das Oliveiras.','Atos 1:12'),
-- ===================== PROFISSIONAL =====================
('Como Jose provou seus irmaos, escondendo um objeto na bagagem de Benjamim?','Uma espada','Uma taca de prata','Ouro','Uma carta','B','patriarcas','profissional',20,'Jose escondeu sua taca na bagagem de Benjamim.','Genesis 44:2'),
('Ao abencoar os filhos de Jose, Jaco cruzou as maos preferindo qual neto mais novo?','Manasses','Efraim','Benjamim','Ruben','B','patriarcas','profissional',20,'Jaco deu a bencao maior a Efraim, o mais novo.','Genesis 48:14'),
('A que animal Jaco comparou seu filho Juda ao abencoa-lo?','Lobo','Leao','Aguia','Touro','B','patriarcas','profissional',20,'Juda e comparado a um leao.','Genesis 49:9'),
('Qual foi a bencao que Arao devia declarar: O Senhor te abencoe e te...?','Ame','Guarde','Ouca','Console','B','exodo','profissional',20,'O Senhor te abencoe e te guarde.','Numeros 6:24'),
('Por quantos dias Miria ficou leprosa por murmurar contra Moises?','3','7','14','40','B','exodo','profissional',20,'Miriam ficou sete dias leprosa fora do arraial.','Numeros 12:15'),
('Quantos anos tinha Cale quando pediu a montanha de Hebrom como heranca?','65','75','85','95','C','antigo_testamento','profissional',20,'Cale tinha oitenta e cinco anos, ainda forte.','Josue 14:10'),
('Qual cordao vermelho Raabe pos na janela como sinal para ser poupada?','Um cordao de escarlata','Uma fita azul','Uma corda branca','Um pano dourado','A','antigo_testamento','profissional',20,'Raabe amarrou um cordao de escarlata na janela.','Josue 2:18'),
('Que povo enganou Josue fingindo vir de longe, com paes bolorentos?','Os amalequitas','Os gibeonitas','Os filisteus','Os moabitas','B','antigo_testamento','profissional',20,'Os gibeonitas enganaram Josue com paes velhos.','Josue 9:5'),
('Qual mulher juiza convocou Baraque para a batalha contra Sisera?','Jael','Debora','Ana','Rute','B','antigo_testamento','profissional',20,'Debora convocou Baraque.','Juizes 4:6'),
('Qual foi a arma improvavel com que Sangar matou seiscentos filisteus?','Uma funda','Uma aguilhada de bois','Uma queixada','Uma lanca','B','antigo_testamento','profissional',20,'Sangar usou uma aguilhada de bois.','Juizes 3:31'),
('Qual anjo apareceu a Maria anunciando o nascimento de Jesus?','Miguel','Gabriel','Rafael','Uriel','B','jesus','profissional',20,'O anjo Gabriel anunciou a Maria.','Lucas 1:26'),
('O que Maria cantou ao visitar Isabel, louvando a Deus?','O Pai nosso','O Magnificat (A minha alma engrandece o Senhor)','Um salmo','O Shema','B','evangelhos','profissional',20,'Maria entoou o cantico: A minha alma engrandece o Senhor.','Lucas 1:46'),
('Quem confessou: Tu es o Cristo, o Filho do Deus vivo?','Joao','Pedro','Andre','Tome','B','evangelhos','profissional',20,'Pedro confessou que Jesus e o Cristo.','Mateus 16:16'),
('Sobre qual rocha Jesus disse que edificaria a sua igreja?','Sobre Joao','Sobre a confissao de Pedro','Sobre Tiago','Sobre o templo','B','evangelhos','profissional',20,'Sobre esta rocha edificarei a minha igreja.','Mateus 16:18'),
('Quantos discipulos Jesus enviou dois a dois para pregar (os setenta)?','12','40','70','120','C','evangelhos','profissional',20,'Jesus enviou setenta discipulos.','Lucas 10:1'),
('O que Jesus lavou dos discipulos na ultima ceia, dando exemplo de servico?','As maos','Os pes','O rosto','A cabeca','B','jesus','profissional',20,'Jesus lavou os pes dos discipulos.','Joao 13:5'),
('O que aconteceu ao ceu durante tres horas enquanto Jesus estava na cruz?','Choveu','Ficou em trevas','Brilhou','Trovejou','B','jesus','profissional',20,'Houve trevas sobre a terra por tres horas.','Mateus 27:45'),
('O que Jesus prometeu ao ladrao arrependido na cruz?','Perdao apenas','Que estaria com Ele no paraiso','Cura','Riqueza','B','jesus','profissional',20,'Hoje estaras comigo no paraiso.','Lucas 23:43'),
('Qual foi a ultima palavra de Jesus na cruz: Esta...?','Terminado','Consumado','Cumprido','Feito','B','jesus','profissional',20,'Esta consumado (tudo esta cumprido).','Joao 19:30'),
('Quem foi o fariseu, mestre da Lei, que aconselhou moderacao contra os apostolos?','Nicodemos','Gamaliel','Caifas','Anas','B','atos_igreja','profissional',20,'Gamaliel aconselhou cautela no Sinedrio.','Atos 5:34'),
-- ===================== ESPECIALISTA =====================
('Quantos filhos de Jaco nasceram de Lia?','4','6','8','10','B','patriarcas','especialista',30,'Lia deu a Jaco seis filhos.','Genesis 30:20'),
('Qual foi a esposa favorita de Jaco, mae de Jose e Benjamim?','Lia','Raquel','Bila','Zilpa','B','patriarcas','especialista',30,'Raquel foi mae de Jose e Benjamim.','Genesis 30:24'),
('Onde Jaco lutou com Deus e chamou o lugar de Peniel?','No Jordao','No vau de Jaboque','em Betel','No Sinai','B','patriarcas','especialista',30,'Foi junto ao vau de Jaboque; chamou o lugar de Peniel.','Genesis 32:30'),
('Quantas pedras havia no peitoral do sumo sacerdote, uma por tribo?','7','10','12','14','C','exodo','especialista',30,'Doze pedras preciosas, uma por tribo.','Exodo 28:21'),
('Qual objeto ficava sobre a arca, onde Deus se encontrava com Moises?','O altar','O propiciatorio','O candelabro','A mesa','B','exodo','especialista',30,'O propiciatorio, com dois querubins, ficava sobre a arca.','Exodo 25:22'),
('No Dia da Expiacao, para onde era enviado o bode emissario?','Ao templo','Ao deserto','Ao altar','Ao mar','B','antigo_testamento','especialista',30,'O bode emissario era enviado ao deserto.','Levitico 16:22'),
('Quantos anjos o Senhor enviou e feriu o exercito assirio de Senaqueribe (185 mil)?','Um','Dois','Sete','Doze','A','reis','especialista',30,'Um anjo do Senhor feriu 185 mil assirios.','2 Reis 19:35'),
('Qual sinal Deus deu a Ezequias, fazendo a sombra do relogio de sol retroceder?','5 graus','10 graus','15 graus','20 graus','B','reis','especialista',30,'A sombra retrocedeu dez graus.','2 Reis 20:11'),
('Qual profeta ungiu Jeu como rei para destruir a casa de Acabe?','Elias','Eliseu (por um discipulo)','Isaias','Amos','B','profetas','especialista',30,'Eliseu enviou um discipulo para ungir Jeu.','2 Reis 9:6'),
('Qual rei de Juda reinou apenas tres meses e foi levado cativo ao Egito?','Joacaz','Jeoaquim','Joaquim','Zedequias','A','reis','especialista',30,'Joacaz reinou tres meses e foi levado ao Egito.','2 Reis 23:31'),
('Quem foi o ultimo rei de Juda, que teve os olhos vazados pelos babilonios?','Joaquim','Zedequias','Jeoaquim','Manasses','B','reis','especialista',30,'Zedequias teve os olhos vazados.','2 Reis 25:7'),
('Por quantos dias Ester pediu que os judeus jejuassem antes de ela ir ao rei?','1','3','7','40','B','antigo_testamento','especialista',30,'Ester pediu jejum de tres dias.','Ester 4:16'),
('Em que Hama foi enforcado, o mesmo que preparara para Mardoqueu?','Numa cruz','Na propria forca','Numa arvore','Numa torre','B','antigo_testamento','especialista',30,'Hama foi enforcado na forca que fizera para Mardoqueu.','Ester 7:10'),
('Qual festa celebra a libertacao dos judeus no tempo de Ester?','Pascoa','Purim','Tabernaculos','Pentecostes','B','antigo_testamento','especialista',30,'A festa de Purim celebra esse livramento.','Ester 9:26'),
('Segundo Lamentacoes, as misericordias do Senhor se renovam a cada?','Semana','Manha','Ano','Sabado','B','profetas','especialista',30,'As misericordias se renovam cada manha.','Lamentacoes 3:23'),
('Segundo Ezequiel, que tipo de coracao Deus prometeu dar no lugar do coracao de pedra?','Um coracao forte','Um coracao de carne','Um coracao novo apenas','Um coracao sabio','B','profetas','especialista',30,'Deus daria um coracao de carne no lugar do de pedra.','Ezequiel 36:26'),
('O que os tres amigos de Daniel recusaram comer na corte da Babilonia?','Pao','As iguarias do rei','Carne de porco apenas','Frutas','B','profetas','especialista',30,'Recusaram as iguarias do rei e pediram legumes.','Daniel 1:12'),
('Segundo Isaias 9, um dos nomes do Messias e Principe da...?','Gloria','Paz','Luz','Vida','B','profetas','especialista',30,'Ele se chama Principe da Paz.','Isaias 9:6'),
('Segundo Isaias 55, a Palavra que sai da boca de Deus nao volta para ele...?','Vazia (sem efeito)','Rapido','Sozinha','Fraca','A','profetas','especialista',30,'A minha palavra nao voltara vazia.','Isaias 55:11'),
('Qual profeta previu o rei vindo a Jerusalem humilde, montado num jumento?','Isaias','Zacarias','Miqueias','Malaquias','B','profetas','especialista',30,'Zacarias profetizou o rei sobre um jumentinho.','Zacarias 9:9'),
('Segundo 1 Corintios 15, Cristo ressuscitou como primicias dos que...?','Creram','Dormem (morreram)','Pecaram','Sofreram','B','cartas','especialista',30,'Cristo, as primicias dos que dormem.','1 Corintios 15:20'),
('Segundo 2 Corintios, quem esta em Cristo e uma nova...?','Vida','Criatura (criacao)','Pessoa','Alma','B','cartas','especialista',30,'Se alguem esta em Cristo, nova criatura e.','2 Corintios 5:17'),
('Segundo 2 Corintios, Deus ama a quem da com que animo?','Triste','Alegre','Obrigado','Sabio','B','cartas','especialista',30,'Deus ama ao que da com alegria.','2 Corintios 9:7')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
-- ===================== INICIANTE =====================
('Jesus ensinou: Amai os vossos...?','Amigos','Inimigos','Vizinhos','Irmaos','B','evangelhos','iniciante',10,'Amai os vossos inimigos.','Mateus 5:44'),
('Segundo Jesus, onde devemos ajuntar tesouros?','Na terra','No ceu','Em casa','No templo','B','evangelhos','iniciante',10,'Ajuntai tesouros no ceu.','Mateus 6:20'),
('Jesus disse: Buscai primeiro o Reino de Deus e a sua...?','Paz','Justica','Gloria','Luz','B','evangelhos','iniciante',10,'Buscai primeiro o Reino de Deus e a sua justica.','Mateus 6:33'),
('O homem prudente construiu a casa sobre a...?','Areia','Rocha','Terra','Agua','B','parabolas','iniciante',10,'O prudente edificou a casa sobre a rocha.','Mateus 7:24'),
('Jesus disse: Eu sou a videira, vos sois as...?','Folhas','Varas (ramos)','Raizes','Flores','B','jesus','iniciante',10,'Eu sou a videira, vos as varas.','Joao 15:5'),
('Quantos leprosos voltaram para agradecer a cura a Jesus?','Nenhum','Um','Cinco','Todos','B','milagres','iniciante',10,'Apenas um dos dez voltou a agradecer.','Lucas 17:15'),
('Quem foi o pai de Isaque?','Noe','Abraao','Jaco','Lo','B','patriarcas','iniciante',10,'Isaque era filho de Abraao.','Genesis 21:3'),
('Qual foi o alimento proibido por Deus no Eden?','O trigo','O fruto de uma arvore','A carne','O vinho','B','criacao','iniciante',10,'Da arvore do conhecimento nao deviam comer.','Genesis 2:17'),
('Quem foi jogado num poco pelos irmaos antes de ser vendido?','Benjamim','Jose','Ruben','Juda','B','patriarcas','iniciante',10,'Jose foi lancado num poco pelos irmaos.','Genesis 37:24'),
('Qual profeta ungiu tanto Saul quanto Davi como reis?','Nata','Samuel','Elias','Gade','B','reis','iniciante',10,'Samuel ungiu Saul e depois Davi.','1 Samuel 16:13'),
('Quem foi a esposa de Adao?','Sara','Eva','Rebeca','Lia','B','criacao','iniciante',10,'Eva foi a esposa de Adao.','Genesis 3:20'),
('Onde nasceu Jesus, segundo a profecia?','Nazare','Belem','Jerusalem','Cafarnaum','B','jesus','iniciante',10,'Jesus nasceu em Belem.','Miqueias 5:2'),
('Quantos apostolos Jesus tinha ao todo?','7','10','12','15','C','evangelhos','iniciante',10,'Foram doze apostolos.','Lucas 6:13'),
('Qual foi o monte onde Elias desafiou os profetas de Baal?','Sinai','Carmelo','Nebo','Hermom','B','profetas','iniciante',10,'O desafio foi no monte Carmelo.','1 Reis 18:19'),
('Qual rei escreveu muitos Provérbios?','Davi','Salomao','Ezequias','Josias','B','sabedoria','iniciante',10,'Salomao escreveu muitos proverbios.','Proverbios 1:1'),
-- ===================== PROFISSIONAL =====================
('Jesus curou dez leprosos; de que regiao eles estavam a caminho?','Galileia','Entre a Samaria e a Galileia','Judeia','Perea','B','milagres','profissional',20,'Jesus passava entre a Samaria e a Galileia.','Lucas 17:11'),
('Qual mulher estrangeira insistiu com Jesus dizendo que ate os caezinhos comem migalhas?','A samaritana','A mulher cananeia','Marta','A viuva','B','milagres','profissional',20,'A cananeia respondeu sobre as migalhas e teve a filha curada.','Mateus 15:27'),
('Que palavra Jesus disse ao curar o surdo e gago, que significa abre-te?','Talita cumi','Efata','Marana ta','Raca','B','milagres','profissional',20,'Jesus disse Efata, que significa abre-te.','Marcos 7:34'),
('De onde Jesus expulsou uma legiao de demonios, que entraram nos porcos?','De Cafarnaum','Da regiao dos gadarenos','De Belem','De Jerico','B','milagres','profissional',20,'Foi na regiao dos gadarenos (gerasenos).','Marcos 5:13'),
('O que Jesus disse ao rico que perguntou como herdar a vida eterna?','Que orasse','Que vendesse tudo e o seguisse','Que jejuasse','Que se batizasse','B','evangelhos','profissional',20,'Vende tudo, da aos pobres e segue-me.','Marcos 10:21'),
('Qual figura Jesus usou para dizer como e dificil o rico entrar no Reino?','Um camelo pela porta','Um camelo pelo fundo de uma agulha','Um boi pela porta','Um navio pelo rio','B','evangelhos','profissional',20,'E mais facil um camelo passar pelo fundo de uma agulha.','Mateus 19:24'),
('Na parabola dos dois filhos, qual obedeceu, o que disse nao mas foi, ou o que disse sim e nao foi?','O que disse sim','O que disse nao mas foi','Nenhum','Ambos','B','parabolas','profissional',20,'O que disse nao mas depois foi obedeceu.','Mateus 21:29'),
('O que os lavradores maus fizeram com o filho do dono da vinha na parabola?','Prenderam','Mataram','Expulsaram','Ignoraram','B','parabolas','profissional',20,'Mataram o filho do dono da vinha.','Mateus 21:39'),
('Sobre pagar tributo a Cesar, o que Jesus mandou dar a Cesar?','Nada','O que e de Cesar','Metade','Tudo','B','evangelhos','profissional',20,'Dai a Cesar o que e de Cesar, e a Deus o que e de Deus.','Mateus 22:21'),
('Qual novo mandamento Jesus deu aos discipulos na ultima ceia?','Orar sempre','Amar uns aos outros','Jejuar','Pregar','B','evangelhos','profissional',20,'Que vos ameis uns aos outros.','Joao 13:34'),
('Quem foi o primeiro dos apostolos a ser morto (martirizado por Herodes)?','Pedro','Tiago, irmao de Joao','Joao','Andre','B','atos_igreja','profissional',20,'Tiago, irmao de Joao, foi morto por Herodes.','Atos 12:2'),
('Quantos homens foram escolhidos para servir as mesas, sendo Estevao um deles?','5','7','10','12','B','atos_igreja','profissional',20,'Sete homens foram escolhidos, entre eles Estevao.','Atos 6:3'),
('Em qual cidade houve um tumulto por causa da deusa Diana (Artemis) contra Paulo?','Corinto','Efeso','Atenas','Tessalonica','B','atos_igreja','profissional',20,'O tumulto de Diana foi em Efeso.','Atos 19:28'),
('Qual profeta foi chamado ainda jovem, dizendo Ah, Senhor, eu nao sei falar?','Isaias','Jeremias','Ezequiel','Daniel','B','profetas','profissional',20,'Jeremias disse que nao sabia falar por ser jovem.','Jeremias 1:6'),
('Qual foi o pecado de Nadabe e Abiu, filhos de Arao, que morreram diante do Senhor?','Roubo','Ofereceram fogo estranho','Idolatria','Mentira','B','antigo_testamento','profissional',20,'Ofereceram fogo estranho que Deus nao ordenara.','Levitico 10:1'),
-- ===================== ESPECIALISTA =====================
('Quantos filhos ao todo Jaco (Israel) teve, contando os das servas?','10','11','12','13','C','patriarcas','especialista',30,'Jaco teve doze filhos, incluindo os das servas Bila e Zilpa.','Genesis 35:22'),
('Qual filho de Jaco perdeu a primogenitura por deitar-se com a concubina do pai?','Simeao','Ruben','Levi','Juda','B','patriarcas','especialista',30,'Ruben perdeu a primogenitura por seu pecado.','Genesis 49:4'),
('Qual sacerdote zeloso deteve a praga em Israel com sua acao contra o pecado?','Eleazar','Fineias','Itamar','Arao','B','antigo_testamento','especialista',30,'Fineias, neto de Arao, deteve a praga.','Numeros 25:11'),
('Quais irmas pediram heranca por nao haver filho homem, mudando a lei?','As filhas de Lo','As filhas de Zelofeade','As filhas de Jetro','As filhas de Labao','B','antigo_testamento','especialista',30,'As filhas de Zelofeade receberam heranca.','Numeros 27:7'),
('Qual pastor de Tecoa foi chamado por Deus para profetizar, sendo tambem cultivador de sicomoros?','Oseias','Amos','Joel','Obadias','B','profetas','especialista',30,'Amos era pastor e cultivador de sicomoros em Tecoa.','Amos 7:14'),
('O que aconteceu com a planta que abrigava Jonas, deixando-o irado?','Cresceu','Secou (um verme a feriu)','Floresceu','Foi arrancada','B','profetas','especialista',30,'Um verme feriu a planta e ela secou.','Jonas 4:7'),
('Qual rei da Assiria levou as dez tribos do norte ao cativeiro, com a queda de Samaria?','Senaqueribe','Salmaneser','Tiglate-Pileser','Sargao','B','antigo_testamento','especialista',30,'Salmaneser cercou Samaria, que caiu no seu tempo.','2 Reis 17:6'),
('Qual conselheiro de Absalao se enforcou ao ver seu conselho rejeitado?','Husai','Aitofel','Joabe','Amasa','B','reis','especialista',30,'Aitofel se enforcou apos ter o conselho rejeitado.','2 Samuel 17:23'),
('Quem amaldicoou e atirou pedras em Davi durante a fuga de Absalao?','Joabe','Simei','Ziba','Amasa','B','reis','especialista',30,'Simei amaldicoou Davi e lhe atirou pedras.','2 Samuel 16:13'),
('Como Absalao ficou preso pelos cabelos numa arvore antes de morrer?','Num carvalho','Num terebinto (carvalho)','Numa figueira','Numa oliveira','B','reis','especialista',30,'Os cabelos de Absalao prenderam-se num grande carvalho.','2 Samuel 18:9'),
('Quem foi o comandante do exercito de Davi, filho de Zeruia?','Abner','Joabe','Benaia','Amasa','B','reis','especialista',30,'Joabe foi o comandante do exercito de Davi.','2 Samuel 8:16'),
('Qual filho de Davi tentou tomar o trono antes da morte do pai, apoiado por Joabe?','Absalao','Adonias','Salomao','Amnon','B','reis','especialista',30,'Adonias tentou se proclamar rei.','1 Reis 1:5'),
('Quantas esposas e concubinas a Biblia diz que Salomao teve?','300 e 100','700 esposas e 300 concubinas','500 e 500','1000 e 500','B','reis','especialista',30,'Salomao teve 700 esposas e 300 concubinas.','1 Reis 11:3'),
('Qual profeta rasgou a capa em doze pedacos, anunciando a divisao do reino a Jeroboao?','Semaias','Aias','Ido','Micaias','B','profetas','especialista',30,'O profeta Aias rasgou a capa em doze pedacos.','1 Reis 11:30'),
('Segundo Eclesiastes, qual e a conclusao de tudo: teme a Deus e guarda os seus...?','Caminhos','Mandamentos','Juizos','Estatutos','B','sabedoria','especialista',30,'Teme a Deus e guarda os seus mandamentos.','Eclesiastes 12:13'),
('Segundo Malaquias, quem Deus enviaria antes do grande dia do Senhor?','Moises','Elias, o profeta','Joao','Um anjo','B','profetas','especialista',30,'Deus enviaria o profeta Elias.','Malaquias 4:5'),
('Segundo Ezequiel, qual era a funcao do profeta como sentinela (atalaia)?','Julgar','Advertir o povo do perigo','Curar','Ensinar','B','profetas','especialista',30,'O atalaia deve advertir o povo do perigo.','Ezequiel 33:7'),
('Segundo Joel, o que Deus prometeu derramar sobre toda a carne?','Chuva','Seu Espirito','Bencao','Fogo','B','profetas','especialista',30,'Derramarei o meu Espirito sobre toda a carne.','Joel 2:28')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;

insert into public.quiz_questions
  (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
select v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.category, v.difficulty, v.points, v.explanation, v.bible_reference
from (values
('Jesus disse a Marta: Eu sou a ressurreicao e a...?','Luz','Vida','Paz','Verdade','B','jesus','iniciante',10,'Eu sou a ressurreicao e a vida.','Joao 11:25'),
('Jesus disse: A minha paz vos deixo, a minha paz vos...?','Guardo','Dou','Levo','Prometo','B','jesus','iniciante',10,'A minha paz vos dou.','Joao 14:27'),
('Segundo Jesus, na casa de seu Pai ha muitas...?','Portas','Moradas (mansoes)','Luzes','Salas','B','jesus','iniciante',10,'Na casa de meu Pai ha muitas moradas.','Joao 14:2'),
('Quantos demonios Jesus expulsou de Maria Madalena?','3','5','7','12','C','evangelhos','iniciante',10,'Jesus expulsou sete demonios de Maria Madalena.','Lucas 8:2'),
('Quem foi o cobrador de impostos rico que subiu numa arvore para ver Jesus?','Mateus','Zaqueu','Levi','Simao','B','evangelhos','iniciante',10,'Zaqueu subiu numa arvore para ver Jesus.','Lucas 19:3'),
('Qual apostolo tambem era chamado Didimo, que significa gemeo?','Tome','Filipe','Bartolomeu','Tadeu','A','evangelhos','iniciante',10,'Tome era chamado Didimo (gemeo).','Joao 11:16'),
('Qual era o outro nome de Mateus, o cobrador de impostos?','Levi','Natanael','Judas','Simao','A','evangelhos','iniciante',10,'Mateus tambem era chamado Levi.','Marcos 2:14'),
('Segundo Jesus, nao ha maior amor do que dar a...?','Casa','Vida pelos amigos','Riqueza','Palavra','B','jesus','iniciante',10,'Ninguem tem maior amor do que dar a vida pelos amigos.','Joao 15:13'),
('Quem era o irmao mais velho de Moises e Arao?','Nao havia','Arao','Miria era mais velha','Hur','C','exodo','iniciante',10,'Miria (Miriam) era a irma mais velha.','Exodo 2:4'),
('Quantas pedras Davi pegou do ribeiro antes de enfrentar Golias?','3','5','7','10','B','reis','iniciante',10,'Davi pegou cinco pedras lisas.','1 Samuel 17:40'),
-- profissional
('Qual jovem segurava as capas dos que apedrejaram Estevao?','Barnabe','Saulo (Paulo)','Filipe','Silas','B','atos_igreja','profissional',20,'Saulo guardava as vestes dos que apedrejaram Estevao.','Atos 7:58'),
('O que caiu dos olhos de Saulo quando Ananias orou por ele em Damasco?','Lagrimas','Algo como escamas','Sangue','Poeira','B','atos_igreja','profissional',20,'Cairam-lhe dos olhos como que escamas e ele viu.','Atos 9:18'),
('Como Paulo escapou de Damasco quando queriam mata-lo?','Correndo','Descido num cesto pelo muro','Disfarcado','Por um tunel','B','atos_igreja','profissional',20,'Desceram Paulo num cesto pela muralha.','Atos 9:25'),
('Qual jovem tinha mae Eunice e avo Loide, conhecidas pela fe?','Tito','Timoteo','Silas','Onesimo','B','cartas','profissional',20,'Timoteo tinha a fe da avo Loide e da mae Eunice.','2 Timoteo 1:5'),
('Em Listra, os pagaos chamaram Barnabe e Paulo por nomes de quais deuses?','Zeus e Hermes (Jupiter e Mercurio)','Ares e Apolo','Baal e Dagom','Diana e Zeus','A','atos_igreja','profissional',20,'Chamaram Barnabe de Jupiter e Paulo de Mercurio.','Atos 14:12'),
('Qual profeta previu, por um cinto, que Paulo seria preso em Jerusalem?','Silas','Agabo','Barnabe','Lucas','B','atos_igreja','profissional',20,'Agabo profetizou a prisao de Paulo com o cinto.','Atos 21:11'),
('Segundo Filipenses, Jesus, sendo Deus, se esvaziou tomando a forma de?','Rei','Servo','Profeta','Anjo','B','cartas','profissional',20,'Tomou a forma de servo.','Filipenses 2:7'),
('Segundo Filipenses, a todo nome se dobrara diante de Jesus o que?','A cabeca','Todo joelho','As maos','O coracao','B','cartas','profissional',20,'Ao nome de Jesus se dobre todo joelho.','Filipenses 2:10'),
('Segundo Hebreus, Jesus Cristo e o mesmo ontem, hoje e...?','Amanha','Eternamente','Sempre igual','Para todos','B','cartas','profissional',20,'Jesus Cristo e o mesmo ontem, hoje e eternamente.','Hebreus 13:8'),
('Segundo 1 Pedro, devemos lancar sobre Deus toda a nossa?','Culpa','Ansiedade (cuidado)','Alegria','Fe','B','cartas','profissional',20,'Lancando sobre ele toda a vossa ansiedade.','1 Pedro 5:7'),
-- especialista
('Quem foi o mago que quis comprar o dom do Espirito Santo com dinheiro?','Elimas','Simao','Barjesus','Demetrio','B','atos_igreja','especialista',30,'Simao, o mago, quis comprar o dom.','Atos 8:18'),
('Qual mulher recobrou a vida quando Pedro disse Tabita, levanta-te?','Dorcas (Tabita)','Safira','Rode','Lidia','A','atos_igreja','especialista',30,'Tabita, tambem chamada Dorcas, ressuscitou.','Atos 9:40'),
('Qual serva anunciou que Pedro estava a porta, mas ninguem acreditou?','Rode','Lidia','Priscila','Damaris','A','atos_igreja','especialista',30,'A serva Rode anunciou que Pedro estava a porta.','Atos 12:14'),
('Segundo Colossenses, Cristo e a imagem do Deus invisivel, o primogenito de toda a?','Igreja','Criacao','Terra','Promessa','B','cartas','especialista',30,'Primogenito de toda a criacao.','Colossenses 1:15'),
('Segundo Tiago, quem tem falta de sabedoria deve pedir a quem?','Aos anciaos','A Deus','Aos mestres','Aos profetas','B','cartas','especialista',30,'Peca a Deus, que a todos da liberalmente.','Tiago 1:5'),
('Segundo 1 Joao, se confessarmos os nossos pecados, Deus e fiel e justo para nos?','Ouvir','Perdoar','Abencoar','Guardar','B','cartas','especialista',30,'Ele e fiel e justo para nos perdoar.','1 Joao 1:9'),
('Qual caçador valente e citado em Genesis como poderoso diante do Senhor?','Esau','Ninrode (Nimrod)','Lameque','Tubalcaim','B','criacao','especialista',30,'Ninrode foi poderoso cacador diante do Senhor.','Genesis 10:9'),
('Quais eram os tres filhos de Noe?','Sem, Cam e Jafé','Caim, Abel e Sete','Abraao, Naor e Harã','Isaque, Ismael e Midia','A','criacao','especialista',30,'Os filhos de Noe foram Sem, Cam e Jafe.','Genesis 6:10'),
('Em que terra vivia Jó, homem integro e reto?','Uz','Ur','Ma','Node','A','sabedoria','especialista',30,'Jo vivia na terra de Uz.','Jó 1:1'),
('Quem pediu permissao a Deus para provar Jó, tirando-lhe os bens e a saude?','Um anjo','Satanas','Um profeta','Os amigos','B','sabedoria','especialista',30,'Satanas pediu permissao para provar Jo.','Jó 1:12')
) as v(question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, points, explanation, bible_reference)
where not exists (
  select 1 from public.quiz_questions q where q.question = v.question
);
select count(*) as total_agora from public.quiz_questions;
