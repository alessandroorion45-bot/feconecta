/**
 * Banco de temas do Palavra Viva — estrutura extensível.
 * Cada tema tem palavras curadas de verdade (não extraídas aleatoriamente),
 * um versículo-âncora e, quando aplicável, um personagem central (usado na
 * trilha espiritual). Adicionar um tema novo é só adicionar um objeto aqui.
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
    words: ['LUZ', 'CEU', 'TERRA', 'MAR', 'AGUA', 'ARVORE', 'ANIMAL', 'HOMEM', 'MULHER', 'DESCANSO', 'JARDIM', 'EDEN'],
  },
  {
    key: 'noe', label: 'Noé', icon: '🌊', category: 'antigo', character: 'Noé',
    verseRef: 'Gênesis 6:9', verseText: 'Noé era homem justo e perfeito em suas gerações; Noé andava com Deus.',
    words: ['ARCA', 'DILUVIO', 'CHUVA', 'POMBA', 'RAMO', 'OLIVEIRA', 'ARCOIRIS', 'ALIANCA', 'ANIMAIS', 'FAMILIA'],
  },
  {
    key: 'abraao', label: 'Abraão', icon: '⭐', category: 'antigo', character: 'Abraão',
    verseRef: 'Gênesis 12:2', verseText: 'Farei de ti uma grande nação, e te abençoarei.',
    words: ['PROMESSA', 'ESTRELAS', 'SARA', 'ISAQUE', 'ALTAR', 'FE', 'CANAA', 'BENCAO', 'NACAO', 'PEREGRINO'],
  },
  {
    key: 'jose', label: 'José do Egito', icon: '🌾', category: 'antigo', character: 'José',
    verseRef: 'Gênesis 50:20', verseText: 'Vós intentastes o mal contra mim, porém Deus o tornou em bem.',
    words: ['SONHO', 'TUNICA', 'EGITO', 'FARAO', 'PERDAO', 'IRMAOS', 'CELEIRO', 'FOME', 'PRISAO', 'GOVERNADOR'],
  },
  {
    key: 'moises', label: 'Moisés', icon: '🔥', category: 'antigo', character: 'Moisés',
    verseRef: 'Êxodo 3:14', verseText: 'Disse Deus a Moisés: EU SOU O QUE SOU.',
    words: ['SARCA', 'MONTE', 'VARA', 'FARAO', 'MANA', 'TABUAS', 'DESERTO', 'LIBERTADOR', 'MAR', 'NUVEM'],
  },
  {
    key: 'exodo', label: 'Êxodo e Libertação', icon: '🐑', category: 'antigo',
    verseRef: 'Êxodo 14:14', verseText: 'O Senhor pelejará por vós, e vós vos calareis.',
    words: ['PASCOA', 'CORDEIRO', 'SANGUE', 'PRAGAS', 'LIBERTACAO', 'FARAO', 'ESCRAVIDAO', 'SAIDA', 'MAR', 'VERMELHO'],
  },
  {
    key: 'deserto', label: 'Deserto', icon: '🏜️', category: 'antigo',
    verseRef: 'Deuteronômio 8:2', verseText: 'Lembra-te de todo o caminho pelo qual o Senhor teu Deus te guiou no deserto.',
    words: ['MANA', 'CODORNIZ', 'NUVEM', 'FOGO', 'TENDA', 'JORNADA', 'PROVACAO', 'AGUA', 'ROCHA', 'CAMINHO'],
  },
  {
    key: 'josue', label: 'Josué e Conquista', icon: '🏰', category: 'antigo', character: 'Josué',
    verseRef: 'Josué 1:9', verseText: 'Sê forte e corajoso; não temas, nem te espantes.',
    words: ['JERICO', 'MURALHA', 'TROMBETA', 'CORAGEM', 'CONQUISTA', 'CANAA', 'ALIANCA', 'FORTE', 'ESPIAS', 'PROMESSA'],
  },
  {
    key: 'juizes', label: 'Juízes de Israel', icon: '⚔️', category: 'antigo', character: 'Sansão',
    verseRef: 'Juízes 21:25', verseText: 'Cada um fazia o que parecia bem aos seus próprios olhos.',
    words: ['DEBORA', 'GEDEAO', 'SANSAO', 'FORCA', 'LIBERTADOR', 'INIMIGO', 'VITORIA', 'JUIZ', 'ISRAEL', 'CABELO'],
  },
  {
    key: 'rute', label: 'Rute e Fidelidade', icon: '🌾', category: 'antigo', character: 'Rute',
    verseRef: 'Rute 1:16', verseText: 'Aonde quer que fores irei, e onde quer que pousares pousarei.',
    words: ['RUTE', 'NOEMI', 'BOAZ', 'LEALDADE', 'COLHEITA', 'CAMPO', 'REDENTOR', 'FAMILIA', 'FIDELIDADE', 'AMOR'],
  },
  {
    key: 'samuel', label: 'Samuel e os Reis', icon: '📯', category: 'antigo', character: 'Samuel',
    verseRef: '1 Samuel 3:10', verseText: 'Fala, Senhor, porque o teu servo ouve.',
    words: ['SAMUEL', 'ANA', 'TEMPLO', 'CHAMADO', 'PROFETA', 'UNCAO', 'SAUL', 'REI', 'OBEDIENCIA', 'ORACAO'],
  },
  {
    key: 'davi', label: 'Davi e o Reino', icon: '👑', category: 'antigo', character: 'Davi',
    verseRef: '1 Samuel 17:45', verseText: 'Tu vens a mim com espada, mas eu venho a ti em nome do Senhor dos Exércitos.',
    words: ['DAVI', 'GOLIAS', 'FUNDA', 'PASTOR', 'HARPA', 'REI', 'JERUSALEM', 'SALMO', 'CORAGEM', 'UNGIDO'],
  },
  {
    key: 'salomao', label: 'Salomão e Sabedoria', icon: '🏛️', category: 'antigo', character: 'Salomão',
    verseRef: '1 Reis 3:9', verseText: 'Dá, pois, ao teu servo um coração entendido.',
    words: ['SALOMAO', 'SABEDORIA', 'TEMPLO', 'PROVERBIOS', 'RIQUEZA', 'JUIZO', 'REINO', 'GLORIA', 'CONSTRUCAO', 'PAZ'],
  },
  {
    key: 'profetas', label: 'Profetas de Israel', icon: '📜', category: 'antigo',
    verseRef: 'Amós 3:7', verseText: 'O Senhor Deus não faz coisa alguma sem revelar o seu segredo aos profetas.',
    words: ['PROFETA', 'VISAO', 'MENSAGEM', 'ARREPENDIMENTO', 'JULGAMENTO', 'ESPERANCA', 'PALAVRA', 'REVELACAO', 'VOZ', 'CHAMADO'],
  },
  {
    key: 'isaias', label: 'Isaías Profeta', icon: '🕊️', category: 'antigo', character: 'Isaías',
    verseRef: 'Isaías 9:6', verseText: 'Um menino nos nasceu, um filho se nos deu, Príncipe da Paz.',
    words: ['ISAIAS', 'CONSOLO', 'SALVACAO', 'MESSIAS', 'PROFECIA', 'SANTO', 'GLORIA', 'REDENCAO', 'LUZ', 'ESPERANCA'],
  },
  {
    key: 'jeremias', label: 'Jeremias', icon: '📖', category: 'antigo', character: 'Jeremias',
    verseRef: 'Jeremias 29:11', verseText: 'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor.',
    words: ['JEREMIAS', 'LAMENTACAO', 'PLANOS', 'ESPERANCA', 'ALIANCA', 'CORACAO', 'RESTAURACAO', 'FIDELIDADE', 'CHORO', 'PROMESSA'],
  },
  {
    key: 'daniel', label: 'Daniel', icon: '🦁', category: 'antigo', character: 'Daniel',
    verseRef: 'Daniel 6:22', verseText: 'O meu Deus enviou o seu anjo, e fechou a boca dos leões.',
    words: ['DANIEL', 'LEOES', 'FORNALHA', 'SONHO', 'FIDELIDADE', 'ORACAO', 'BABILONIA', 'INTERPRETACAO', 'CORAGEM', 'FE'],
  },
  {
    key: 'jonas', label: 'Jonas', icon: '🐋', category: 'antigo', character: 'Jonas',
    verseRef: 'Jonas 2:1', verseText: 'Então Jonas orou ao Senhor, seu Deus, desde o ventre do peixe.',
    words: ['JONAS', 'NINIVE', 'PEIXE', 'TEMPESTADE', 'FUGA', 'ARREPENDIMENTO', 'MISERICORDIA', 'ORACAO', 'OBEDIENCIA', 'PERDAO'],
  },
  {
    key: 'elias', label: 'Elias', icon: '⚡', category: 'antigo', character: 'Elias',
    verseRef: '1 Reis 19:12', verseText: 'Depois do fogo uma voz mansa e delicada.',
    words: ['ELIAS', 'CARMELO', 'FOGO', 'CARRUAGEM', 'PROFETA', 'JEZABEL', 'CORVOS', 'MILAGRE', 'CHUVA', 'CORAGEM'],
  },
  {
    key: 'evangelhos', label: 'Evangelhos e Milagres', icon: '✨', category: 'novo', character: 'Jesus',
    verseRef: 'João 3:16', verseText: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.',
    words: ['JESUS', 'MILAGRE', 'CURA', 'CEGO', 'PARALITICO', 'PAO', 'PEIXE', 'TEMPESTADE', 'RESSURREICAO', 'FE'],
  },
  {
    key: 'parabolas', label: 'Parábolas', icon: '🌱', category: 'novo',
    verseRef: 'Lucas 15:20', verseText: 'Quando ainda estava longe, viu-o seu pai, e se moveu de íntima compaixão.',
    words: ['SEMEADOR', 'SEMENTE', 'TALENTOS', 'FILHO', 'PRODIGO', 'PASTOR', 'OVELHA', 'TESOURO', 'REINO', 'PEROLA'],
  },
  {
    key: 'apostolos', label: 'Apóstolos', icon: '🐟', category: 'novo', character: 'Pedro',
    verseRef: 'Mateus 4:19', verseText: 'Vinde após mim, e eu vos farei pescadores de homens.',
    words: ['PEDRO', 'PAULO', 'JOAO', 'TIAGO', 'ANDRE', 'DISCIPULO', 'CHAMADO', 'REDE', 'BARCO', 'SEGUIR'],
  },
  {
    key: 'cartas', label: 'Cartas dos Apóstolos', icon: '✍️', category: 'novo',
    verseRef: 'Filipenses 4:13', verseText: 'Tudo posso naquele que me fortalece.',
    words: ['EPISTOLA', 'IGREJA', 'GRACA', 'DOUTRINA', 'EXORTACAO', 'AMOR', 'FE', 'ESPERANCA', 'UNIDADE', 'CONSELHO'],
  },
  {
    key: 'apocalipse', label: 'Apocalipse', icon: '👁️', category: 'novo',
    verseRef: 'Apocalipse 21:4', verseText: 'Deus limpará de seus olhos toda lágrima; não haverá mais morte.',
    words: ['APOCALIPSE', 'TRONO', 'CORDEIRO', 'VISAO', 'GLORIA', 'ETERNIDADE', 'VITORIA', 'NOVACEU', 'REVELACAO', 'ALFA'],
  },
  {
    key: 'pentecostes', label: 'Pentecostes', icon: '🔥', category: 'novo',
    verseRef: 'Atos 2:4', verseText: 'E todos foram cheios do Espírito Santo.',
    words: ['PENTECOSTES', 'ESPIRITO', 'LINGUAS', 'FOGO', 'VENTO', 'PODER', 'IGREJA', 'TESTEMUNHA', 'UNIDADE', 'PREGACAO'],
  },
  {
    key: 'igreja_primitiva', label: 'Igreja Primitiva', icon: '🏘️', category: 'novo',
    verseRef: 'Atos 2:42', verseText: 'Perseveravam na doutrina dos apóstolos, e na comunhão.',
    words: ['COMUNHAO', 'ORACAO', 'PARTIRPAO', 'UNIDADE', 'GENEROSIDADE', 'TESTEMUNHO', 'CRESCIMENTO', 'PERSEVERANCA', 'DOUTRINA', 'IRMANDADE'],
  },
  {
    key: 'fruto_espirito', label: 'Fruto do Espírito', icon: '🍇', category: 'virtude',
    verseRef: 'Gálatas 5:22', verseText: 'O fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.',
    words: ['AMOR', 'ALEGRIA', 'PAZ', 'PACIENCIA', 'BONDADE', 'FIDELIDADE', 'MANSIDAO', 'DOMINIOPROPRIO', 'BENIGNIDADE', 'GOZO'],
  },
  {
    key: 'fe', label: 'Fé', icon: '🙏', category: 'virtude',
    verseRef: 'Hebreus 11:1', verseText: 'Ora, a fé é o firme fundamento das coisas que se esperam.',
    words: ['FE', 'CONFIANCA', 'CERTEZA', 'ESPERANCA', 'FUNDAMENTO', 'CRENCA', 'FIRMEZA', 'CONVICCAO', 'MILAGRE', 'PROMESSA'],
  },
  {
    key: 'amor', label: 'Amor', icon: '❤️', category: 'virtude',
    verseRef: '1 Coríntios 13:4', verseText: 'O amor é paciente, o amor é bondoso.',
    words: ['AMOR', 'CARIDADE', 'BONDADE', 'PACIENCIA', 'GENEROSIDADE', 'COMPAIXAO', 'DEDICACAO', 'AFETO', 'CUIDADO', 'ENTREGA'],
  },
  {
    key: 'oracao', label: 'Oração', icon: '🕊️', category: 'virtude',
    verseRef: 'Filipenses 4:6', verseText: 'Em tudo, pela oração e súplicas, sejam conhecidas diante de Deus as vossas petições.',
    words: ['ORACAO', 'SUPLICA', 'GRATIDAO', 'PETICAO', 'INTERCESSAO', 'LOUVOR', 'JEJUM', 'COMUNHAO', 'CLAMOR', 'ADORACAO'],
  },
  {
    key: 'sabedoria', label: 'Sabedoria', icon: '📚', category: 'virtude',
    verseRef: 'Provérbios 3:5', verseText: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.',
    words: ['SABEDORIA', 'ENTENDIMENTO', 'CONHECIMENTO', 'DISCERNIMENTO', 'CONSELHO', 'PRUDENCIA', 'VERDADE', 'ENSINO', 'TEMENCIA', 'REFLEXAO'],
  },
  {
    key: 'perdao', label: 'Perdão', icon: '🤝', category: 'virtude',
    verseRef: 'Colossenses 3:13', verseText: 'Perdoando-vos uns aos outros, assim como Cristo vos perdoou.',
    words: ['PERDAO', 'MISERICORDIA', 'GRACA', 'RECONCILIACAO', 'ARREPENDIMENTO', 'CURA', 'LIBERTACAO', 'COMPAIXAO', 'TOLERANCIA', 'PAZ'],
  },
  {
    key: 'familia', label: 'Família', icon: '👨‍👩‍👧', category: 'virtude',
    verseRef: 'Josué 24:15', verseText: 'Eu e a minha casa serviremos ao Senhor.',
    words: ['FAMILIA', 'LAR', 'PAIS', 'FILHOS', 'UNIAO', 'RESPEITO', 'HERANCA', 'BENCAO', 'CASA', 'GERACAO'],
  },
];

export function getThemeByKey(key: string): WordSearchTheme | undefined {
  return WORD_SEARCH_THEMES.find(t => t.key === key);
}

export function getThemeForLevel(level: number): WordSearchTheme {
  return WORD_SEARCH_THEMES[(level - 1) % WORD_SEARCH_THEMES.length];
}
