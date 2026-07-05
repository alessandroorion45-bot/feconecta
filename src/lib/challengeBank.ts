/**
 * Banco local de desafios espirituais — fallback quando o banco de dados
 * não tem desafio para a data (garante que NUNCA falte desafio do dia).
 * A seleção é determinística pela data: todos os usuários veem o mesmo
 * desafio, e dias consecutivos nunca repetem.
 */

export interface BankChallenge {
  category: string;
  challenge_text: string;
  motivational_quote: string;
  difficulty_level: 'facil' | 'medio' | 'dificil';
  points_reward: number;
}

export const CHALLENGE_BANK: BankChallenge[] = [
  // Leitura Bíblica 📖
  { category: 'leitura', challenge_text: '📖 Leia um capítulo de Provérbios e anote um conselho para hoje.', motivational_quote: 'Lâmpada para os meus pés é a tua palavra. — Salmos 119:105', difficulty_level: 'facil', points_reward: 10 },
  { category: 'oracao', challenge_text: '🙏 Ore em silêncio por cinco minutos, apenas ouvindo a Deus.', motivational_quote: 'Aquietai-vos e sabei que eu sou Deus. — Salmos 46:10', difficulty_level: 'facil', points_reward: 10 },
  { category: 'quiz', challenge_text: '🧠 Complete um Quiz Bíblico hoje e teste seus conhecimentos.', motivational_quote: 'Examinais as Escrituras... — João 5:39', difficulty_level: 'medio', points_reward: 15 },
  { category: 'gratidao', challenge_text: '🌻 Escreva três motivos pelos quais você é grato hoje no Mural da Gratidão.', motivational_quote: 'Em tudo dai graças. — 1 Tessalonicenses 5:18', difficulty_level: 'facil', points_reward: 10 },
  { category: 'leitura', challenge_text: '📖 Leia um Salmo e destaque o versículo que mais falou ao seu coração.', motivational_quote: 'A tua palavra é a verdade. — João 17:17', difficulty_level: 'facil', points_reward: 10 },
  { category: 'comunidade', challenge_text: '🤝 Comente uma publicação de um irmão com uma palavra de incentivo.', motivational_quote: 'Edificai-vos uns aos outros. — 1 Tessalonicenses 5:11', difficulty_level: 'facil', points_reward: 10 },
  { category: 'caca_palavras', challenge_text: '🔍 Complete um caça-palavras bíblico no Palavra Viva.', motivational_quote: 'Buscai e achareis. — Mateus 7:7', difficulty_level: 'medio', points_reward: 15 },
  { category: 'oracao', challenge_text: '🙏 Ore por cada membro da sua família, um por um.', motivational_quote: 'Eu e a minha casa serviremos ao Senhor. — Josué 24:15', difficulty_level: 'facil', points_reward: 10 },
  { category: 'evangelismo', challenge_text: '✝️ Compartilhe um versículo com alguém que precisa de esperança.', motivational_quote: 'Ide por todo o mundo... — Marcos 16:15', difficulty_level: 'medio', points_reward: 20 },
  { category: 'leitura', challenge_text: '📖 Leia João 3 inteiro e medite no amor de Deus.', motivational_quote: 'Porque Deus amou o mundo de tal maneira... — João 3:16', difficulty_level: 'medio', points_reward: 15 },
  { category: 'estudo', challenge_text: '📚 Leia um Estudo Bíblico completo na plataforma.', motivational_quote: 'Procura apresentar-te a Deus aprovado. — 2 Timóteo 2:15', difficulty_level: 'medio', points_reward: 15 },
  { category: 'oracao', challenge_text: '🙏 Ore pelos enfermos que você conhece, citando cada nome.', motivational_quote: 'A oração da fé salvará o doente. — Tiago 5:15', difficulty_level: 'facil', points_reward: 10 },
  { category: 'comunidade', challenge_text: '❤️ Publique um testemunho do que Deus fez na sua vida.', motivational_quote: 'Eles o venceram pela palavra do seu testemunho. — Apocalipse 12:11', difficulty_level: 'medio', points_reward: 20 },
  { category: 'leitura', challenge_text: '📖 Leia Romanos 8 e escreva o que mais tocou você.', motivational_quote: 'Nada nos separará do amor de Deus. — Romanos 8:39', difficulty_level: 'medio', points_reward: 15 },
  { category: 'igreja', challenge_text: '⛪ Registre presença no Mural da sua comunidade com um aviso ou saudação.', motivational_quote: 'Não deixemos de congregar-nos. — Hebreus 10:25', difficulty_level: 'facil', points_reward: 10 },
  { category: 'oracao', challenge_text: '🙏 Agradeça a Deus por cinco bênçãos específicas de hoje.', motivational_quote: 'Bendize, ó minha alma, ao Senhor. — Salmos 103:2', difficulty_level: 'facil', points_reward: 10 },
  { category: 'quiz', challenge_text: '🧠 Acerte pelo menos 5 perguntas no Quiz Bíblico.', motivational_quote: 'O temor do Senhor é o princípio da sabedoria. — Provérbios 9:10', difficulty_level: 'medio', points_reward: 15 },
  { category: 'gratidao', challenge_text: '🌻 Agradeça pessoalmente a alguém que abençoou sua vida.', motivational_quote: 'A gratidão transforma o coração.', difficulty_level: 'facil', points_reward: 10 },
  { category: 'leitura', challenge_text: '📖 Leia 5 versículos consecutivos e escreva uma breve reflexão.', motivational_quote: 'Medita nestas coisas. — 1 Timóteo 4:15', difficulty_level: 'facil', points_reward: 10 },
  { category: 'oracao', challenge_text: '🙏 Ore pela sua igreja e pelos seus líderes.', motivational_quote: 'Orai uns pelos outros. — Tiago 5:16', difficulty_level: 'facil', points_reward: 10 },
  { category: 'comunidade', challenge_text: '🙏 Interceda por um pedido de oração de outro irmão hoje.', motivational_quote: 'Levai as cargas uns dos outros. — Gálatas 6:2', difficulty_level: 'facil', points_reward: 15 },
  { category: 'caca_palavras', challenge_text: '🔍 Complete um caça-palavras sobre os Evangelhos.', motivational_quote: 'As tuas palavras foram achadas, e eu as comi. — Jeremias 15:16', difficulty_level: 'medio', points_reward: 15 },
  { category: 'evangelismo', challenge_text: '✝️ Convide um amigo para conhecer a plataforma Aliança.', motivational_quote: 'Vinde, e vede. — João 1:39', difficulty_level: 'medio', points_reward: 20 },
  { category: 'leitura', challenge_text: '📖 Leia um capítulo dos Evangelhos e imagine a cena.', motivational_quote: 'E o Verbo se fez carne. — João 1:14', difficulty_level: 'facil', points_reward: 10 },
  { category: 'oracao', challenge_text: '🙏 Ore pelos missionários que levam a Palavra pelo mundo.', motivational_quote: 'Rogai ao Senhor da seara. — Mateus 9:38', difficulty_level: 'facil', points_reward: 10 },
  { category: 'estudo', challenge_text: '📚 Leia um devocional e aplique a sugestão prática dele hoje.', motivational_quote: 'Sede cumpridores da palavra. — Tiago 1:22', difficulty_level: 'facil', points_reward: 10 },
  { category: 'comunidade', challenge_text: '🌱 Dê boas-vindas a um novo membro ou dê Amém em 3 publicações.', motivational_quote: 'Recebei-vos uns aos outros. — Romanos 15:7', difficulty_level: 'facil', points_reward: 10 },
  { category: 'oracao', challenge_text: '🙏 Ore por alguém que ainda não conhece Jesus.', motivational_quote: 'Não quer que nenhum se perca. — 2 Pedro 3:9', difficulty_level: 'facil', points_reward: 10 },
  { category: 'leitura', challenge_text: '📖 Leia Filipenses 4 e escolha um versículo para decorar.', motivational_quote: 'Tudo posso naquele que me fortalece. — Filipenses 4:13', difficulty_level: 'medio', points_reward: 15 },
  { category: 'gratidao', challenge_text: '🌻 Compartilhe no Feed um versículo que fortaleceu sua fé.', motivational_quote: 'Fortalecei-vos no Senhor. — Efésios 6:10', difficulty_level: 'facil', points_reward: 10 },
  { category: 'quiz', challenge_text: '🧠 Complete um quiz sobre as Parábolas de Jesus.', motivational_quote: 'Quem tem ouvidos para ouvir, ouça. — Mateus 13:9', difficulty_level: 'medio', points_reward: 15 },
  { category: 'oracao', challenge_text: '🙏 Faça uma pausa no meio do dia para uma oração de gratidão.', motivational_quote: 'Orai sem cessar. — 1 Tessalonicenses 5:17', difficulty_level: 'facil', points_reward: 10 },
  { category: 'evangelismo', challenge_text: '✝️ Escreva uma mensagem de esperança para alguém que está passando por dificuldades.', motivational_quote: 'Consolai-vos uns aos outros. — 1 Tessalonicenses 4:18', difficulty_level: 'medio', points_reward: 15 },
  { category: 'leitura', challenge_text: '📖 Leia o Salmo 91 em voz alta, declarando cada promessa.', motivational_quote: 'Direi do Senhor: Ele é o meu refúgio. — Salmos 91:2', difficulty_level: 'facil', points_reward: 10 },
  { category: 'igreja', challenge_text: '⛪ Participe (ou registre seu dia) de uma campanha da sua comunidade.', motivational_quote: 'Melhor é serem dois do que um. — Eclesiastes 4:9', difficulty_level: 'medio', points_reward: 15 },
  { category: 'leitura', challenge_text: '📖 Entre em uma Leitura Compartilhada ou crie uma sala para ler com amigos.', motivational_quote: 'Onde dois ou três estiverem reunidos... — Mateus 18:20', difficulty_level: 'medio', points_reward: 20 },
];

