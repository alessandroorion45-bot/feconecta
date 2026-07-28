/**
 * Gerador local de quiz bíblico (sem IA — custo zero).
 *
 * Gera o quiz da leitura compartilhada a partir dos próprios versículos
 * lidos. Vale para a Bíblia INTEIRA: nada é fixo por livro — tudo sai do
 * texto do trecho carregado. Regra de ouro: só cria uma pergunta quando a
 * resposta pode ser tirada do texto COM CERTEZA (nunca inventa). Se um tipo
 * não puder ser gerado com segurança para o trecho, ele é pulado.
 *
 * Tipos: completar o versículo, identificar o versículo, o que vem depois,
 * o que vem primeiro (ordem), quem falou (só com atribuição clara) e qual
 * palavra NÃO aparece na leitura.
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

const clean = (t: string) => t.replace(/[.,;:!?"'()“”…]/g, '').trim();
const firstWords = (text: string, n: number) => clean(text).split(/\s+/).slice(0, n).join(' ');

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

/** Monta uma questão de escolha entre 4 rótulos, dado o índice do correto */
function labelQuestion(question: string, labels: string[], correctLabel: string, explanation: string): QuizQuestion | null {
  const distractors = labels.filter(l => l !== correctLabel);
  if (distractors.length < 3) return null;
  const opts = shuffle([correctLabel, ...shuffle(distractors).slice(0, 3)]);
  return {
    question,
    options: { A: opts[0], B: opts[1], C: opts[2], D: opts[3] },
    correctAnswer: LETTERS[opts.indexOf(correctLabel)],
    explanation,
  };
}

// ── Tipo: complete o versículo ────────────────────────────────────────
function genComplete(usable: Verse[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const keywordByVerse = new Map<number, string>();
  usable.forEach(v => {
    const kw = pickKeyword(v.verse);
    if (kw) keywordByVerse.set(v.number, kw);
  });
  for (const v of shuffle(usable)) {
    const word = keywordByVerse.get(v.number);
    if (!word) continue;
    const distractors = [...keywordByVerse.entries()].filter(([n]) => n !== v.number).map(([, kw]) => kw);
    const built = buildOptions(word, distractors);
    if (!built) continue;
    out.push({
      question: `Complete o versículo ${v.number}: "${v.verse.replace(word, '_____')}"`,
      options: built.options,
      correctAnswer: built.correctAnswer,
      explanation: `O versículo ${v.number} diz: "${v.verse}"`,
    });
    if (out.length >= 2) break;
  }
  return out;
}

// ── Tipo: identifique o versículo ─────────────────────────────────────
function genIdentify(verses: Verse[], usable: Verse[]): QuizQuestion[] {
  if (verses.length < 4) return [];
  const out: QuizQuestion[] = [];
  const pool = usable.length >= 4 ? usable : verses;
  for (const v of shuffle(pool)) {
    const snippet = firstWords(v.verse, 10);
    const q = labelQuestion(
      `Qual versículo começa com: "${snippet}..."?`,
      verses.map(x => `Versículo ${x.number}`),
      `Versículo ${v.number}`,
      `Esse trecho está no versículo ${v.number}.`,
    );
    if (q) out.push(q);
    if (out.length >= 1) break;
  }
  return out;
}

// ── Tipo: o que vem depois (sequência) ────────────────────────────────
function genNext(verses: Verse[]): QuizQuestion[] {
  if (verses.length < 4) return [];
  const byNum = new Map(verses.map(v => [v.number, v]));
  const out: QuizQuestion[] = [];
  for (const v of shuffle(verses)) {
    const next = byNum.get(v.number + 1);
    if (!next) continue;
    const others = verses.filter(x => x.number !== v.number && x.number !== next.number);
    if (others.length < 3) continue;
    const correct = firstWords(next.verse, 8);
    const distractors = shuffle(others).slice(0, 3).map(x => firstWords(x.verse, 8));
    const built = buildOptions(correct, distractors);
    if (!built) continue;
    out.push({
      question: `Na leitura, logo depois de "${firstWords(v.verse, 7)}...", qual trecho vem em seguida?`,
      options: built.options,
      correctAnswer: built.correctAnswer,
      explanation: `Depois do versículo ${v.number} vem o ${next.number}: "${next.verse}"`,
    });
    if (out.length >= 1) break;
  }
  return out;
}

// ── Tipo: o que vem primeiro (ordem) ──────────────────────────────────
function genOrder(verses: Verse[]): QuizQuestion[] {
  if (verses.length < 4) return [];
  const chosen = shuffle(verses).slice(0, 4).sort((a, b) => a.number - b.number);
  const first = chosen[0];
  const labels = chosen.map(v => `"${firstWords(v.verse, 6)}..."`);
  const q = labelQuestion(
    'Qual destes trechos aparece PRIMEIRO na leitura?',
    labels,
    `"${firstWords(first.verse, 6)}..."`,
    `O versículo ${first.number} vem antes dos demais.`,
  );
  return q ? [q] : [];
}

// ── Tipo: quem falou (só com atribuição clara) ────────────────────────
const SPEECH_VERBS = 'disse|respondeu|falou|perguntou|clamou|bradou|declarou|exclamou|ordenou|replicou|tornou';
// "Fulano disse" (nome antes do verbo = sujeito, confiável em português)
const RE_NAME_BEFORE = new RegExp(`\\b([A-ZÀ-Ý][A-Za-zà-ÿÀ-Ý]{2,})\\s+(?:${SPEECH_VERBS})\\b`, 'g');
// "disse Deus" / "disse o SENHOR" (inversão verbo-sujeito) — NUNCA após "a "
const RE_VERB_BEFORE = new RegExp(`(?:${SPEECH_VERBS})\\s+(?:o\\s+)?([A-ZÀ-Ý][A-Za-zà-ÿÀ-Ý]{2,})\\b`, 'g');
const NOT_NAMES = new Set(['Então', 'Porque', 'Porquanto', 'Assim', 'Quando', 'Depois', 'Mas', 'Ora', 'Eis', 'Isto', 'Isso']);

function speakerOf(verse: string): string | null {
  for (const re of [RE_NAME_BEFORE, RE_VERB_BEFORE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(verse)) !== null) {
      const name = m[1];
      // evita "a Moisés" (destinatário) quando o padrão é verbo→nome
      if (re === RE_VERB_BEFORE) {
        const before = verse.slice(Math.max(0, m.index - 2), m.index);
        if (/a\s$/i.test(before)) continue;
      }
      if (!NOT_NAMES.has(name)) return name;
    }
  }
  return null;
}

