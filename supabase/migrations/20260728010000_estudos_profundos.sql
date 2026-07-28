-- ============================================================
-- ESTUDOS BÍBLICOS: 7 temas mais profundos e debatidos
-- ============================================================
-- Temas delicados/denominacionais (dízimo, Lei de Moisés, dons,
-- batismo...) apresentados de forma EQUILIBRADA: as diferentes
-- posições cristãs, cada uma com seus versículos, sem impor "a
-- certa". Tom pastoral. Mesmo padrão dos estudos existentes:
-- versículos-base clicáveis + conteúdo + Aplicação em passos
-- numerados (viram checklist no leitor). Idempotente por título.
-- ============================================================

-- 1) DÍZIMOS -------------------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$Dízimos: Lei, Graça e Generosidade$t$,
  $t$Equipe Aliança$t$,
  $t$O que a Bíblia ensina sobre o dízimo — da Lei de Moisés às diferentes posições cristãs de hoje. Um estudo equilibrado para você formar sua convicção.$t$,
  'Finanças', 'text', '9 min',
  $c$O dízimo — a décima parte — aparece na Bíblia muito antes da Lei. Abraão entregou o dízimo de tudo a Melquisedeque (Gênesis 14), e Jacó prometeu devolver a Deus a décima parte (Gênesis 28). Depois, na LEI DE MOISÉS, o dízimo virou mandamento para sustentar os levitas, o templo e os pobres.

Em Malaquias, Deus repreende o povo por "roubar" nos dízimos e ofertas, e faz uma promessa: "Trazei todos os dízimos à casa do tesouro... e vede se não vos abrirei as janelas do céu" (Malaquias 3:10). Muitos cristãos leem aqui um princípio permanente de honrar a Deus com o primeiro e o melhor.

Aqui começa o debate entre irmãos sinceros. Há duas grandes posições, ambas amando as Escrituras.

A PRIMEIRA POSIÇÃO entende o dízimo como mandamento ainda válido. Jesus disse aos fariseus que davam o dízimo até das ervas: "Isto importava fazer, e não omitir aquilo" (Mateus 23:23) — ou seja, sem abandonar o dízimo. Para esses irmãos, devolver 10% é o ponto de partida da fidelidade, e a promessa de bênção continua de pé.

A SEGUNDA POSIÇÃO entende que, depois da cruz, o Novo Testamento nunca repete o dízimo como lei para a Igreja. No lugar de um percentual obrigatório, Paulo ensina a GENEROSIDADE DO CORAÇÃO: "Cada um contribua segundo propôs no seu coração; não com tristeza ou por necessidade; porque Deus ama ao que dá com alegria" (2 Coríntios 9:7). Aqui o dízimo vira referência de generosidade, não regra — e muitos são chamados a dar até além dos 10%.

As duas posições concordam no essencial: tudo é de Deus, o coração generoso Lhe agrada, e quem semeia com fartura, com fartura também colherá (2 Coríntios 9:6). A pergunta não é "de quanto eu me livro", mas "como honro a Deus e sirvo ao Seu Reino".

Seja qual for a sua convicção, que ela nasça da Palavra, da oração e de um coração livre — nunca de culpa ou pressão. Deus não precisa do seu dinheiro; Ele quer o seu coração — e o dinheiro costuma ir aonde o coração está.$c$,
  ARRAY[$v$Levítico 27:30-33$v$, $v$Malaquias 3:8-10$v$, $v$Mateus 23:23$v$, $v$2 Coríntios 9:6-7$v$, $v$Gálatas 6:6-9$v$, $v$Provérbios 3:9-10$v$]::text[],
  $a$1. Ore e defina, diante de Deus, quanto e como você vai contribuir — por convicção, não por pressão.
2. Separe o valor assim que receber, antes de gastar o resto (honre a Deus com as primícias — Provérbios 3:9).
3. Dê com alegria: se está sendo por tristeza ou obrigação, pare e reveja o coração antes do valor.
4. Estude você mesmo os textos das duas posições e forme a sua convicção pessoal.
5. Além do dinheiro, ofereça tempo e dons — generosidade é um estilo de vida, não só um depósito.$a$,
  ARRAY[$r$O que o seu jeito de lidar com o dinheiro revela sobre o seu coração?$r$, $r$Você dá por alegria, por hábito ou por culpa?$r$, $r$Como seria confiar mais em Deus na sua vida financeira esta semana?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$Dízimos: Lei, Graça e Generosidade$t$);

