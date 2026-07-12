/**
 * Config central de SEO. Trocar aqui também exige atualizar as URLs
 * fixas em index.html, public/robots.txt e public/sitemap.xml (não
 * são gerados a partir desta constante, é uma SPA sem build step de SEO).
 */
export const SITE_URL = "https://aliancakingdom.com.br";
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
