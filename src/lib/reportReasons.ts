// Taxonomia única de motivo de denúncia — usada em todo lugar que tem
// botão "Denunciar" (feed, orações, depoimentos, comentários, respostas,
// perfil) e no painel admin. Antes cada tela tinha sua própria lista
// divergente — o admin via texto cru sem tradução pra denúncias vindas
// de alguns lugares.
export const REPORT_REASONS: { key: string; label: string }[] = [
  { key: "spam", label: "Spam" },
  { key: "offensive_content", label: "Conteúdo ofensivo" },
  { key: "hate_speech", label: "Discurso de ódio" },
  { key: "sexual_content", label: "Conteúdo sexual" },
  { key: "violence", label: "Violência" },
  { key: "fake_news", label: "Fake News" },
  { key: "scam", label: "Golpe" },
  { key: "harassment", label: "Assédio" },
  { key: "fake_profile", label: "Perfil falso" },
  { key: "community_violation", label: "Violação dos princípios da comunidade" },
  { key: "other", label: "Outro" },
];

// Chaves antigas (de antes da unificação) que ainda podem existir em
// denúncias já registradas no banco — mantidas só pra tradução no
// painel admin, não oferecidas mais como opção pra denunciar de novo.
const LEGACY_REASON_LABELS: Record<string, string> = {
  inappropriate: "Conteúdo ofensivo",
  inappropriate_language: "Conteúdo ofensivo",
  nudity: "Conteúdo sexual",
  religious_attack: "Violação dos princípios da comunidade",
};

export function getReportReasonLabel(key: string): string {
  return REPORT_REASONS.find((r) => r.key === key)?.label || LEGACY_REASON_LABELS[key] || key;
}
