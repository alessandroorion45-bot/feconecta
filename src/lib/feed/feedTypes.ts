/**
 * Tipos e constantes do Feed unificado.
 * O feed agrega conteúdo público de várias tabelas em uma única timeline.
 */

export type FeedItemType =
  | 'post'
  | 'prayer'
  | 'testimony'
  | 'gratitude'
  | 'question'
  | 'study'
  | 'devotional'
  | 'church'
  | 'community'
  | 'reading';

export interface FeedProfile {
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export interface FeedItem {
  /** Chave única global: `${type}:${id}` */
  key: string;
  type: FeedItemType;
  id: string;
  user_id: string | null;
  created_at: string;
  title: string | null;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  audio_url: string | null;
  category: string | null;
  /** Soma de curtidas/comentários/intercessões — usado no score de relevância */
  engagement: number;
  /** Rota interna para abrir o conteúdo original */
  link: string;
  profile: FeedProfile | null;
  /** Nome de autor quando não há profile (ex.: mural de gratidão) */
  author_name?: string | null;
  // Interações (apenas posts nativos têm like/comentário próprios)
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  /** Reação exclusiva do usuário atual (chave de PLATFORM_REACTIONS) */
  my_reaction?: string | null;
  /** Contagem de reações exclusivas por chave */
  reaction_counts?: Record<string, number>;
  saved_by_me?: boolean;
}

/** Reações exclusivas da plataforma (identidade própria, sem artes de terceiros) */
export const PLATFORM_REACTIONS = [
  { key: 'orei', emoji: '🙏', label: 'Orei por você' },
  { key: 'edificado', emoji: '❤️', label: 'Fui edificado' },
  { key: 'fiel', emoji: '✨', label: 'Deus é fiel' },
  { key: 'palavra', emoji: '📖', label: 'Palavra poderosa' },
  { key: 'paz', emoji: '🌿', label: 'Paz' },
  { key: 'esperanca', emoji: '🕊️', label: 'Esperança' },
  { key: 'inspirador', emoji: '🔥', label: 'Inspirador' },
  { key: 'gratidao', emoji: '💙', label: 'Gratidão' },
] as const;

export type PlatformReactionKey = (typeof PLATFORM_REACTIONS)[number]['key'];

export const REACTION_BY_KEY = Object.fromEntries(
  PLATFORM_REACTIONS.map(r => [r.key, r])
) as Record<string, (typeof PLATFORM_REACTIONS)[number]>;

/** Metadados visuais por tipo de item (usa componentes/tema existentes) */
export const FEED_TYPE_META: Record<FeedItemType, { label: string; emoji: string; badgeClass: string }> = {
  post: { label: 'Publicação', emoji: '💬', badgeClass: 'bg-primary/10 text-primary' },
  prayer: { label: 'Pedido de Oração', emoji: '🙏', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  testimony: { label: 'Testemunho', emoji: '❤️', badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  gratitude: { label: 'Gratidão', emoji: '🌻', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  question: { label: 'Pergunta Bíblica', emoji: '❓', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  study: { label: 'Estudo Bíblico', emoji: '📚', badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  devotional: { label: 'Devocional', emoji: '🌅', badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  church: { label: 'Igreja', emoji: '⛪', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  community: { label: 'Comunidade', emoji: '🏘️', badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  reading: { label: 'Leitura em Grupo', emoji: '📖', badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
};

export type FeedFilterKey = 'all' | 'friends' | FeedItemType;

export const FEED_FILTERS: { key: FeedFilterKey; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '🌐' },
  { key: 'friends', label: 'Amigos', emoji: '👥' },
  { key: 'post', label: 'Publicações', emoji: '💬' },
  { key: 'testimony', label: 'Testemunhos', emoji: '❤️' },
  { key: 'prayer', label: 'Orações', emoji: '🙏' },
  { key: 'gratitude', label: 'Gratidão', emoji: '🌻' },
  { key: 'study', label: 'Estudos', emoji: '📚' },
  { key: 'devotional', label: 'Devocionais', emoji: '🌅' },
  { key: 'question', label: 'Perguntas', emoji: '❓' },
  { key: 'church', label: 'Igrejas', emoji: '⛪' },
  { key: 'community', label: 'Comunidades', emoji: '🏘️' },
  { key: 'reading', label: 'Leituras', emoji: '📖' },
];
