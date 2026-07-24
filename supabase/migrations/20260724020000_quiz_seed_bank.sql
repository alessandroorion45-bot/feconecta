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