-- 2) A LEI DE MOISÉS -----------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$A Lei de Moisés e o Cristão Hoje$t$,
  $t$Equipe Aliança$t$,
  $t$Jesus veio abolir ou cumprir a Lei? O que ainda vale e o que foi cumprido em Cristo — as posições cristãs lado a lado, com respeito.$t$,
  'Sabedoria', 'text', '10 min',
  $c$"Não penseis que vim destruir a lei ou os profetas; não vim destruir, mas CUMPRIR" (Mateus 5:17). Essa frase de Jesus está no centro de um dos temas mais debatidos entre cristãos: o que fazer com a Lei de Moisés hoje?

Ao longo da história, muitos organizaram a Lei em três aspectos (uma divisão útil, ainda que a Bíblia não use esses rótulos): a lei MORAL (como os Dez Mandamentos), a lei CERIMONIAL (sacrifícios, festas, o templo) e a lei CIVIL (as regras de Israel como nação).

Sobre a lei cerimonial há grande consenso: ela apontava para Cristo e foi cumprida n'Ele. "Tudo isso é sombra das coisas futuras, mas o corpo é de Cristo" (Colossenses 2:17). Por isso a Igreja não oferece mais sacrifícios de animais — o Cordeiro já veio.

Sobre a lei moral também há amplo acordo de que ela reflete o caráter eterno de Deus. Mas surge o debate: ela obriga o cristão como código, ou seu conteúdo é reafirmado por amor no Novo Testamento? Paulo resume: "o amor é o cumprimento da lei" (Romanos 13:10), e "CRISTO É O FIM DA LEI para justiça de todo aquele que crê" (Romanos 10:4).

Daí as diferentes ênfases entre irmãos. Alguns enfatizam a continuidade: a lei moral permanece como guia de santidade para quem já é salvo pela graça. Outros enfatizam a descontinuidade: a Lei foi nosso "aio" até Cristo, e agora andamos pelo Espírito, não debaixo da Lei (Gálatas 3:24-25). Nenhum dos dois defende viver sem santidade — o debate é sobre COMO a santidade se sustenta.

O que une a todos é isto: ninguém é salvo por guardar a Lei, e sim pela graça em Cristo; e ninguém que ama a Cristo despreza a vontade de Deus. A Lei nos mostra o pecado e nos leva à cruz; a graça nos transforma para amar o que Deus ama.$c$,
  ARRAY[$v$Mateus 5:17-19$v$, $v$Romanos 10:4$v$, $v$Gálatas 3:23-25$v$, $v$Romanos 13:8-10$v$, $v$Hebreus 8:10-13$v$, $v$Colossenses 2:16-17$v$]::text[],
  $a$1. Leia Mateus 5:17-20 devagar e anote o que Jesus afirma sobre a Lei.
2. Diante de cada mandamento, pergunte: como o amor a Deus e ao próximo cumpre isto hoje?
3. Reconheça que a sua salvação não vem do seu desempenho, mas da graça — descanse nisso.
4. Peça ao Espírito Santo que escreva a vontade de Deus no seu coração (Hebreus 8:10).
5. Antes de julgar quem pensa diferente sobre a Lei, ouça os textos que o irmão usa.$a$,
  ARRAY[$r$Você tenta agradar a Deus por medo e obrigação, ou por amor e gratidão?$r$, $r$O que significa, na prática, "o amor cumpre a lei"?$r$, $r$Onde você tem confundido regras com relacionamento com Deus?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$A Lei de Moisés e o Cristão Hoje$t$);

