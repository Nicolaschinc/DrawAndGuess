import React from "react";
import i18next from "i18next";
import { renderToString } from "react-dom/server";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { MemoryRouter, Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import Footer from "./components/Footer";
import { i18nResources } from "./i18nResources";
import {
  normalizeLanguage,
  stripLanguagePrefix,
  withLanguagePrefix,
} from "./utils/localeRoutes";

function RootLanguageRedirect({ lang = "en" }) {
  return <Navigate to={withLanguagePrefix(lang, "/")} replace />;
}

function LanguageLayout() {
  const { lang } = useParams();
  const normalizedLang = normalizeLanguage(lang);

  if (lang !== normalizedLang) {
    const suffix = stripLanguagePrefix(`/${lang || ""}`);
    return <Navigate to={withLanguagePrefix(normalizedLang, suffix)} replace />;
  }

  return <Outlet />;
}

function LanguageFallbackRedirect() {
  const { lang } = useParams();
  return <Navigate to={withLanguagePrefix(lang, "/")} replace />;
}

function PrerenderApp({ defaultLang = "en" }) {
  const { i18n } = useTranslation();

  return (
    <>
      <Helmet>
        <html lang={normalizeLanguage(i18n.language)} />
      </Helmet>
      <Routes>
        <Route path="/" element={<RootLanguageRedirect lang={defaultLang} />} />
        <Route path="/:lang" element={<LanguageLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="*" element={<LanguageFallbackRedirect />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}

async function createServerI18n(lang) {
  const instance = i18next.createInstance();

  await instance.use(initReactI18next).init({
    resources: i18nResources,
    lng: normalizeLanguage(lang),
    fallbackLng: "en",
    load: "languageOnly",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

  return instance;
}

export async function render(url) {
  const rawBase = import.meta.env.VITE_ROUTER_BASE || import.meta.env.BASE_URL || "/";
  const normalizedBase = rawBase === "." || rawBase === "./" ? "/" : rawBase;
  const basename = normalizedBase.startsWith("/") ? normalizedBase.replace(/\/$/, "") || "/" : `/${normalizedBase.replace(/\/$/, "")}`;
  const pathWithoutBase =
    basename !== "/" && url.startsWith(basename) ? url.slice(basename.length) || "/" : url;
  const defaultLang = normalizeLanguage(pathWithoutBase.split("/")[1]);
  const i18n = await createServerI18n(defaultLang);
  const helmetContext = {};

  const appHtml = renderToString(
    <I18nextProvider i18n={i18n}>
      <HelmetProvider context={helmetContext}>
        <MemoryRouter basename={basename === "/" ? undefined : basename} initialEntries={[url]}>
          <PrerenderApp defaultLang={defaultLang} />
        </MemoryRouter>
      </HelmetProvider>
    </I18nextProvider>
  );

  return {
    appHtml,
    helmet: helmetContext.helmet,
  };
}
