/**
 * Config central de SEO. SITE_URL usa o domínio atual da Vercel —
 * troque só esta linha quando AliancaKingdom.com.br estiver
 * registrado e apontado pro projeto (afeta canonical, OG, sitemap.xml
 * e o JSON-LD do index.html, que precisa ser atualizado à mão).
 */
export const SITE_URL = "https://feconecta-69w6.vercel.app";
export const SITE_NAME = "Aliança Kingdom";
export const SITE_DESCRIPTION =
  "Aliança Kingdom é uma plataforma cristã completa para igrejas, líderes, células, comunidades, estudos bíblicos, pedidos de oração, eventos, discipulado, evangelismo e comunhão.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/alianca-logo.png`;
export const TWITTER_HANDLE = "@AliancaKingdom";

export function buildTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} — Plataforma Cristã Completa`;
}

export function buildCanonical(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
