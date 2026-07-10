export interface EventType {
  value: string;
  label: string;
  emoji: string;
}

export const EVENT_TYPES: EventType[] = [
  { value: "culto", label: "Culto", emoji: "⛪" },
  { value: "celula", label: "Célula", emoji: "🏠" },
  { value: "jejum", label: "Jejum", emoji: "🕊️" },
  { value: "campanha", label: "Campanha", emoji: "🔥" },
  { value: "batismo", label: "Batismo", emoji: "💧" },
  { value: "santa_ceia", label: "Santa Ceia", emoji: "🍇" },
  { value: "evangelismo", label: "Evangelismo", emoji: "✝️" },
  { value: "conferencia", label: "Conferência", emoji: "🎤" },
  { value: "congresso", label: "Congresso", emoji: "🏟️" },
  { value: "outro", label: "Outro", emoji: "📌" },
];

export const EVENT_TYPE_BY_VALUE = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));

export function getEventTypeInfo(type: string): EventType {
  return EVENT_TYPE_BY_VALUE[type] || { value: type, label: type, emoji: "📌" };
}

export const RSVP_OPTIONS: { value: "going" | "maybe" | "not_going"; label: string; emoji: string }[] = [
  { value: "going", label: "Vou participar", emoji: "✅" },
  { value: "maybe", label: "Talvez", emoji: "🤔" },
  { value: "not_going", label: "Não vou", emoji: "❌" },
];
