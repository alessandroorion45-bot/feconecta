import { Helmet } from "react-helmet-async";
import { buildTitle, buildCanonical, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE, TWITTER_HANDLE } from "@/lib/seo";

interface SEOProps {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  keywords?: string;
}

/** Título/descrição/canonical/OG/Twitter por página — uso: <SEO path="/bible" title="Bíblia Online" description="..." /> */
const SEO = ({ title, description = SITE_DESCRIPTION, path, image = DEFAULT_OG_IMAGE, type = "website", noindex, keywords }: SEOProps) => {
  const fullTitle = buildTitle(title);
  const canonical = buildCanonical(path);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
