/**
 * Hierarquia da Comunidade da Igreja.
 * Papéis e permissões — o servidor valida via RLS (community_member_role),
 * este módulo controla o que a interface mostra.
 */

export interface CommunityRole {
  value: string;
  label: string;
  emoji: string;
}

export const COMMUNITY_ROLES: CommunityRole[] = [
  { value: 'admin', label: 'Administrador', emoji: '👑' },
  { value: 'pastor', label: 'Pastor', emoji: '📖' },
  { value: 'pastora', label: 'Pastora', emoji: '📖' },
  { value: 'lider_geral', label: 'Líder Geral', emoji: '⭐' },
  { value: 'presbitero', label: 'Presbítero', emoji: '🕊️' },
  { value: 'diacono', label: 'Diácono', emoji: '🤝' },
  { value: 'diaconisa', label: 'Diaconisa', emoji: '🤝' },
  { value: 'lider_ministerio', label: 'Líder de Ministério', emoji: '🎯' },
  { value: 'professor_ebd', label: 'Professor da Escola Bíblica', emoji: '📚' },
  { value: 'musico', label: 'Músico', emoji: '🎸' },
  { value: 'vocalista', label: 'Vocalista', emoji: '🎤' },
  { value: 'intercessor', label: 'Intercessor', emoji: '🙏' },
  { value: 'evangelista', label: 'Evangelista', emoji: '✝️' },
  { value: 'missionario', label: 'Missionário', emoji: '🌍' },
  { value: 'secretario', label: 'Secretário', emoji: '📋' },
  { value: 'moderador', label: 'Moderador', emoji: '🛡️' },
  { value: 'member', label: 'Membro', emoji: '👤' },
];

export const ROLE_BY_VALUE = Object.fromEntries(
  COMMUNITY_ROLES.map(r => [r.value, r])
) as Record<string, CommunityRole>;

export function getRoleInfo(role: string | null | undefined): CommunityRole {
  return ROLE_BY_VALUE[role || 'member'] || ROLE_BY_VALUE.member;
}

/** Papéis de liderança pastoral (Palavra da Semana, moderação do mural) */
const PASTORAL_ROLES = ['admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador'];

/** Papéis que podem iniciar campanhas espirituais */
const CAMPAIGN_ROLES = [...PASTORAL_ROLES, 'lider_ministerio', 'evangelista', 'missionario'];

/** Papéis que podem gerenciar membros (papéis, remoção) */
const MEMBER_MANAGER_ROLES = ['admin', 'pastor', 'pastora', 'lider_geral', 'secretario'];

export const canPostWordOfWeek = (role?: string | null) => PASTORAL_ROLES.includes(role || '');
export const canModerateMural = (role?: string | null) => PASTORAL_ROLES.includes(role || '');
export const canCreateCampaign = (role?: string | null) => CAMPAIGN_ROLES.includes(role || '');
export const canManageMembers = (role?: string | null) => MEMBER_MANAGER_ROLES.includes(role || '');

/** Tipos de publicação do mural */
export const MURAL_POST_TYPES = [
  { value: 'announcement', label: 'Aviso', emoji: '📢' },
  { value: 'prayer', label: 'Pedido de Oração', emoji: '🙏' },
  { value: 'testimony', label: 'Testemunho', emoji: '❤️' },
  { value: 'reflection', label: 'Reflexão', emoji: '💭' },
  { value: 'verse', label: 'Versículo', emoji: '📖' },
  { value: 'thanks', label: 'Agradecimento', emoji: '🌻' },
] as const;

export const POST_TYPE_BY_VALUE: Record<string, { label: string; emoji: string }> = {
  word_of_week: { label: 'Palavra da Semana', emoji: '✨' },
  ...Object.fromEntries(MURAL_POST_TYPES.map(t => [t.value, { label: t.label, emoji: t.emoji }])),
};

/** Modelos de campanha espiritual */
export const CAMPAIGN_PRESETS = [
  { type: 'oracao', name: '7 Dias de Oração', duration: 7, emoji: '🙏' },
  { type: 'leitura', name: '21 Dias de Leitura Bíblica', duration: 21, emoji: '📖' },
  { type: 'proposito', name: '40 Dias de Propósito', duration: 40, emoji: '🎯' },
  { type: 'jejum', name: 'Semana de Jejum', duration: 7, emoji: '🕊️' },
  { type: 'gratidao', name: '7 Dias de Gratidão', duration: 7, emoji: '🌻' },
  { type: 'evangelismo', name: 'Semana de Evangelismo', duration: 7, emoji: '✝️' },
  { type: 'evangelhos', name: 'Leitura dos Evangelhos', duration: 30, emoji: '📜' },
  { type: 'salmos', name: 'Leitura dos Salmos', duration: 30, emoji: '🎵' },
] as const;

export const CAMPAIGN_EMOJI: Record<string, string> = Object.fromEntries(
  CAMPAIGN_PRESETS.map(p => [p.type, p.emoji])
);
