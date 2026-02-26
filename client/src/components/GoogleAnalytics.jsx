import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = 'G-NKJFMD0HGM';

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;

    // Initialize dataLayer and gtag function if not already present
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag("js", new Date());
      // Disable initial page view to avoid double counting with the route change effect
      gtag("config", GA_ID, { send_page_view: false });
    }

    // Load the GA script if not already present
    const scriptId = "ga-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);
    }
  }, []);

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
