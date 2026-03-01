export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  } else {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName}`, params);
    }
  }
};