function genWhoSaid(verses: Verse[]): QuizQuestion[] {
  const found: { v: Verse; name: string }[] = [];
  verses.forEach(v => {
    const name = speakerOf(v.verse);
    if (name) found.push({ v, name });
  });
  if (found.length === 0) return [];
  const allNames = [...new Set(found.map(f => f.name))];
  if (allNames.length < 4) return []; // precisa de 3 distratores reais do trecho
  const pick = shuffle(found)[0];
  const q = labelQuestion(
    `No versículo ${pick.v.number}, quem falou? "${firstWords(pick.v.verse, 12)}..."`,
    allNames,
    pick.name,
    `No versículo ${pick.v.number}, quem fala é ${pick.name}.`,
  );
  return q ? [q] : [];
}

// ── Tipo: qual palavra NÃO aparece na leitura ─────────────────────────
const WORD_POOL = [
  'luz', 'trevas', 'águas', 'terra', 'céu', 'monte', 'deserto', 'templo',
  'rei', 'profeta', 'anjo', 'servo', 'cordeiro', 'ovelhas', 'vinha', 'pão',
  'vinho', 'trigo', 'colheita', 'barco', 'tempestade', 'milagre', 'cura',
  'oração', 'sacrifício', 'aliança', 'justiça', 'misericórdia', 'glória',
  'coração', 'palavra', 'espírito', 'pecado', 'perdão', 'esperança',
  'sabedoria', 'discípulos', 'multidão', 'ressurreição', 'batismo',
];

function genOddWord(verses: Verse[]): QuizQuestion[] {
  const text = verses.map(v => v.verse.toLowerCase()).join(' ');
  const present = WORD_POOL.filter(w => text.includes(w.toLowerCase()));
  const absent = WORD_POOL.filter(w => !text.includes(w.toLowerCase()));
  if (present.length < 3 || absent.length < 1) return [];
  const correct = shuffle(absent)[0]; // a que NÃO aparece
  const distractors = shuffle(present).slice(0, 3);
  const opts = shuffle([correct, ...distractors]);
  return [{
    question: 'Qual destas palavras NÃO aparece nesta leitura?',
    options: { A: opts[0], B: opts[1], C: opts[2], D: opts[3] },
    correctAnswer: LETTERS[opts.indexOf(correct)],
    explanation: `As outras três aparecem no texto; "${correct}" não.`,
  }];
}

export function generateLocalQuiz(verses: Verse[], bookName: string, chapter: number): QuizQuestion[] {
  const usable = verses.filter(v => v.verse.split(/\s+/).length >= 8);

  // Junta candidatos de cada tipo (cada um só gera se der pra fazer com certeza)
  const buckets: QuizQuestion[][] = [
    genComplete(usable),
    genWhoSaid(verses),
    genNext(verses),
    genIdentify(verses, usable),
    genOrder(verses),
    genOddWord(verses),
  ];

  // Round-robin entre os tipos → variedade (não repete o mesmo tipo seguido)
  const questions: QuizQuestion[] = [];
  let added = true;
  while (added && questions.length < 5) {
    added = false;
    for (const b of buckets) {
      if (b.length && questions.length < 5) {
        questions.push(b.shift()!);
        added = true;
      }
    }
  }

  // Fallback só se o trecho for curtíssimo e nada pôde ser gerado
  if (questions.length === 0) {
    questions.push({
      question: `Qual é o tema central de ${bookName} ${chapter}?`,
      options: { A: 'Confiar em Deus', B: 'Amar ao próximo', C: 'Ter paciência', D: 'Buscar sabedoria' },
      correctAnswer: 'A',
      explanation: 'Confiar em Deus é um tema que atravessa toda a Escritura.',
    });
  }

  return questions.slice(0, 5);
}
