import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home";
import GameRoom from "./pages/GameRoom";
import ShareRedirect from "./pages/ShareRedirect";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Footer from "./components/Footer";

export default function App() {
  const basename = import.meta.env.BASE_URL;
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update html lang attribute when language changes
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter basename={basename}>
      <GoogleAnalytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<GameRoom />} />
        <Route path="/share/:hash" element={<ShareRedirect />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
