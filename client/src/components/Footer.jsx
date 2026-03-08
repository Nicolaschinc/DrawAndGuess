import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';
import { normalizeLanguage, withLanguagePrefix } from '../utils/localeRoutes';
import StaticPageLink from './StaticPageLink';

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const year = new Date().getFullYear();
  const currentLang = normalizeLanguage(location.pathname.split('/')[1]);
  const featuresPath = withLanguagePrefix(currentLang, "/features");
  const useCasesPath = withLanguagePrefix(currentLang, "/use-cases");
  const faqPath = withLanguagePrefix(currentLang, "/faq");
  const aboutPath = withLanguagePrefix(currentLang, "/about");
  const privacyPath = withLanguagePrefix(currentLang, "/privacy");
  const contactPath = withLanguagePrefix(currentLang, "/contact");

  // Don't show footer in game room
  if (/^\/(?:en|zh)\/room\//.test(location.pathname) || location.pathname.startsWith('/room/')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <StaticPageLink to={featuresPath}>{t('static.features')}</StaticPageLink>
        <StaticPageLink to={useCasesPath}>{t('static.useCases')}</StaticPageLink>
        <StaticPageLink to={faqPath}>{t('static.faq')}</StaticPageLink>
        <StaticPageLink to={aboutPath}>{t('static.about')}</StaticPageLink>
        <StaticPageLink to={privacyPath}>{t('static.privacy')}</StaticPageLink>
        <StaticPageLink to={contactPath}>{t('static.contactUs')}</StaticPageLink>
      </div>
      <div className={styles.copyright}>
        &copy; {year} DrawAndGuess. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
