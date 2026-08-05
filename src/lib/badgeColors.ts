/**
 * Cores dos selos por raridade — FONTE ÚNICA.
 *
 * O <UserBadge> aplica `color` como CLASSE junto de `bg-gradient-to-r` e
 * escreve o nome em branco. Três telas (perfil público, badges do autor no
 * feed e ranking) definiam essa cor como código hexadecimal ("#94a3b8"),
 * que o Tailwind ignora: sem `from-`/`to-` o gradiente não pinta nada e
 * sobrava texto branco em fundo claro — ilegível. Aqui ficam as classes
 * corretas, num lugar só, pra não divergirem de novo.
 */
export const RARITY_COLOR: Record<string, string> = {
  common: "from-slate-400 to-slate-500",
  uncommon: "from-emerald-400 to-emerald-600",
  rare: "from-sky-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-amber-600",
  mythic: "from-rose-400 to-rose-600",
  exclusive: "from-rose-400 to-rose-600",
};

export const rarityColor = (rarity?: string | null): string =>
  RARITY_COLOR[rarity || ""] || RARITY_COLOR.common;

export interface MappedBadge {
  badge_name: string;
  badge_icon: string;
  badge_color: string;
}

/** Converte linhas de user_badges (com join em badges) no formato do <UserBadge>. */
export const mapUserBadges = (rows: any[] | null | undefined): MappedBadge[] =>
  (rows || []).map((row) => ({
    badge_name: row.badges?.name || "",
    badge_icon: row.badges?.icon || "🏅",
    badge_color: rarityColor(row.badges?.rarity),
  }));