-- 3) MORTE E RESSURREIÇÃO ------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$A Morte e a Esperança da Ressurreição$t$,
  $t$Equipe Aliança$t$,
  $t$O que a Bíblia ensina sobre a morte, o que há depois, e por que a ressurreição de Cristo muda tudo para quem crê.$t$,
  'Esperança', 'text', '9 min',
  $c$A morte é o assunto que todos evitam e ninguém escapa. A Bíblia não a esconde — encara de frente. Em Eclesiastes, o Pregador lembra que "o pó volta à terra, como o era, e o espírito volta a Deus, que o deu" (Eclesiastes 12:7). A morte é real, mas não é o fim da história.

Para quem está em Cristo, Paulo escreve algo surpreendente, e de dentro de uma prisão: "PARA MIM O VIVER É CRISTO, E O MORRER É LUCRO" (Filipenses 1:21). Ele descreve a morte do crente como "partir e estar com Cristo, o que é incomparavelmente melhor". Para o cristão, a morte é uma passagem para a presença do Senhor.

O coração da esperança cristã é a RESSURREIÇÃO. Jesus disse a Marta: "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá" (João 11:25). E provou isso saindo do próprio túmulo. Por isso Paulo chama Cristo de "as primícias dos que dormem" (1 Coríntios 15:20) — o primeiro de muitos que ressuscitarão.

Isso muda o luto. Paulo não diz "não chorem", mas "não vos entristeçais como os que não têm esperança" (1 Tessalonicenses 4:13). A dor da perda é real e o choro é legítimo — mas é uma tristeza atravessada pela esperança do reencontro.

E há uma promessa final: um dia "Deus limpará dos seus olhos toda lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor" (Apocalipse 21:4). A morte, o último inimigo, será destruída (1 Coríntios 15:26). A palavra final não é o túmulo — é a vida.

Enquanto esse dia não chega, vivemos com os pés no chão e os olhos no céu: valorizando cada dia como dom de Deus, e ao mesmo tempo sem medo do que vem depois, porque Aquele que venceu a morte caminha conosco.$c$,
  ARRAY[$v$Eclesiastes 12:7$v$, $v$1 Coríntios 15:20-26$v$, $v$Filipenses 1:21-23$v$, $v$João 11:25-26$v$, $v$1 Tessalonicenses 4:13-14$v$, $v$Apocalipse 21:4$v$]::text[],
  $a$1. Escreva uma verdade da Palavra sobre a ressurreição para lembrar nos dias difíceis.
2. Se você está de luto, leve a sua dor a Deus com sinceridade — Ele acolhe o choro com esperança.
3. Console alguém que perdeu um ente querido, apontando com delicadeza para a esperança em Cristo.
4. Examine: se você partisse hoje, está em paz com Deus por meio de Jesus? Se não, resolva isso agora.
5. Viva cada dia como presente: agradeça, ame quem está por perto e não deixe o importante para depois.$a$,
  ARRAY[$r$O que a sua reação diante da morte revela sobre a sua esperança?$r$, $r$Como a ressurreição de Jesus muda o seu medo do futuro?$r$, $r$O que você faria diferente levando a sério que a vida aqui é passageira?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$A Morte e a Esperança da Ressurreição$t$);

-- 4) SOFRIMENTO ----------------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$Sofrimento e o Propósito de Deus$t$,
  $t$Equipe Aliança$t$,
  $t$Por que um Deus bom permite a dor? O que a Bíblia diz — sem respostas fáceis, mas com esperança verdadeira.$t$,
  'Fé', 'text', '9 min',
  $c$Se Deus é bom e poderoso, por que existe tanto sofrimento? Essa pergunta já tirou o sono de gente que ama a Deus. A Bíblia não oferece uma fórmula que apague a dor — mas oferece um Deus que entra nela conosco.

Jesus foi honesto: "No mundo tereis aflições" (João 16:33). Ele não prometeu uma vida sem tempestade; prometeu estar no barco. E na mesma frase acrescenta: "mas tende bom ânimo, EU VENCI O MUNDO". A dor é real, e a vitória também.

A Palavra dá alguns fios de luz. Um deles é que Deus PODE TRANSFORMAR O MAL EM BEM: "todas as coisas contribuem juntamente para o bem daqueles que amam a Deus" (Romanos 8:28) — não que tudo seja bom, mas que nada é desperdiçado nas mãos d'Ele. Outro é que a provação amadurece a fé: "a provação da vossa fé produz a paciência" (Tiago 1:3).

