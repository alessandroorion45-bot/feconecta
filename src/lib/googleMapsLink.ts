// Validação e embed de links do Google Maps colados pelo usuário
// (maps.google.com, goo.gl/maps, maps.app.goo.gl).
const VALID_PATTERNS = [
  /^https:\/\/(www\.)?maps\.google\.com\//i,
  /^https:\/\/goo\.gl\/maps\//i,
  /^https:\/\/maps\.app\.goo\.gl\//i,
  /^https:\/\/(www\.)?google\.com\/maps/i,
];

export function isValidGoogleMapsLink(link: string): boolean {
  const trimmed = link.trim();
  if (!trimmed) return false;
  return VALID_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Só links "longos" (maps.google.com/... ou google.com/maps/...) aceitam o
 * truque `output=embed` sem chave de API. Links curtos (goo.gl/maps,
 * maps.app.goo.gl) redirecionam e o Google bloqueia o iframe por política
 * de frame-ancestors — nesses casos não dá pra embutir mini-mapa, só o
 * botão "Ver localização" funciona.
 */
export function getEmbeddableMapsUrl(link: string): string | null {
  const trimmed = link.trim();
  const isLongLink = /^https:\/\/(www\.)?(maps\.google\.com|google\.com\/maps)/i.test(trimmed);
  if (!isLongLink) return null;
  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}output=embed`;
}
