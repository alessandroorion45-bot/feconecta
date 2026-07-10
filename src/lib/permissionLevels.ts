/**
 * Sistema de Permissões — 8 Níveis (Fase 13).
 *
 * Em vez de criar um modelo de papéis paralelo (o que exigiria reescrever
 * todas as políticas de RLS já em produção), cada nível mapeia para um
 * valor de `church_community_members.role` que já é reconhecido em TODAS
 * as políticas de liderança criadas nas fases anteriores (Células,
 * Atividades, Calendário, Desafios, Campanhas, Mural). Isso torna a
 * atribuição "real" — dá permissão de fato no banco — sem quebrar nada
 * que já existe.
 */

export interface PermissionLevel {
  level: number; // 8 = mais alto
  value: string; // valor salvo em church_community_members.role
  label: string;
  emoji: string;
  description: string;
}

export const PERMISSION_LEVELS: PermissionLevel[] = [
  { level: 8, value: "admin", label: "Administrador", emoji: "👑", description: "Controle total da comunidade, inclusive configurações e exclusão." },
  { level: 7, value: "pastor", label: "Pastor", emoji: "📖", description: "Publica Palavra da Semana, modera o mural, cria campanhas, células, eventos e atividades." },
  { level: 6, value: "presbitero", label: "Supervisor", emoji: "🧭", description: "Supervisiona células e ministérios; cria/edita células, eventos, campanhas e atividades." },
  { level: 5, value: "lider_geral", label: "Líder", emoji: "⭐", description: "Lidera células e ministérios; cria conteúdo e gerencia papéis de outros membros." },
  { level: 4, value: "moderador", label: "Vice-líder", emoji: "🛡️", description: "Apoia a liderança; pode criar/editar células, eventos, campanhas e atividades." },
  { level: 3, value: "professor_ebd", label: "Professor", emoji: "📚", description: "Cria Atividades Bíblicas (quiz) e conteúdo de ensino." },
  { level: 2, value: "member", label: "Membro", emoji: "👤", description: "Participa de tudo: mural, células, atividades, eventos e votações." },
  { level: 1, value: "visitor", label: "Visitante", emoji: "🚪", description: "Ainda não é membro efetivo — participa do mural e pode ser convidado a entrar numa célula." },
];

export const PERMISSION_LEVEL_BY_VALUE = Object.fromEntries(PERMISSION_LEVELS.map(p => [p.value, p]));

export function getPermissionLevel(role: string | null | undefined): PermissionLevel {
  return PERMISSION_LEVEL_BY_VALUE[role || "member"] || PERMISSION_LEVEL_BY_VALUE.member;
}

/** true se o papel atual tem nível >= ao papel mínimo exigido. */
export function hasPermissionLevel(role: string | null | undefined, minRoleValue: string): boolean {
  return getPermissionLevel(role).level >= getPermissionLevel(minRoleValue).level;
}