/** Frases de incentivo exibidas ao concluir (rotacionam a cada conclusão) */
export const COMPLETION_MESSAGES = [
  'Que a Palavra continue iluminando seus passos! 🕯️',
  'Continue firme na caminhada! 🌿',
  'Cada dia na presença de Deus fortalece sua fé. ✨',
  'Você está construindo um hábito precioso. 🏗️',
  'O céu celebra sua constância! 🎉',
  'Um passo de cada vez, sempre mais perto de Deus. 👣',
  'Sua dedicação inspira outros irmãos! 💛',
  'A semente plantada hoje dará frutos. 🌱',
];

/** Links por categoria para levar o usuário direto à ação */
export const CATEGORY_LINKS: Record<string, { path: string; label: string }> = {
  leitura: { path: '/bible', label: 'Abrir a Bíblia' },
  oracao: { path: '/prayers?from=challenge', label: 'Ir para Orações' },
  quiz: { path: '/quiz', label: 'Ir para o Quiz' },
  caca_palavras: { path: '/palavra-viva', label: 'Ir para o Caça-Palavras' },
  estudo: { path: '/studies', label: 'Ir para Estudos' },
  comunidade: { path: '/church-community', label: 'Ir para a Comunidade' },
  gratidao: { path: '/gratitude', label: 'Ir para o Mural da Gratidão' },
  evangelismo: { path: '/feed', label: 'Ir para o Feed' },
  igreja: { path: '/church-community', label: 'Ir para a Comunidade' },
  compartilhar: { path: '/feed', label: 'Ir para o Feed' },
};

/** Escolhe o desafio do dia de forma determinística (mesmo para todos) */
export function pickChallengeForDate(dateISO: string): BankChallenge {
  // dias desde a época ÷ ciclo do banco — dias consecutivos nunca repetem
  const dayNumber = Math.floor(new Date(`${dateISO}T00:00:00`).getTime() / 86_400_000);
  return CHALLENGE_BANK[dayNumber % CHALLENGE_BANK.length];
}
