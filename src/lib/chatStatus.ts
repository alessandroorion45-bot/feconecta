// Status de presença no chat — persistido (não depende de um socket
// sempre conectado). "offline" é calculado: ou a pessoa escolheu
// manualmente, ou o heartbeat dela ficou velho demais.

export type ChatStatusValue = "disponivel" | "orando" | "servindo" | "ocupado" | "offline";

export interface ChatStatusConfig {
  value: ChatStatusValue;
  label: string;
  emoji: string;
  /** cor sólida pro dot (classe Tailwind) */
  dotClass: string;
  textClass: string;
}

export const CHAT_STATUSES: ChatStatusConfig[] = [
  { value: "disponivel", label: "Disponível", emoji: "🟢", dotClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
  { value: "orando", label: "Orando", emoji: "🙏", dotClass: "bg-violet-500", textClass: "text-violet-600 dark:text-violet-400" },
  { value: "servindo", label: "Servindo na obra", emoji: "⛪", dotClass: "bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
  { value: "ocupado", label: "Ocupado", emoji: "🔴", dotClass: "bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" },
  { value: "offline", label: "Offline", emoji: "⚪", dotClass: "bg-muted-foreground/40", textClass: "text-muted-foreground" },
];

export const CHAT_STATUS_MAP: Record<ChatStatusValue, ChatStatusConfig> =
  Object.fromEntries(CHAT_STATUSES.map((s) => [s.value, s])) as Record<ChatStatusValue, ChatStatusConfig>;

/** Status escolhíveis pelo próprio usuário (offline é implícito ao ficar inativo, mas também pode ser escolhido manualmente) */
export const SELECTABLE_STATUSES = CHAT_STATUSES;

/** Depois desse tempo sem heartbeat, a pessoa aparece offline mesmo sem ter escolhido isso */
export const HEARTBEAT_STALE_MS = 3 * 60 * 1000;
export const HEARTBEAT_INTERVAL_MS = 60 * 1000;

/** Calcula o status real a ser exibido: manual 'offline' OU heartbeat velho => offline */
export function effectiveChatStatus(
  chatStatus: string | null | undefined,
  lastActiveAt: string | null | undefined,
): ChatStatusValue {
  if (!chatStatus || chatStatus === "offline") return "offline";
  if (!lastActiveAt) return "offline";
  const age = Date.now() - new Date(lastActiveAt).getTime();
  if (age > HEARTBEAT_STALE_MS) return "offline";
  return (CHAT_STATUS_MAP[chatStatus as ChatStatusValue] ? (chatStatus as ChatStatusValue) : "disponivel");
}

export function chatStatusConfig(value: ChatStatusValue): ChatStatusConfig {
  return CHAT_STATUS_MAP[value] || CHAT_STATUS_MAP.offline;
}
