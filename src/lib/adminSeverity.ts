/**
 * Escala de 4 níveis (severidade/risco) usada em Automation.tsx
 * (palavras proibidas) e UsersEnhanced.tsx (pontuação de risco).
 * Aceita tanto os valores em inglês (low/medium/high/critical)
 * quanto em português (baixo/medio/alto/critico).
 */
export type SeverityLevel = "low" | "medium" | "high" | "critical" | "baixo" | "medio" | "alto" | "critico";

const NORMALIZE: Record<string, "low" | "medium" | "high" | "critical"> = {
  low: "low", baixo: "low",
  medium: "medium", medio: "medium",
  high: "high", alto: "high",
  critical: "critical", critico: "critical",
};

export const SEVERITY_CONFIG: Record<"low" | "medium" | "high" | "critical", {
  label: string;
  emoji: string;
  solidClassName: string; // fundo sólido colorido, texto branco
  outlineClassName: string; // borda + texto colorido, fundo transparente
}> = {
  low: {
    label: "Baixo",
    emoji: "🟢",
    solidClassName: "bg-blue-500 text-white",
    outlineClassName: "text-green-700 dark:text-green-400 border-green-300 dark:border-green-800",
  },
  medium: {
    label: "Médio",
    emoji: "🟡",
    solidClassName: "bg-yellow-500 text-white",
    outlineClassName: "text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800",
  },
  high: {
    label: "Alto",
    emoji: "🟠",
    solidClassName: "bg-orange-500 text-white",
    outlineClassName: "text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800",
  },
  critical: {
    label: "Crítico",
    emoji: "🔴",
    solidClassName: "bg-red-500 text-white",
    outlineClassName: "text-red-700 dark:text-red-400 border-red-300 dark:border-red-800",
  },
};

export function getSeverityConfig(level: string) {
  const normalized = NORMALIZE[level.toLowerCase()] || "low";
  return SEVERITY_CONFIG[normalized];
}
