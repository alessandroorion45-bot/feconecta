/**
 * Banco de temas do Palavra Viva — estrutura extensível.
 * Cada tema tem palavras curadas de verdade (não extraídas aleatoriamente),
 * um versículo-âncora e, quando aplicável, um personagem central (usado na
 * trilha espiritual). Adicionar um tema novo é só adicionar um objeto aqui.
 *
 * Cada tema traz uma faixa ampla de tamanhos de palavra (3 a 15 letras) para
 * que qualquer nível — do mais curto ao mais avançado — tenha bastante
 * variedade dentro do próprio tema, sem depender do banco genérico de fallback.
 */

export interface WordSearchTheme {
  key: string;
  label: string;
  icon: string;
  category: 'antigo' | 'novo' | 'virtude';
  character?: string;
  verseRef: string;
  verseText: string;
  words: string[];
}

export const WORD_SEARCH_THEMES: WordSearchTheme[] = [
  {
    key: 'criacao', label: 'Criação', icon: '🌍', category: 'antigo',
    verseRef: 'Gênesis 1:1', verseText: 'No princípio criou Deus os céus e a terra.',
    words: ['LUZ', 'CEU', 'DIA', 'MAR', 'AVE', 'TERRA', 'AGUA', 'BOM', 'NOITE', 'PEIXE', 'FRUTO', 'JARDIM', 'HOMEM', 'EDEN', 'MULHER', 'IMAGEM', 'CRIADOR', 'ARVORE', 'ANIMAL', 'SEMENTE', 'DESCANSO', 'ESTRELAS', 'REPOUSO', 'FIRMAMENTO', 'SEMELHANCA'],
  },
  {
    key: 'noe', label: 'Noé', icon: '🌊', category: 'antigo', character: 'Noé',
    verseRef: 'Gênesis 6:9', verseText: 'Noé era homem justo e perfeito em suas gerações; Noé andava com Deus.',
    words: ['ARCA', 'SEM', 'CAM', 'JAFE', 'CHUVA', 'RAMO', 'JUSTO', 'POMBA', 'MADEIRA', 'DILUVIO', 'FAMILIA', 'ANIMAIS', 'ALIANCA', 'PROMESSA', 'OLIVEIRA', 'ARCOIRIS', 'SALVACAO', 'OBEDIENCIA', 'INUNDACAO', 'PRESERVACAO'],
  },
  {
    key: 'abraao', label: 'Abraão', icon: '⭐', category: 'antigo', character: 'Abraão',
    verseRef: 'Gênesis 12:2', verseText: 'Farei de ti uma grande nação, e te abençoarei.',
    words: ['FE', 'UR', 'SARA', 'ALTAR', 'ISAQUE', 'CANAA', 'NACAO', 'BENCAO', 'TENDA', 'FILHO', 'AGAR', 'ISMAEL', 'PROMESSA', 'ESTRELAS', 'PEREGRINO', 'HERDEIRO', 'OBEDIENCIA', 'DESCENDENCIA', 'PATRIARCA', 'HOSPITALIDADE'],
  },
  {
    key: 'jose', label: 'José do Egito', icon: '🌾', category: 'antigo', character: 'José',
    verseRef: 'Gênesis 50:20', verseText: 'Vós intentastes o mal contra mim, porém Deus o tornou em bem.',
    words: ['SONHO', 'FOME', 'EGITO', 'FARAO', 'IRMAOS', 'TUNICA', 'PERDAO', 'PRISAO', 'CELEIRO', 'REENCONTRO', 'GOVERNADOR', 'INTERPRETE', 'RECONCILIACAO', 'PROVIDENCIA', 'BENJAMIM', 'POCO', 'ESCRAVO', 'COPEIRO', 'PADEIRO', 'ABUNDANCIA'],
  },
  {
    key: 'moises', label: 'Moisés', icon: '🔥', category: 'antigo', character: 'Moisés',
    verseRef: 'Êxodo 3:14', verseText: 'Disse Deus a Moisés: EU SOU O QUE SOU.',
    words: ['VARA', 'MANA', 'SARCA', 'MONTE', 'NUVEM', 'MAR', 'FARAO', 'TABUAS', 'DESERTO', 'CESTO', 'PRINCESA', 'LIBERTADOR', 'MANDAMENTOS', 'LEGISLADOR', 'INTERCESSOR', 'SINAI', 'BASTAO', 'PROFETA', 'HUMILDADE', 'REVELACAO'],
  },
  {
    key: 'exodo', label: 'Êxodo e Libertação', icon: '🐑', category: 'antigo',
    verseRef: 'Êxodo 14:14', verseText: 'O Senhor pelejará por vós, e vós vos calareis.',
    words: ['PASCOA', 'SANGUE', 'PRAGAS', 'FARAO', 'SAIDA', 'VERMELHO', 'CORDEIRO', 'ESCRAVIDAO', 'LIBERTACAO', 'PERSEGUICAO', 'MURALHA', 'COLUNA', 'GAFANHOTO', 'PRIMOGENITO', 'REDENCAO', 'PODER', 'VITORIA', 'CANTICO', 'TRAVESSIA', 'MILAGRE'],
  },
  {
    key: 'deserto', label: 'Deserto', icon: '🏜️', category: 'antigo',
    verseRef: 'Deuteronômio 8:2', verseText: 'Lembra-te de todo o caminho pelo qual o Senhor teu Deus te guiou no deserto.',
    words: ['MANA', 'FOGO', 'ROCHA', 'TENDA', 'AGUA', 'NUVEM', 'JORNADA', 'CAMINHO', 'CODORNIZ', 'PROVACAO', 'MURMURACAO', 'TABERNACULO', 'PEREGRINACAO', 'PACIENCIA', 'CONFIANCA', 'PROVISAO', 'GUIA', 'FIDELIDADE', 'ARREPENDIMENTO', 'DEPENDENCIA'],
  },
  {
    key: 'josue', label: 'Josué e Conquista', icon: '🏰', category: 'antigo', character: 'Josué',
    verseRef: 'Josué 1:9', verseText: 'Sê forte e corajoso; não temas, nem te espantes.',
    words: ['FORTE', 'JERICO', 'ESPIAS', 'CANAA', 'ALIANCA', 'VITORIA', 'CORAGEM', 'MURALHA', 'TROMBETA', 'CONQUISTA', 'PROMESSA', 'HERANCA', 'RAAB', 'SOL', 'BATALHA', 'OBEDIENCIA', 'LIDERANCA', 'SUCESSOR', 'TERRAPROMETIDA', 'FIDELIDADE'],
  },
  {
    key: 'juizes', label: 'Juízes de Israel', icon: '⚔️', category: 'antigo', character: 'Sansão',
    verseRef: 'Juízes 21:25', verseText: 'Cada um fazia o que parecia bem aos seus próprios olhos.',
    words: ['JUIZ', 'FORCA', 'GEDEAO', 'DEBORA', 'SANSAO', 'BARAQUE', 'ISRAEL', 'CABELO', 'INIMIGO', 'VITORIA', 'LIBERTADOR', 'CICLO', 'IDOLATRIA', 'ARREPENDIMENTO', 'RESGATE', 'JUNTA', 'FILISTEUS', 'CORAGEM', 'ESPADA', 'CLAMOR'],
  },
  {
    key: 'rute', label: 'Rute e Fidelidade', icon: '🌾', category: 'antigo', character: 'Rute',
    verseRef: 'Rute 1:16', verseText: 'Aonde quer que fores irei, e onde quer que pousares pousarei.',
    words: ['RUTE', 'BOAZ', 'AMOR', 'CAMPO', 'NOEMI', 'ESPIGA', 'COLHEITA', 'REDENTOR', 'LEALDADE', 'FAMILIA', 'FIDELIDADE', 'CUNHADA', 'MOABE', 'BELEM', 'CEVADA', 'CASAMENTO', 'BONDADE', 'DEDICACAO', 'PROVIDENCIA', 'LINHAGEM'],
  },
  {
    key: 'samuel', label: 'Samuel e os Reis', icon: '📯', category: 'antigo', character: 'Samuel',
    verseRef: '1 Samuel 3:10', verseText: 'Fala, Senhor, porque o teu servo ouve.',
    words: ['ANA', 'REI', 'SAUL', 'VOTO', 'TEMPLO', 'UNCAO', 'CHAMADO', 'PROFETA', 'ORACAO', 'SAMUEL', 'JUIZ', 'SACERDOTE', 'OBEDIENCIA', 'CONSAGRACAO', 'MINISTERIO', 'DISCERNIMENTO', 'ARCA', 'ELI', 'PEDIDO', 'MONARQUIA'],
  },
  {
    key: 'davi', label: 'Davi e o Reino', icon: '👑', category: 'antigo', character: 'Davi',
    verseRef: '1 Samuel 17:45', verseText: 'Tu vens a mim com espada, mas eu venho a ti em nome do Senhor dos Exércitos.',
    words: ['REI', 'HARPA', 'DAVI', 'PASTOR', 'GOLIAS', 'FUNDA', 'SALMO', 'UNGIDO', 'CORAGEM', 'JERUSALEM', 'GIGANTE', 'PEDRAS', 'BATALHA', 'ADORACAO', 'ARREPENDIMENTO', 'ALIANCA', 'TRONO', 'CONFIANCA', 'LOUVOR', 'PASTOREIO'],
  },
  {
    key: 'salomao', label: 'Salomão e Sabedoria', icon: '🏛️', category: 'antigo', character: 'Salomão',
    verseRef: '1 Reis 3:9', verseText: 'Dá, pois, ao teu servo um coração entendido.',
    words: ['PAZ', 'REI', 'TEMPLO', 'RIQUEZA', 'JUIZO', 'REINO', 'GLORIA', 'SABEDORIA', 'SALOMAO', 'PROVERBIOS', 'CONSTRUCAO', 'DISCERNIMENTO', 'PROSPERIDADE', 'RAINHASABA', 'CANTARES', 'SABIO', 'ENTENDIMENTO', 'ADORACAO', 'HERANCA', 'ESPLENDOR'],
  },
  {
    key: 'profetas', label: 'Profetas de Israel', icon: '📜', category: 'antigo',
    verseRef: 'Amós 3:7', verseText: 'O Senhor Deus não faz coisa alguma sem revelar o seu segredo aos profetas.',
    words: ['VOZ', 'VISAO', 'PROFETA', 'MENSAGEM', 'JULGAMENTO', 'ESPERANCA', 'PALAVRA', 'REVELACAO', 'CHAMADO', 'ARREPENDIMENTO', 'ADVERTENCIA', 'JUSTICA', 'CLAMOR', 'DENUNCIA', 'CONSOLO', 'RESTAURACAO', 'VIGIA', 'ORACULO', 'INSPIRACAO', 'ANUNCIO'],
  },
  {
    key: 'isaias', label: 'Isaías Profeta', icon: '🕊️', category: 'antigo', character: 'Isaías',
    verseRef: 'Isaías 9:6', verseText: 'Um menino nos nasceu, um filho se nos deu, Príncipe da Paz.',
    words: ['LUZ', 'SANTO', 'GLORIA', 'CONSOLO', 'ISAIAS', 'MESSIAS', 'PROFECIA', 'SALVACAO', 'REDENCAO', 'ESPERANCA', 'SERVOSOFREDOR', 'EMANUEL', 'PRINCIPEDAPAZ', 'VISAO', 'PUREZA', 'CHAMADO', 'RESTAURACAO', 'CONSAGRACAO', 'PROMESSA', 'ANUNCIO'],
  },
  {
    key: 'jeremias', label: 'Jeremias', icon: '📖', category: 'antigo', character: 'Jeremias',
    verseRef: 'Jeremias 29:11', verseText: 'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor.',
    words: ['CHORO', 'PLANOS', 'ALIANCA', 'PROMESSA', 'JEREMIAS', 'ESPERANCA', 'CORACAO', 'FIDELIDADE', 'LAMENTACAO', 'RESTAURACAO', 'PROFETA', 'CATIVEIRO', 'BABILONIA', 'OLEIRO', 'BARRO', 'PERSEVERANCA', 'SOFRIMENTO', 'VOCACAO', 'MISERICORDIA', 'FUTURO'],
  },
  {
    key: 'daniel', label: 'Daniel', icon: '🦁', category: 'antigo', character: 'Daniel',
    verseRef: 'Daniel 6:22', verseText: 'O meu Deus enviou o seu anjo, e fechou a boca dos leões.',
    words: ['FE', 'SONHO', 'LEOES', 'DANIEL', 'ORACAO', 'CORAGEM', 'FORNALHA', 'BABILONIA', 'FIDELIDADE', 'INTERPRETACAO', 'SABEDORIA', 'ESTATUA', 'PROFECIA', 'INTEGRIDADE', 'JEJUM', 'ANJO', 'REINO', 'CATIVEIRO', 'CONVICCAO', 'PERSEVERANCA'],
  },
  {
    key: 'jonas', label: 'Jonas', icon: '🐋', category: 'antigo', character: 'Jonas',
    verseRef: 'Jonas 2:1', verseText: 'Então Jonas orou ao Senhor, seu Deus, desde o ventre do peixe.',
    words: ['FUGA', 'JONAS', 'PEIXE', 'ORACAO', 'PERDAO', 'NINIVE', 'TEMPESTADE', 'OBEDIENCIA', 'MISERICORDIA', 'ARREPENDIMENTO', 'NAVIO', 'TRESGALHO', 'SOMBRA', 'COMPAIXAO', 'SEGUNDACHANCE', 'MENSAGEIRO', 'IRA', 'CIDADE', 'RESGATE', 'VENTANIA'],
  },
  {
    key: 'elias', label: 'Elias', icon: '⚡', category: 'antigo', character: 'Elias',
    verseRef: '1 Reis 19:12', verseText: 'Depois do fogo uma voz mansa e delicada.',
    words: ['FOGO', 'ELIAS', 'CHUVA', 'CORVOS', 'PROFETA', 'CARMELO', 'JEZABEL', 'MILAGRE', 'CORAGEM', 'CARRUAGEM', 'ELISEU', 'VOZMANSA', 'ALTAR', 'DESAFIO', 'PROVISAO', 'VENTO', 'TERREMOTO', 'CAVERNA', 'ARREBATAMENTO', 'ZELO'],
  },
  {
    key: 'evangelhos', label: 'Evangelhos e Milagres', icon: '✨', category: 'novo', character: 'Jesus',
    verseRef: 'João 3:16', verseText: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.',
    words: ['FE', 'PAO', 'CEGO', 'CURA', 'JESUS', 'PEIXE', 'MILAGRE', 'PARALITICO', 'TEMPESTADE', 'RESSURREICAO', 'MULTIPLICACAO', 'LEPROSO', 'SURDO', 'ENDEMONINHADO', 'COMPAIXAO', 'AUTORIDADE', 'CANADAGALILEIA', 'CALMARIA', 'RESTAURACAO', 'GRATIDAO'],
  },
  {
    key: 'parabolas', label: 'Parábolas', icon: '🌱', category: 'novo',
    verseRef: 'Lucas 15:20', verseText: 'Quando ainda estava longe, viu-o seu pai, e se moveu de íntima compaixão.',
    words: ['REINO', 'FILHO', 'PEROLA', 'PASTOR', 'OVELHA', 'TESOURO', 'PRODIGO', 'SEMENTE', 'TALENTOS', 'SEMEADOR', 'BOMSAMARITANO', 'FARISEU', 'PUBLICANO', 'VIRGENSPRUDENTES', 'FERMENTO', 'VINHA', 'MOEDA', 'MISERICORDIA', 'PERDAO', 'GRACIA'],
  },
  {
    key: 'apostolos', label: 'Apóstolos', icon: '🐟', category: 'novo', character: 'Pedro',
    verseRef: 'Mateus 4:19', verseText: 'Vinde após mim, e eu vos farei pescadores de homens.',
    words: ['REDE', 'JOAO', 'BARCO', 'PEDRO', 'PAULO', 'TIAGO', 'ANDRE', 'SEGUIR', 'CHAMADO', 'TOME', 'FILIPE', 'MATEUS', 'DISCIPULO', 'BARTOLOMEU', 'PESCADOR', 'TESTEMUNHA', 'MISSAO', 'ENTREGA', 'FIDELIDADE', 'DEVOCAO'],
  },
  {
    key: 'cartas', label: 'Cartas dos Apóstolos', icon: '✍️', category: 'novo',
    verseRef: 'Filipenses 4:13', verseText: 'Tudo posso naquele que me fortalece.',
    words: ['FE', 'AMOR', 'GRACA', 'IGREJA', 'CONSELHO', 'DOUTRINA', 'UNIDADE', 'EPISTOLA', 'ESPERANCA', 'EXORTACAO', 'SANTIFICACAO', 'EDIFICACAO', 'CORINTO', 'EFESO', 'ROMANOS', 'GALACIA', 'TIMOTEO', 'FORTALECIMENTO', 'PERSEVERANCA', 'COMUNHAO'],
  },
  {
    key: 'apocalipse', label: 'Apocalipse', icon: '👁️', category: 'novo',
    verseRef: 'Apocalipse 21:4', verseText: 'Deus limpará de seus olhos toda lágrima; não haverá mais morte.',
    words: ['ALFA', 'OMEGA', 'TRONO', 'VISAO', 'GLORIA', 'VITORIA', 'CORDEIRO', 'NOVACEU', 'ETERNIDADE', 'REVELACAO', 'APOCALIPSE', 'NOVATERRA', 'JERUSALEMCELESTIAL', 'SELOS', 'TROMBETAS', 'LIVRODAVIDA', 'ANJOS', 'ADORACAO', 'REDENCAO', 'ESPERANCA'],
  },
  {
    key: 'pentecostes', label: 'Pentecostes', icon: '🔥', category: 'novo',
    verseRef: 'Atos 2:4', verseText: 'E todos foram cheios do Espírito Santo.',
    words: ['FOGO', 'VENTO', 'PODER', 'IGREJA', 'LINGUAS', 'ESPIRITO', 'UNIDADE', 'PREGACAO', 'TESTEMUNHA', 'PENTECOSTES', 'DERRAMAMENTO', 'CENACULO', 'MULTIDAO', 'CONVERSAO', 'BATISMO', 'OUSADIA', 'PROCLAMACAO', 'AVIVAMENTO', 'DOM', 'ENCHIMENTO'],
  },
  {
    key: 'igreja_primitiva', label: 'Igreja Primitiva', icon: '🏘️', category: 'novo',
    verseRef: 'Atos 2:42', verseText: 'Perseveravam na doutrina dos apóstolos, e na comunhão.',
    words: ['FE', 'ORACAO', 'DOUTRINA', 'UNIDADE', 'COMUNHAO', 'IRMANDADE', 'TESTEMUNHO', 'CRESCIMENTO', 'GENEROSIDADE', 'PERSEVERANCA', 'PARTILHA', 'SOLIDARIEDADE', 'MISSAO', 'DIACONO', 'ANCIAO', 'DISCIPULADO', 'MULTIPLICACAO', 'HOSPITALIDADE', 'SERVICO', 'DEVOCAO'],
  },
  {
    key: 'fruto_espirito', label: 'Fruto do Espírito', icon: '🍇', category: 'virtude',
    verseRef: 'Gálatas 5:22', verseText: 'O fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.',
    words: ['FE', 'PAZ', 'GOZO', 'AMOR', 'ALEGRIA', 'BONDADE', 'MANSIDAO', 'PACIENCIA', 'BENIGNIDADE', 'FIDELIDADE', 'DOMINIOPROPRIO', 'LONGANIMIDADE', 'TEMPERANCA', 'HUMILDADE', 'GENTILEZA', 'SANTIDADE', 'EQUILIBRIO', 'MADUREZA', 'CARATER', 'TRANSFORMACAO'],
  },
  {
    key: 'fe', label: 'Fé', icon: '🙏', category: 'virtude',
    verseRef: 'Hebreus 11:1', verseText: 'Ora, a fé é o firme fundamento das coisas que se esperam.',
    words: ['FE', 'CRENCA', 'CERTEZA', 'FIRMEZA', 'MILAGRE', 'PROMESSA', 'CONFIANCA', 'ESPERANCA', 'CONVICCAO', 'FUNDAMENTO', 'PERSEVERANCA', 'OBEDIENCIA', 'ENTREGA', 'CONFIABILIDADE', 'SEGURANCA', 'CERTEZAABSOLUTA', 'FIDELIDADE', 'DEPENDENCIA', 'ESPERA', 'VITORIA'],
  },
  {
    key: 'amor', label: 'Amor', icon: '❤️', category: 'virtude',
    verseRef: '1 Coríntios 13:4', verseText: 'O amor é paciente, o amor é bondoso.',
    words: ['AMOR', 'AFETO', 'CUIDADO', 'ENTREGA', 'BONDADE', 'CARIDADE', 'PACIENCIA', 'COMPAIXAO', 'DEDICACAO', 'GENEROSIDADE', 'SACRIFICIO', 'TERNURA', 'GRATUIDADE', 'ACOLHIMENTO', 'FIDELIDADE', 'DOACAO', 'PERDAO', 'AMIZADE', 'CALOR', 'SERVICO'],
  },
  {
    key: 'oracao', label: 'Oração', icon: '🕊️', category: 'virtude',
    verseRef: 'Filipenses 4:6', verseText: 'Em tudo, pela oração e súplicas, sejam conhecidas diante de Deus as vossas petições.',
    words: ['JEJUM', 'LOUVOR', 'CLAMOR', 'ORACAO', 'SUPLICA', 'PETICAO', 'GRATIDAO', 'COMUNHAO', 'ADORACAO', 'INTERCESSAO', 'CONFISSAO', 'MEDITACAO', 'VIGILIA', 'PERSEVERANCA', 'HUMILDADE', 'CONSAGRACAO', 'CLAMOR', 'SILENCIO', 'ENTREGA', 'CONVERSA'],
  },
  {
    key: 'sabedoria', label: 'Sabedoria', icon: '📚', category: 'virtude',
    verseRef: 'Provérbios 3:5', verseText: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.',
    words: ['ENSINO', 'VERDADE', 'CONSELHO', 'PRUDENCIA', 'TEMENCIA', 'REFLEXAO', 'SABEDORIA', 'DISCIPLINA', 'ENTENDIMENTO', 'CONHECIMENTO', 'DISCERNIMENTO', 'INTELIGENCIA', 'PRUDENTE', 'HUMILDADE', 'EXPERIENCIA', 'PONDERACAO', 'CAUTELA', 'CLAREZA', 'RETIDAO', 'MADUREZA'],
  },
  {
    key: 'perdao', label: 'Perdão', icon: '🤝', category: 'virtude',
    verseRef: 'Colossenses 3:13', verseText: 'Perdoando-vos uns aos outros, assim como Cristo vos perdoou.',
    words: ['CURA', 'PAZ', 'GRACA', 'PERDAO', 'TOLERANCIA', 'COMPAIXAO', 'MISERICORDIA', 'LIBERTACAO', 'RECONCILIACAO', 'ARREPENDIMENTO', 'ESQUECIMENTO', 'RESTAURACAO', 'HUMILDADE', 'PACIENCIA', 'BONDADE', 'LEVEZA', 'RENOVACAO', 'ACEITACAO', 'GENEROSIDADE', 'MISERICORDIOSO'],
  },
  {
    key: 'familia', label: 'Família', icon: '👨‍👩‍👧', category: 'virtude',
    verseRef: 'Josué 24:15', verseText: 'Eu e a minha casa serviremos ao Senhor.',
    words: ['LAR', 'CASA', 'PAIS', 'UNIAO', 'FAMILIA', 'FILHOS', 'RESPEITO', 'HERANCA', 'BENCAO', 'GERACAO', 'CASAMENTO', 'CONVIVENCIA', 'EDUCACAO', 'PROTECAO', 'CARINHO', 'FIDELIDADE', 'CUIDADO', 'HARMONIA', 'ANCESTRALIDADE', 'LEGADO'],
  },
  // ===== Novos temas (Antigo Testamento) =====
  {
    key: 'jo_pacienca', label: 'Jó e a Provação', icon: '🌪️', category: 'antigo', character: 'Jó',
    verseRef: 'Jó 1:21', verseText: 'O Senhor o deu, e o Senhor o tomou; bendito seja o nome do Senhor.',
    words: ['DOR', 'JO', 'PROVA', 'PERDA', 'AMIGOS', 'PACIENCIA', 'SOFRIMENTO', 'RESTAURACAO', 'INTEGRIDADE', 'CONFIANCA', 'TEMPESTADE', 'RESIGNACAO', 'FIDELIDADE', 'LAMENTO', 'ESPERANCA', 'JUSTICA', 'MISTERIO', 'HUMILDADE', 'BENCAO', 'PERSEVERANCA'],
  },
  {
    key: 'jaco', label: 'Jacó', icon: '🪜', category: 'antigo', character: 'Jacó',
    verseRef: 'Gênesis 28:15', verseText: 'Eis que estou contigo, e te guardarei por onde quer que fores.',
    words: ['ESAU', 'JACO', 'RAQUEL', 'LEA', 'ESCADA', 'SONHO', 'BENCAO', 'PRIMOGENITURA', 'LABAO', 'LUTA', 'ANJO', 'BETEL', 'ISRAEL', 'PROMESSA', 'RECONCILIACAO', 'PEREGRINO', 'DOZETRIBOS', 'ALIANCA', 'PERDAO', 'DESTINO'],
  },
  {
    key: 'ester', label: 'Ester', icon: '👸', category: 'antigo', character: 'Ester',
    verseRef: 'Ester 4:14', verseText: 'E quem sabe se não foi para tempo como este que chegaste a este reino?',
    words: ['REI', 'ESTER', 'MARDOQUEU', 'HAMA', 'RAINHA', 'JEJUM', 'CORAGEM', 'BANQUETE', 'LIBERTACAO', 'PROVIDENCIA', 'DESTINO', 'INTERCESSAO', 'RISCO', 'SALVACAO', 'JUSTICA', 'FESTA', 'REVERSAO', 'PERSIA', 'BRAVURA', 'FIDELIDADE'],
  },
  {
    key: 'jo_neemias', label: 'Neemias e a Reconstrução', icon: '🧱', category: 'antigo', character: 'Neemias',
    verseRef: 'Neemias 6:3', verseText: 'Eu faço uma grande obra, e não posso descer.',
    words: ['MURO', 'RUINA', 'OBRA', 'CIDADE', 'ESDRAS', 'ORACAO', 'NEEMIAS', 'RECONSTRUCAO', 'JERUSALEM', 'LIDERANCA', 'OPOSICAO', 'DETERMINACAO', 'UNIDADE', 'TRABALHO', 'MURALHA', 'RESTAURACAO', 'COPEIRO', 'VIGILANCIA', 'PERSEVERANCA', 'DEDICACAO'],
  },
  {
    key: 'ninho_provérbios', label: 'Provérbios e Conselhos', icon: '🕯️', category: 'virtude',
    verseRef: 'Provérbios 4:23', verseText: 'Sobre tudo o que se deve guardar, guarda o teu coração.',
    words: ['CONSELHO', 'RETIDAO', 'DILIGENCIA', 'HONESTIDADE', 'MODERACAO', 'PRUDENCIA', 'SIMPLICIDADE', 'GENEROSIDADE', 'LEALDADE', 'RESPEITO', 'CORACAO', 'BOCA', 'LINGUA', 'AMIZADE', 'TRABALHO', 'JUSTICA', 'HUMILDADE', 'DISCIPLINA', 'TEMENCIA', 'SABEDORIA'],
  },
  // ===== Novos temas (Novo Testamento) =====
  {
    key: 'joao_batista', label: 'João Batista', icon: '💧', category: 'novo', character: 'João Batista',
    verseRef: 'Mateus 3:3', verseText: 'Preparai o caminho do Senhor, endireitai as suas veredas.',
    words: ['RIO', 'MEL', 'VOZ', 'JORDAO', 'BATISMO', 'DESERTO', 'PROFETA', 'ARREPENDIMENTO', 'PRECURSOR', 'CAMINHO', 'GAFANHOTOS', 'PREGACAO', 'HUMILDADE', 'TESTEMUNHO', 'CORDEIRODEDEUS', 'MARTIRIO', 'CONVERSAO', 'ANUNCIO', 'REINO', 'RETIDAO'],
  },
  {
    key: 'maria_mae', label: 'Maria, Mãe de Jesus', icon: '🌸', category: 'novo', character: 'Maria',
    verseRef: 'Lucas 1:38', verseText: 'Eis aqui a serva do Senhor; cumpra-se em mim segundo a tua palavra.',
    words: ['MARIA', 'JOSE', 'ANJO', 'GABRIEL', 'BELEM', 'MANJEDOURA', 'NAZARE', 'ANUNCIACAO', 'OBEDIENCIA', 'HUMILDADE', 'MAGNIFICAT', 'VISITACAO', 'ISABEL', 'FIDELIDADE', 'ENTREGA', 'MATERNIDADE', 'ESPERANCA', 'GRACA', 'MISTERIO', 'BENCAO'],
  },
  {
    key: 'marta_maria', label: 'Marta e Maria', icon: '🏡', category: 'novo', character: 'Maria de Betânia',
    verseRef: 'Lucas 10:42', verseText: 'Maria escolheu a boa parte, a qual não lhe será tirada.',
    words: ['CASA', 'MARTA', 'MARIA', 'LAZARO', 'BETANIA', 'SERVICO', 'ESCUTA', 'DEVOCAO', 'HOSPITALIDADE', 'PRIORIDADE', 'ADORACAO', 'PRESENCA', 'IRMAS', 'AMIZADE', 'ANSIEDADE', 'PAZ', 'ATENCAO', 'DEDICACAO', 'ENSINAMENTO', 'CONTEMPLACAO'],
  },
  {
    key: 'zaqueu', label: 'Zaqueu', icon: '🌳', category: 'novo', character: 'Zaqueu',
    verseRef: 'Lucas 19:9', verseText: 'Hoje veio a salvação a esta casa.',
    words: ['SICOMORO', 'ARVORE', 'ZAQUEU', 'PUBLICANO', 'RESTITUICAO', 'CONVERSAO', 'SALVACAO', 'BAIXOESTATURA', 'MULTIDAO', 'CURIOSIDADE', 'ARREPENDIMENTO', 'GENEROSIDADE', 'ENCONTRO', 'TRANSFORMACAO', 'ACOLHIMENTO', 'JERICO', 'ALEGRIA', 'MUDANCA', 'HOSPEDAGEM', 'RECEPCAO'],
  },
  {
    key: 'lazaro', label: 'Lázaro Ressuscitado', icon: '⚱️', category: 'novo', character: 'Lázaro',
    verseRef: 'João 11:25', verseText: 'Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá.',
    words: ['TUMBA', 'MORTE', 'LAZARO', 'BETANIA', 'CHORO', 'LAGRIMAS', 'RESSURREICAO', 'MILAGRE', 'FE', 'GLORIA', 'PODER', 'ESPERANCA', 'VIDA', 'AMIZADE', 'COMPAIXAO', 'RESTAURACAO', 'TESTEMUNHA', 'VITORIA', 'SEPULTURA', 'LIBERTACAO'],
  },
  {
    key: 'paulo_conversao', label: 'Paulo e a Conversão', icon: '⚡', category: 'novo', character: 'Paulo',
    verseRef: 'Atos 9:15', verseText: 'Este é para mim um vaso escolhido, para levar o meu nome.',
    words: ['LUZ', 'SAULO', 'PAULO', 'DAMASCO', 'CEGUEIRA', 'CONVERSAO', 'APOSTOLO', 'MISSIONARIO', 'PERSEGUICAO', 'TRANSFORMACAO', 'ANANIAS', 'VOCACAO', 'PREGACAO', 'VIAGENS', 'CARTAS', 'PERSEVERANCA', 'SACRIFICIO', 'TESTEMUNHO', 'ZELO', 'CORAGEM'],
  },
  {
    key: 'ananias_safira', label: 'Ananias e Safira', icon: '⚖️', category: 'novo',
    verseRef: 'Atos 5:4', verseText: 'Não mentiste aos homens, mas a Deus.',
    words: ['MENTIRA', 'VERDADE', 'ANANIAS', 'SAFIRA', 'IGREJA', 'GENEROSIDADE', 'HIPOCRISIA', 'INTEGRIDADE', 'TEMOR', 'SANTIDADE', 'JULGAMENTO', 'OFERTA', 'SINCERIDADE', 'CONSEQUENCIA', 'TRANSPARENCIA', 'CONSAGRACAO', 'RETIDAO', 'PUREZA', 'ADVERTENCIA', 'FIDELIDADE'],
  },
  {
    key: 'estevao', label: 'Estêvão, o Primeiro Mártir', icon: '✨', category: 'novo', character: 'Estêvão',
    verseRef: 'Atos 7:59', verseText: 'Senhor Jesus, recebe o meu espírito.',
    words: ['FE', 'ROCHA', 'ESTEVAO', 'DIACONO', 'MARTIR', 'SANEDRIM', 'VISAO', 'CORAGEM', 'PERDAO', 'TESTEMUNHO', 'SACRIFICIO', 'FIDELIDADE', 'PERSEGUICAO', 'GLORIA', 'ORACAO', 'ENTREGA', 'CONVICCAO', 'DENUNCIA', 'CONSAGRACAO', 'ETERNIDADE'],
  },
  {
    key: 'timoteo', label: 'Timóteo, Filho na Fé', icon: '📘', category: 'novo', character: 'Timóteo',
    verseRef: '2 Timóteo 1:7', verseText: 'Deus não nos deu o espírito de temor, mas de poder, de amor e de moderação.',
    words: ['FE', 'JOVEM', 'IGREJA', 'MENTOR', 'TIMOTEO', 'DISCIPULO', 'DOUTRINA', 'EXEMPLO', 'CORAGEM', 'FIDELIDADE', 'ENSINAMENTO', 'FORTALECIMENTO', 'LIDERANCA', 'DEDICACAO', 'SERVICO', 'HERANCA', 'VOCACAO', 'DILIGENCIA', 'PERSEVERANCA', 'CUIDADO'],
  },
  {
    key: 'cruz_ressurreicao', label: 'Cruz e Ressurreição', icon: '✝️', category: 'novo', character: 'Jesus',
    verseRef: '1 Coríntios 15:20', verseText: 'Mas de fato Cristo ressuscitou dos mortos, sendo ele as primícias dos que dormem.',
    words: ['CRUZ', 'TUMBA', 'GOLGOTA', 'PAIXAO', 'CALVARIO', 'SACRIFICIO', 'RESSURREICAO', 'SALVACAO', 'REDENCAO', 'VITORIA', 'GLORIA', 'SEPULCROVAZIO', 'ETERNIDADE', 'ESPERANCA', 'PERDAO', 'GRACA', 'TRIUNFO', 'EXPIACAO', 'RECONCILIACAO', 'VIDANOVA'],
  },
  {
    key: 'ascensao_pentecostes', label: 'Ascensão e Promessa', icon: '☁️', category: 'novo',
    verseRef: 'Atos 1:11', verseText: 'Este Jesus, que dentre vós foi recebido em cima no céu, há de vir assim como o vistes ir.',
    words: ['CEU', 'NUVEM', 'MONTE', 'PROMESSA', 'ASCENSAO', 'TESTEMUNHA', 'ESPERANCA', 'VOLTA', 'GLORIA', 'DISCIPULOS', 'BENCAO', 'MISSAO', 'ANJOS', 'ALEGRIA', 'ADORACAO', 'EXPECTATIVA', 'ETERNIDADE', 'VIGILANCIA', 'FIDELIDADE', 'CUMPRIMENTO'],
  },
  {
    key: 'segunda_vinda', label: 'Segunda Vinda', icon: '🌅', category: 'virtude',
    verseRef: 'Mateus 24:44', verseText: 'Por isso, estai vós apercebidos também; porque o Filho do Homem há de vir à hora em que não penseis.',
    words: ['VIGIA', 'VOLTA', 'GLORIA', 'ESPERA', 'PROMESSA', 'VIGILANCIA', 'PREPARACAO', 'ESPERANCA', 'TROMBETA', 'ENCONTRO', 'EXPECTATIVA', 'FIDELIDADE', 'PRONTIDAO', 'ETERNIDADE', 'JULGAMENTO', 'RECOMPENSA', 'ALEGRIA', 'TRIUNFO', 'REINO', 'CUMPRIMENTO'],
  },
  {
    key: 'anjos', label: 'Anjos e Mensageiros', icon: '👼', category: 'virtude',
    verseRef: 'Hebreus 1:14', verseText: 'Não são todos eles espíritos ministradores, enviados para servir a favor dos que hão de herdar a salvação?',
    words: ['ANJO', 'GABRIEL', 'MIGUEL', 'MENSAGEIRO', 'PROTECAO', 'GUARDA', 'ANUNCIO', 'GLORIA', 'LOUVOR', 'SERVICO', 'CELESTIAL', 'REVELACAO', 'VISITACAO', 'MISSAO', 'ADORACAO', 'PRESENCA', 'MARAVILHA', 'GUERREIRO', 'CUIDADO', 'AMPARO'],
  },
  {
    key: 'guerra_espiritual', label: 'Guerra Espiritual', icon: '🛡️', category: 'virtude',
    verseRef: 'Efésios 6:11', verseText: 'Revesti-vos de toda a armadura de Deus, para que possais estar firmes contra as ciladas do diabo.',
    words: ['FE', 'ESCUDO', 'ESPADA', 'PELEJA', 'BATALHA', 'ARMADURA', 'VITORIA', 'PROTECAO', 'RESISTENCIA', 'FIRMEZA', 'ORACAO', 'VIGILANCIA', 'DISCERNIMENTO', 'AUTORIDADE', 'LIBERTACAO', 'INTERCESSAO', 'PERSEVERANCA', 'CAPACETE', 'CINTURAO', 'VERDADE'],
  },
  {
    key: 'louvor_adoracao', label: 'Louvor e Adoração', icon: '🎶', category: 'virtude',
    verseRef: 'Salmos 150:6', verseText: 'Tudo quanto tem fôlego louve ao Senhor.',
    words: ['HARPA', 'CANTO', 'SALMO', 'LOUVOR', 'MUSICA', 'DANCA', 'ADORACAO', 'GRATIDAO', 'CELEBRACAO', 'CANTICO', 'INSTRUMENTO', 'ALEGRIA', 'GLORIA', 'REVERENCIA', 'ENTREGA', 'EXALTACAO', 'CONTEMPLACAO', 'HINO', 'PALMAS', 'ADORADOR'],
  },
  {
    key: 'servico_missoes', label: 'Serviço e Missões', icon: '🌍', category: 'virtude',
    verseRef: 'Mateus 28:19', verseText: 'Ide, portanto, fazei discípulos de todas as nações.',
    words: ['IDE', 'MISSAO', 'SERVICO', 'ENVIADO', 'VOCACAO', 'MISSIONARIO', 'DISCIPULADO', 'PREGACAO', 'DEDICACAO', 'SACRIFICIO', 'COMPAIXAO', 'ENTREGA', 'ALCANCE', 'TESTEMUNHO', 'GENEROSIDADE', 'HUMILDADE', 'OBEDIENCIA', 'ESPERANCA', 'TRANSFORMACAO', 'PROPOSITO'],
  },
];

export function getThemeByKey(key: string): WordSearchTheme | undefined {
  return WORD_SEARCH_THEMES.find(t => t.key === key);
}

export function getThemeForLevel(level: number): WordSearchTheme {
  return WORD_SEARCH_THEMES[(level - 1) % WORD_SEARCH_THEMES.length];
}
