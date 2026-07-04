/**
 * Gerador local de quiz bíblico.
 *
 * Usado como fallback quando a Edge Function generate-quiz-questions
 * não está disponível: cria perguntas reais a partir dos próprios
 * versículos lidos (completar o versículo e identificar o versículo),
 * garantindo que a leitura compartilhada nunca trave no quiz.
 */

import type { QuizQuestion } from '@/hooks/useSharedReading';

interface Verse {
  number: number;
  verse: string;
}

const STOP_WORDS = new Set([
  'que', 'para', 'como', 'porque', 'sobre', 'então', 'também', 'quando',
  'entre', 'depois', 'antes', 'todos', 'todas', 'pelo', 'pela', 'seus',
  'suas', 'este', 'esta', 'isso', 'aquele', 'aquela', 'com', 'uma', 'dos',
  'das', 'não', 'mas', 'por', 'nos', 'nas', 'aos', 'às', 'ele', 'ela',
  'eles', 'elas', 'seu', 'sua', 'lhe', 'lhes', 'senhor', 'deus',
]);

const LETTERS = ['A', 'B', 'C', 'D'] as const;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Palavra mais significativa do versículo (para "complete o versículo") */
function pickKeyword(text: string): string | null {
  const words = text.replace(/[.,;:!?"'()“”]/g, '').split(/\s+/);
  const candidates = words.filter(w => w.length >= 5 && !STOP_WORDS.has(w.toLowerCase()));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

function buildOptions(correct: string, distractors: string[]): { options: QuizQuestion['options']; correctAnswer: string } | null {
  const unique = [...new Set(distractors.filter(d => d.toLowerCase() !== correct.toLowerCase()))];
  if (unique.length < 3) return null;
  const opts = shuffle([correct, ...shuffle(unique).slice(0, 3)]);
  return {
    options: { A: opts[0], B: opts[1], C: opts[2], D: opts[3] },
    correctAnswer: LETTERS[opts.indexOf(correct)],
  };
}

export function generateLocalQuiz(verses: Verse[], bookName: string, chapter: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usable = verses.filter(v => v.verse.split(/\s+/).length >= 8);

  // Tipo 1: complete o versículo (até 3 perguntas)
  const keywordByVerse = new Map<number, string>();
  usable.forEach(v => {
    const kw = pickKeyword(v.verse);
    if (kw) keywordByVerse.set(v.number, kw);
  });

  for (const v of shuffle(usable).slice(0, 4)) {
    if (questions.length >= 3) break;
    const word = keywordByVerse.get(v.number);
    if (!word) continue;

    const distractors = [...keywordByVerse.entries()]
      .filter(([num]) => num !== v.number)
      .map(([, kw]) => kw);

    const built = buildOptions(word, distractors);
    if (!built) continue;

    questions.push({
      question: `Complete o versículo ${v.number}: "${v.verse.replace(word, '_____')}"`,
      options: built.options,
      correctAnswer: built.correctAnswer,
      explanation: `O versículo ${v.number} diz: "${v.verse}"`,
    });
  }

  // Tipo 2: identifique o versículo (até 2 perguntas, precisa de 4+ versículos)
  if (verses.length >= 4) {
    for (const v of shuffle(usable.length >= 4 ? usable : verses).slice(0, 2)) {
      const snippet = v.verse.split(/\s+/).slice(0, 10).join(' ');
      const otherNumbers = shuffle(verses.map(x => x.number).filter(n => n !== v.number)).slice(0, 3);
      if (otherNumbers.length < 3) break;
      const opts = shuffle([v.number, ...otherNumbers]);
      questions.push({
        question: `Qual versículo começa com: "${snippet}..."?`,
        options: {
          A: `Versículo ${opts[0]}`,
          B: `Versículo ${opts[1]}`,
          C: `Versículo ${opts[2]}`,
          D: `Versículo ${opts[3]}`,
        },
        correctAnswer: LETTERS[opts.indexOf(v.number)],
        explanation: `Esse trecho está no versículo ${v.number}.`,
      });
    }
  }

  // Garantia mínima: pergunta de reflexão genérica se faltarem perguntas
  if (questions.length === 0) {
    questions.push({
      question: `Qual é a mensagem central de ${bookName} ${chapter}?`,
      options: {
        A: 'Confiar em Deus',
        B: 'Amar ao próximo',
        C: 'Ter paciência',
        D: 'Buscar sabedoria',
      },
      correctAnswer: 'A',
      explanation: 'Confiar em Deus é um tema central em toda a Escritura.',
    });
  }

  return shuffle(questions).slice(0, 5);
}