Paulo viveu isso na pele. Pediu três vezes que Deus tirasse o seu "espinho na carne", e ouviu: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza" (2 Coríntios 12:9). Às vezes Deus tira o sofrimento; às vezes Ele nos sustenta dentro dele com uma graça que só se conhece ali.

E há um consolo que não depende de entender tudo: "PERTO ESTÁ O SENHOR DOS QUE TÊM O CORAÇÃO QUEBRANTADO" (Salmos 34:18). Deus não é distante da sua dor. Em Jesus, Ele mesmo chorou, sangrou e morreu. Você não sofre sozinho.

Paulo pesa tudo numa balança de eternidade: "as aflições deste tempo presente não são para comparar com a glória que em nós há de ser revelada" (Romanos 8:18). A dor é real, mas tem prazo. A glória é maior — e é para sempre.$c$,
  ARRAY[$v$Romanos 8:18$v$, $v$Romanos 8:28$v$, $v$Tiago 1:2-4$v$, $v$2 Coríntios 12:9-10$v$, $v$João 16:33$v$, $v$Salmos 34:18$v$]::text[],
  $a$1. Leve a Deus a sua dor sem maquiar — Ele aguenta a sua sinceridade (veja os Salmos).
2. Troque a pergunta "por quê?" por "para quê, Senhor?" e peça que nada se perca.
3. Procure um irmão de confiança para orar com você; ninguém foi feito para sofrer sozinho.
4. Escreva uma promessa de Deus e leia em voz alta nos momentos mais difíceis.
5. Ao sair de um vale, use a sua história para consolar quem ainda está nele (2 Coríntios 1:4).$a$,
  ARRAY[$r$Onde você tem sentido que Deus está distante — e o que a Palavra diz sobre isso?$r$, $r$Como as suas dores passadas já foram usadas para o bem?$r$, $r$O que muda quando você lembra que a dor tem prazo e a glória é eterna?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$Sofrimento e o Propósito de Deus$t$);

-- 5) BATISMO -------------------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$Batismo: Sentido e Formas$t$,
  $t$Equipe Aliança$t$,
  $t$O que o batismo significa, por que Jesus mandou batizar, e as diferentes práticas entre igrejas cristãs — com respeito à família de Deus.$t$,
  'Discipulado', 'text', '9 min',
  $c$Antes de subir ao céu, Jesus deixou uma ordem clara: "Ide, fazei discípulos de todas as nações, BATIZANDO-OS em nome do Pai, e do Filho, e do Espírito Santo" (Mateus 28:19). O batismo não é um detalhe — é parte do chamado da Igreja.

O que ele significa? Paulo explica que o batismo retrata a nossa união com Cristo: "fomos sepultados com ele pelo batismo na morte, para que... andemos em novidade de vida" (Romanos 6:4). Descer às águas fala de MORRER PARA O VELHO; sair delas fala de RESSUSCITAR PARA UMA VIDA NOVA. É um testemunho público de uma fé real.

Entre igrejas que amam a Bíblia, há diferenças sinceras na prática. Sobre o MODO, algumas tradições batizam por imersão (mergulhando a pessoa), vendo nisso o retrato mais claro do sepultamento e da ressurreição; outras aceitam a aspersão ou efusão (derramando água), enfatizando o símbolo da purificação.

Sobre QUEM batizar, há duas grandes posições. Uma pratica o batismo de quem já professa a fé, entendendo que no Novo Testamento o batismo segue a fé — "os que de bom grado receberam a palavra foram batizados" (Atos 2:41). A outra pratica também o batismo de filhos de famílias cristãs, entendendo-o como sinal da aliança, num lugar parecido com o da circuncisão (Colossenses 2:11-12).

O que todos afirmam é que a água não salva por si — quem salva é Cristo, recebido pela fé. O batismo é a resposta obediente e pública a essa salvação, não o preço dela. Por isso o ladrão na cruz, sem tempo de ser batizado, ouviu de Jesus: "hoje estarás comigo no paraíso" (Lucas 23:43).

