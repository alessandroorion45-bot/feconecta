/**
 * Banco local de perguntas do Quiz Bíblico — fallback quando o banco
 * de dados estiver vazio ou indisponível. Garante que o quiz SEMPRE
 * inicia, mesmo antes do SQL ser aplicado.
 */

export interface LocalQuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  category: string;
  points: number;
  explanation?: string;
  bible_reference?: string;
}

export const QUIZ_FALLBACK: LocalQuizQuestion[] = [
  // Iniciante
  { id: 'local-1', question: 'Quem construiu a arca antes do dilúvio?', option_a: 'Moisés', option_b: 'Noé', option_c: 'Abraão', option_d: 'Davi', correct_answer: 'B', difficulty: 'iniciante', category: 'antigo_testamento', points: 10, explanation: 'Deus ordenou a Noé que construísse uma arca para salvar sua família e os animais do dilúvio.', bible_reference: 'Gênesis 6:14' },
  { id: 'local-2', question: 'Em que cidade Jesus nasceu?', option_a: 'Nazaré', option_b: 'Jerusalém', option_c: 'Belém', option_d: 'Cafarnaum', correct_answer: 'C', difficulty: 'iniciante', category: 'jesus', points: 10, explanation: 'Jesus nasceu em Belém da Judeia, cumprindo a profecia de Miqueias.', bible_reference: 'Mateus 2:1' },
  { id: 'local-3', question: 'Qual menino venceu o gigante Golias?', option_a: 'Salomão', option_b: 'Davi', option_c: 'Jônatas', option_d: 'Saul', correct_answer: 'B', difficulty: 'iniciante', category: 'antigo_testamento', points: 10, explanation: 'Davi venceu Golias com uma funda e uma pedra, confiando no Senhor.', bible_reference: '1 Samuel 17:45-50' },
  { id: 'local-4', question: 'Qual foi o primeiro milagre de Jesus?', option_a: 'Multiplicar pães', option_b: 'Andar sobre as águas', option_c: 'Transformar água em vinho', option_d: 'Curar um cego', correct_answer: 'C', difficulty: 'iniciante', category: 'jesus', points: 10, explanation: 'Nas bodas de Caná, Jesus transformou água em vinho — seu primeiro sinal.', bible_reference: 'João 2:1-11' },
  { id: 'local-5', question: 'Quem foi engolido por um grande peixe?', option_a: 'Jonas', option_b: 'Elias', option_c: 'Eliseu', option_d: 'Amós', correct_answer: 'A', difficulty: 'iniciante', category: 'profetas', points: 10, explanation: 'Jonas fugiu da ordem de Deus e ficou três dias no ventre do grande peixe.', bible_reference: 'Jonas 1:17' },
  // Profissional
  { id: 'local-6', question: 'Qual profeta foi levado ao céu num redemoinho?', option_a: 'Eliseu', option_b: 'Elias', option_c: 'Enoque', option_d: 'Isaías', correct_answer: 'B', difficulty: 'profissional', category: 'profetas', points: 20, explanation: 'Elias foi arrebatado num redemoinho, com um carro de fogo separando-o de Eliseu.', bible_reference: '2 Reis 2:11' },
  { id: 'local-7', question: 'Quem interpretou o sonho das vacas gordas e magras do faraó?', option_a: 'Moisés', option_b: 'Daniel', option_c: 'José', option_d: 'Jacó', correct_answer: 'C', difficulty: 'profissional', category: 'antigo_testamento', points: 20, explanation: 'José interpretou: sete anos de fartura seguidos de sete anos de fome.', bible_reference: 'Gênesis 41:25-30' },
  { id: 'local-8', question: 'O que aconteceu no dia de Pentecostes?', option_a: 'Jesus ressuscitou', option_b: 'O Espírito Santo desceu', option_c: 'Paulo se converteu', option_d: 'O templo foi destruído', correct_answer: 'B', difficulty: 'profissional', category: 'novo_testamento', points: 20, explanation: 'O Espírito Santo desceu como línguas de fogo e três mil pessoas se converteram.', bible_reference: 'Atos 2:1-4' },
  { id: 'local-9', question: 'Quem era o cobrador de impostos que subiu numa árvore para ver Jesus?', option_a: 'Mateus', option_b: 'Zaqueu', option_c: 'Nicodemos', option_d: 'Bartimeu', correct_answer: 'B', difficulty: 'profissional', category: 'evangelhos', points: 20, explanation: 'Zaqueu subiu num sicômoro; Jesus se hospedou em sua casa e ele se converteu.', bible_reference: 'Lucas 19:1-10' },
  // Especialista
  { id: 'local-10', question: 'Qual profeta viu um vale de ossos secos revivendo?', option_a: 'Isaías', option_b: 'Jeremias', option_c: 'Ezequiel', option_d: 'Daniel', correct_answer: 'C', difficulty: 'especialista', category: 'profetas', points: 30, explanation: 'Ezequiel profetizou aos ossos secos, figura da restauração de Israel.', bible_reference: 'Ezequiel 37:1-10' },
  { id: 'local-11', question: 'Em qual ilha João recebeu o Apocalipse?', option_a: 'Creta', option_b: 'Chipre', option_c: 'Patmos', option_d: 'Malta', correct_answer: 'C', difficulty: 'especialista', category: 'novo_testamento', points: 30, explanation: 'João estava exilado em Patmos quando recebeu as visões do Apocalipse.', bible_reference: 'Apocalipse 1:9' },
  { id: 'local-12', question: 'O que significa "Emanuel"?', option_a: 'Príncipe da Paz', option_b: 'Deus conosco', option_c: 'Salvador', option_d: 'Ungido', correct_answer: 'B', difficulty: 'especialista', category: 'jesus', points: 30, explanation: 'Emanuel, anunciado por Isaías e cumprido em Jesus, significa "Deus conosco".', bible_reference: 'Mateus 1:23' },
];
