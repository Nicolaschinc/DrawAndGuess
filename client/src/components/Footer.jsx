import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';
import { normalizeLanguage, withLanguagePrefix } from '../utils/localeRoutes';

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const year = new Date().getFullYear();
  const currentLang = normalizeLanguage(location.pathname.split('/')[1]);
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
        <Link to={aboutPath}>{t('static.about')}</Link>
        <Link to={privacyPath}>{t('static.privacy')}</Link>
        <Link to={contactPath}>{t('static.contactUs')}</Link>
      </div>
      <div className={styles.copyright}>
        &copy; {year} DrawAndGuess. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