Se você crê e ainda não foi batizado, converse com os seus líderes: é um passo lindo de obediência e alegria. E ao ver como outras igrejas praticam, faça-o com respeito — a família de Deus é maior do que a nossa tradição.$c$,
  ARRAY[$v$Mateus 28:19-20$v$, $v$Romanos 6:3-4$v$, $v$Atos 2:38-41$v$, $v$Colossenses 2:11-12$v$, $v$Atos 8:36-38$v$, $v$Lucas 23:42-43$v$]::text[],
  $a$1. Se você já creu mas nunca foi batizado, procure a liderança da sua igreja para dar esse passo.
2. Leia Romanos 6:1-4 e escreva o que morreu e o que nasceu na sua vida ao seguir Jesus.
3. Relembre (ou registre) o dia da sua decisão por Cristo e agradeça a Deus por ela.
4. Entenda a prática da sua igreja e também por que outras igrejas praticam de forma diferente.
5. Viva o significado do batismo todo dia: deixe o velho no túmulo e ande em novidade de vida.$a$,
  ARRAY[$r$A sua vida tem mostrado publicamente aquilo que você crê no coração?$r$, $r$O que ainda pertence ao "velho homem" e precisa ficar no túmulo?$r$, $r$Como você pode honrar irmãos que praticam o batismo de forma diferente da sua?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$Batismo: Sentido e Formas$t$);

-- 6) DONS ESPIRITUAIS ----------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$Dons Espirituais para os Dias de Hoje$t$,
  $t$Equipe Aliança$t$,
  $t$O que são os dons do Espírito, para que servem, e o debate cristão sobre a sua continuidade hoje — com amor no centro.$t$,
  'Espírito Santo', 'text', '10 min',
  $c$O Espírito Santo não veio de mãos vazias: Ele distribui DONS à Sua Igreja. "A cada um, porém, é dada a manifestação do Espírito para o que for útil" (1 Coríntios 12:7). Os dons não são troféus — são ferramentas para servir e edificar o corpo de Cristo.

A Bíblia lista muitos: ensino, serviço, exortação, generosidade, liderança, misericórdia (Romanos 12), além de palavra de sabedoria, cura, profecia, discernimento, línguas e a sua interpretação (1 Coríntios 12). São variados por propósito: "há diversidade de dons, mas o Espírito é o mesmo" (1 Coríntios 12:4).

Aqui há um debate antigo e sincero entre cristãos. Uma posição, às vezes chamada de CESSACIONISTA, entende que certos dons mais "sinalizadores" (como línguas, profecia e curas milagrosas) serviram para confirmar os apóstolos e a revelação, e cessaram quando a Igreja e as Escrituras se firmaram. Costumam apontar para 1 Coríntios 13:8-10 e para o papel único dos apóstolos.

A outra posição, chamada de CONTINUÍSTA, entende que todos os dons continuam disponíveis hoje, pois a Bíblia não marca uma data para o fim deles, e Paulo diz "não proibais o falar em línguas" e "procurai com zelo o profetizar" (1 Coríntios 14:39). Para esses irmãos, o mesmo Espírito de Atos continua agindo.

Apesar da divergência, o Novo Testamento dá dois trilhos que valem para todos. O primeiro é o AMOR: sem ele, o dom mais espetacular "nada é" (1 Coríntios 13:1-2). O segundo é a ORDEM: "faça-se tudo decentemente e com ordem" (1 Coríntios 14:40) — dons servem para edificar, nunca para exibir.

Seja qual for a sua convicção, o convite é o mesmo: descubra como Deus o capacitou, coloque isso a serviço dos outros, e busque acima de tudo o amor. O alvo final dos dons é a Igreja madura e Cristo glorificado (Efésios 4:12-13).$c$,
  ARRAY[$v$1 Coríntios 12:4-11$v$, $v$Romanos 12:6-8$v$, $v$1 Coríntios 13:8-13$v$, $v$Efésios 4:11-13$v$, $v$1 Coríntios 14:1$v$, $v$1 Coríntios 14:39-40$v$]::text[],
  $a$1. Peça a Deus, com sinceridade, que revele como Ele o capacitou para servir.
