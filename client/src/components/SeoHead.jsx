import { Helmet } from "react-helmet-async";
import { normalizeLanguage, withLanguagePrefix } from "../utils/localeRoutes";

const SITE_NAME = "Draw & Guess";
const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://playflowpulse.com/drawguess"
).replace(/\/$/, "");

function toAbsoluteUrl(path = "/") {
  if (!path || path === "/") {
    return SITE_URL;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

function getLocale(lang) {
  return normalizeLanguage(lang) === "zh" ? "zh_CN" : "en_US";
}

export default function SeoHead({
  lang = "en",
  title,
  description,
  path = "/",
  image = "/img/banner.png",
  noindex = false,
  type = "website",
  structuredData = [],
}) {
  const normalizedLang = normalizeLanguage(lang);
  const canonicalPath = withLanguagePrefix(normalizedLang, path);
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const imageUrl = toAbsoluteUrl(image);
  const enUrl = toAbsoluteUrl(withLanguagePrefix("en", path));
  const zhUrl = toAbsoluteUrl(withLanguagePrefix("zh", path));
  const xDefaultUrl = toAbsoluteUrl("/");
  const jsonLd = Array.isArray(structuredData)
    ? structuredData.filter(Boolean)
    : [structuredData].filter(Boolean);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="zh" href={zhUrl} />
      <link rel="alternate" hrefLang="x-default" href={xDefaultUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content={getLocale(normalizedLang)} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {jsonLd.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
