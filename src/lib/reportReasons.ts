// Taxonomia única de motivo de denúncia — usada em todo lugar que tem
// botão "Denunciar" (feed, perfil, chat) e no painel admin. Antes cada
// tela tinha sua própria lista divergente (ReportUserModal, FeedItemCard,
// Reports.tsx todas com chaves diferentes) — o admin via texto cru sem
// tradução pra denúncias vindas de alguns lugares.
export const REPORT_REASONS: { key: string; label: string }[] = [
  { key: "spam", label: "Spam" },
  { key: "nudity", label: "Nudez" },
  { key: "violence", label: "Violência" },
  { key: "offensive_content", label: "Conteúdo Ofensivo" },
  { key: "fake_news", label: "Fake News" },
  { key: "scam", label: "Golpe" },
  { key: "harassment", label: "Assédio" },
  { key: "other", label: "Outro" },
];

// Chaves antigas (de antes da unificação) que ainda podem existir em
// denúncias já registradas no banco — mantidas só pra tradução no
// painel admin, não oferecidas mais como opção pra denunciar de novo.
const LEGACY_REASON_LABELS: Record<string, string> = {
  inappropriate: "Conteúdo Ofensivo",
  inappropriate_language: "Conteúdo Ofensivo",
  fake_profile: "Perfil Falso",
  hate_speech: "Assédio",
  religious_attack: "Ataque Religioso",
};

export function getReportReasonLabel(key: string): string {
  return REPORT_REASONS.find((r) => r.key === key)?.label || LEGACY_REASON_LABELS[key] || key;
}
