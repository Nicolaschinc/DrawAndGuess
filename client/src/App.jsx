import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home";
import GameRoom from "./pages/GameRoom";
import ShareRedirect from "./pages/ShareRedirect";
import GoogleAnalytics from "./components/GoogleAnalytics";

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
