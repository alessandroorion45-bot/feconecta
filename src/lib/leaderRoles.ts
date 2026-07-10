/**
 * Funções de liderança da Comunidade da Igreja (aba "Líderes").
 * Cada função tem um nível hierárquico (1 = topo, 6 = apoio direto às células)
 * usado para montar o organograma automaticamente.
 */

export interface LeaderRoleOption {
  value: string;
  label: string;
  emoji: string;
  level: number;
}

export const LEADER_LEVELS: { level: number; label: string }[] = [
  { level: 1, label: "Pastorado Sênior" },
  { level: 2, label: "Pastorado Auxiliar" },
  { level: 3, label: "Presbitério e Supervisão" },
  { level: 4, label: "Diaconato e Administração" },
  { level: 5, label: "Líderes de Ministérios e Células" },
  { level: 6, label: "Apoio Direto" },
];

// `value` é o próprio texto salvo em church_leaders.role (sempre foi texto livre
// legível — mantém compatibilidade com registros antigos e com telas que exibem
// leader.role diretamente, como LeaderEvaluations).
export const LEADER_ROLES: LeaderRoleOption[] = [
  { value: "Pastor Presidente", label: "Pastor Presidente", emoji: "👑", level: 1 },
  { value: "Pastora Presidente", label: "Pastora Presidente", emoji: "👑", level: 1 },

  { value: "Pastor Auxiliar", label: "Pastor Auxiliar", emoji: "📖", level: 2 },
  { value: "Pastora Auxiliar", label: "Pastora Auxiliar", emoji: "📖", level: 2 },
  { value: "Vice-pastor", label: "Vice-pastor", emoji: "📖", level: 2 },
  { value: "Bispo", label: "Bispo", emoji: "⛪", level: 2 },

  { value: "Presbítero", label: "Presbítero", emoji: "🕊️", level: 3 },
  { value: "Supervisor de Células", label: "Supervisor de Células", emoji: "🧭", level: 3 },
  { value: "Coordenador de Ministério", label: "Coordenador de Ministério", emoji: "🎯", level: 3 },
  { value: "Evangelista", label: "Evangelista", emoji: "✝️", level: 3 },
  { value: "Missionário", label: "Missionário", emoji: "🌍", level: 3 },

  { value: "Diácono", label: "Diácono", emoji: "🤝", level: 4 },
  { value: "Diaconisa", label: "Diaconisa", emoji: "🤝", level: 4 },
  { value: "Secretário(a) Geral", label: "Secretário(a) Geral", emoji: "📋", level: 4 },
  { value: "Tesoureiro(a)", label: "Tesoureiro(a)", emoji: "💰", level: 4 },
  { value: "Conselheiro(a)", label: "Conselheiro(a)", emoji: "🕯️", level: 4 },

  { value: "Líder de Célula", label: "Líder de Célula", emoji: "🏠", level: 5 },
  { value: "Líder de Louvor", label: "Líder de Louvor", emoji: "🎸", level: 5 },
  { value: "Líder de Jovens", label: "Líder de Jovens", emoji: "🔥", level: 5 },
  { value: "Líder de Mulheres", label: "Líder de Mulheres", emoji: "💜", level: 5 },
  { value: "Líder de Homens", label: "Líder de Homens", emoji: "🛡️", level: 5 },
  { value: "Líder Infantil", label: "Líder Infantil", emoji: "🧸", level: 5 },
  { value: "Professor(a) da EBD", label: "Professor(a) da EBD", emoji: "📚", level: 5 },
  { value: "Líder de Mídia/Comunicação", label: "Líder de Mídia/Comunicação", emoji: "📡", level: 5 },

  { value: "Vice-líder de Célula", label: "Vice-líder de Célula", emoji: "🌱", level: 6 },
];

export const LEADER_ROLE_BY_VALUE = Object.fromEntries(LEADER_ROLES.map(r => [r.value, r]));

/** Aceita tanto os cargos da lista fixa quanto um cargo personalizado digitado livremente. */
export function getLeaderRoleInfo(role: string | null | undefined, hierarchyLevel?: number | null): LeaderRoleOption {
  const known = role ? LEADER_ROLE_BY_VALUE[role] : undefined;
  if (known) return known;
  return {
    value: role || "",
    label: role || "Líder",
    emoji: "⭐",
    level: hierarchyLevel && hierarchyLevel >= 1 && hierarchyLevel <= 6 ? hierarchyLevel : 5,
  };
}

export function getLeaderLevelLabel(level: number): string {
  return LEADER_LEVELS.find(l => l.level === level)?.label || "Liderança";
}
