import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = 'G-NKJFMD0HGM';

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;

    // Manually trigger page view on route change
    // This ensures accurate tracking in SPA environments
    if (window.gtag) {
      window.gtag("config", GA_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}