2. Comece a servir onde há necessidade na sua igreja — os dons se revelam servindo.
3. Estude 1 Coríntios 12 a 14 inteiro, para entender dons no contexto do amor e da ordem.
4. Ouça as duas posições sobre a continuidade dos dons com humildade, sem desprezar irmãos.
5. Meça todo dom por um critério: isto edificou o corpo e glorificou a Cristo?$a$,
  ARRAY[$r$Você conhece e usa o(s) dom(ns) que Deus lhe deu, ou eles estão parados?$r$, $r$Os seus dons têm servido aos outros ou a você mesmo?$r$, $r$Como manter o amor no centro, mesmo discordando de irmãos sobre os dons?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$Dons Espirituais para os Dias de Hoje$t$);

-- 7) ARREPENDIMENTO ------------------------------------------------------
INSERT INTO public.bible_studies (title, author, description, category, type, duration, content, verses, application, reflection_questions)
SELECT
  $t$Arrependimento Verdadeiro x Remorso$t$,
  $t$Equipe Aliança$t$,
  $t$A diferença entre a tristeza que transforma e o remorso que só condena — e como voltar para Deus de verdade.$t$,
  'Santidade', 'text', '8 min',
  $c$Nem toda lágrima por causa do pecado é arrependimento. A Bíblia distingue duas tristezas: "a tristeza segundo Deus opera arrependimento para a salvação... mas a TRISTEZA DO MUNDO opera a morte" (2 Coríntios 7:10). Uma transforma; a outra só afunda.

O REMORSO olha para dentro e para trás: sente-se péssimo, tem medo das consequências, se autopune — mas continua girando em torno de si mesmo. Judas sentiu remorso, devolveu o dinheiro e se desesperou. O remorso pode ser intenso e, ainda assim, não levar a Deus.

O ARREPENDIMENTO GENUÍNO olha para cima e para frente: reconhece o pecado diante de Deus, se entristece por tê-Lo ofendido, e muda de direção. A palavra, no Novo Testamento, significa literalmente "mudar a mente" — e resulta em mudar de caminho. "Arrependei-vos e convertei-vos, para que sejam apagados os vossos pecados" (Atos 3:19).

O melhor retrato é o filho pródigo. Ele, "caindo em si", não ficou se lamentando no chiqueiro — LEVANTOU-SE E VOLTOU para o pai (Lucas 15:18-20). Arrependimento tem pés: sai do lugar do erro e caminha de volta para casa. E o pai o viu de longe, correu e o abraçou — é assim que Deus recebe quem volta.

O caminho é simples e libertador: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar" (1 João 1:9). Esconder adoece; confessar cura: "o que encobre as suas transgressões nunca prosperará; mas o que as confessa e deixa alcançará misericórdia" (Provérbios 28:13). Repare: confessar E deixar.

Se você tem carregado culpa, entenda: Deus não quer te esmagar com remorso — quer te restaurar pelo arrependimento. A tristeza que vem d'Ele não termina em condenação; termina em abraço.$c$,
  ARRAY[$v$2 Coríntios 7:9-10$v$, $v$Atos 3:19$v$, $v$Salmos 51:1-4$v$, $v$Lucas 15:17-20$v$, $v$Provérbios 28:13$v$, $v$1 João 1:9$v$]::text[],
  $a$1. Peça a Deus que mostre se há algo entre você e Ele — e não fuja do que Ele apontar.
2. Confesse de forma específica, sem rodeios (como no Salmo 51), e receba o perdão de 1 João 1:9.
3. Confesse E deixe: dê um passo concreto para sair da situação de pecado, não só se lamentar.
4. Se você tem só remorso (culpa girando em você), leve isso à cruz e troque por arrependimento.
5. Se pecou contra alguém, busque reparar e reconciliar no que estiver ao seu alcance.$a$,
  ARRAY[$r$Você tem sentido remorso que gira em você, ou arrependimento que te leva a Deus?$r$, $r$Há algo que você confessa, mas ainda não "deixou"?$r$, $r$O que muda ao saber que Deus recebe quem volta com um abraço, não com um tapa?$r$]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.bible_studies WHERE title = $t$Arrependimento Verdadeiro x Remorso$t$);

SELECT 'ok' AS status, count(*) AS total_estudos FROM public.bible_studies;
