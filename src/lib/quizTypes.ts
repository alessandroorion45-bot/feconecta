export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "complete_verse"
  | "chronological_order"
  | "association"
  | "discursive";

export const QUESTION_TYPES: { value: QuestionType; label: string; emoji: string }[] = [
  { value: "multiple_choice", label: "Múltipla escolha", emoji: "🔘" },
  { value: "true_false", label: "Certo ou Errado", emoji: "✅" },
  { value: "complete_verse", label: "Complete o versículo", emoji: "📖" },
  { value: "chronological_order", label: "Ordem cronológica", emoji: "🔢" },
  { value: "association", label: "Associação", emoji: "🔗" },
  { value: "discursive", label: "Discursiva", emoji: "✍️" },
];

export const QUESTION_TYPE_LABEL: Record<QuestionType, { label: string; emoji: string }> = Object.fromEntries(
  QUESTION_TYPES.map(t => [t.value, { label: t.label, emoji: t.emoji }])
) as Record<QuestionType, { label: string; emoji: string }>;

export const TIMER_OPTIONS = [
  { value: 0, label: "Sem tempo limite" },
  { value: 5, label: "5 minutos" },
  { value: 10, label: "10 minutos" },
  { value: 20, label: "20 minutos" },
];

export const QUESTION_COUNT_PRESETS = [5, 10, 15, 20];

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  order_index: number;
  type: QuestionType;
  question_text: string;
  options: any;
  correct_answer: any;
  points: number;
}

/** Embaralha mantendo o índice original de cada item (Fisher-Yates). */
export function shuffleWithOriginalIndex<T>(items: T[]): { item: T; originalIndex: number }[] {
  const arr = items.map((item, originalIndex) => ({ item, originalIndex }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Corrige a resposta de UMA pergunta. Retorna null para discursivas (não corrigidas automaticamente). */
export function gradeAnswer(question: QuizQuestion, answer: any): boolean | null {
  switch (question.type) {
    case "multiple_choice":
      return answer === question.correct_answer?.correct_index;
    case "true_false":
      return answer === question.correct_answer?.correct_bool;
    case "complete_verse": {
      const expected = (question.correct_answer?.answer || "").toString().trim().toLowerCase();
      const given = (answer || "").toString().trim().toLowerCase();
      return expected.length > 0 && given === expected;
    }
    case "chronological_order": {
      const expected: number[] = question.correct_answer?.order || [];
      if (!Array.isArray(answer) || answer.length !== expected.length) return false;
      return expected.every((v, i) => v === answer[i]);
    }
    case "association": {
      const expected: number[] = question.correct_answer?.mapping || [];
      if (!Array.isArray(answer) || answer.length !== expected.length) return false;
      return expected.every((v, i) => v === answer[i]);
    }
    case "discursive":
      return null;
    default:
      return false;
  }
}
