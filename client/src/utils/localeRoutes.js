const SUPPORTED_LANGS = ["en", "zh"];

export function normalizeLanguage(lang) {
  const raw = String(lang || "").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  return "en";
}

export function isSupportedLanguage(lang) {
  return SUPPORTED_LANGS.includes(String(lang || "").toLowerCase());
}

export function stripLanguagePrefix(pathname = "/") {
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return safePath.replace(/^\/(?:en|zh)(?=\/|$)/, "") || "/";
}

export function withLanguagePrefix(lang, path = "/") {
  const normalizedLang = normalizeLanguage(lang);
  const safePath = stripLanguagePrefix(path);
  return `/${normalizedLang}${safePath === "/" ? "" : safePath}`;
}

export function swapLanguageInPath(pathname = "/", nextLang = "en") {
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLanguagePrefix(nextLang, safePath);
}
