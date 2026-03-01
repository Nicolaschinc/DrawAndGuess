import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home";
import GameRoom from "./pages/GameRoom";
import ShareRedirect from "./pages/ShareRedirect";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Footer from "./components/Footer";
import {
  normalizeLanguage,
  stripLanguagePrefix,
  withLanguagePrefix,
} from "./utils/localeRoutes";

function RootLanguageRedirect() {
  const { i18n } = useTranslation();
  const preferredLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  return <Navigate to={withLanguagePrefix(preferredLang, "/")} replace />;
}

function LegacyPathRedirect() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const preferredLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const targetPath = withLanguagePrefix(preferredLang, location.pathname);

  return <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />;
}

function LanguageLayout() {
  const location = useLocation();
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const normalizedLang = normalizeLanguage(lang);

  useEffect(() => {
    if (normalizeLanguage(i18n.language) !== normalizedLang) {
      i18n.changeLanguage(normalizedLang);
    }
  }, [i18n, normalizedLang]);

  if (lang !== normalizedLang) {
    const suffix = stripLanguagePrefix(location.pathname);
    return <Navigate to={withLanguagePrefix(normalizedLang, suffix)} replace />;
  }

  return <Outlet />;
}

function LanguageFallbackRedirect() {
  const { lang } = useParams();
  return <Navigate to={withLanguagePrefix(lang, "/")} replace />;
}

export default function App() {
  const basename = import.meta.env.BASE_URL;
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update html lang attribute when language changes
    document.documentElement.lang = normalizeLanguage(i18n.language);
  }, [i18n.language]);

  return (
    <BrowserRouter basename={basename}>
      <GoogleAnalytics />
      <Routes>
        <Route path="/" element={<RootLanguageRedirect />} />

        <Route path="/:lang" element={<LanguageLayout />}>
          <Route index element={<Home />} />
          <Route path="room/:roomId" element={<GameRoom />} />
          <Route path="share/:hash" element={<ShareRedirect />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="*" element={<LanguageFallbackRedirect />} />
        </Route>

        <Route path="*" element={<LegacyPathRedirect />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
