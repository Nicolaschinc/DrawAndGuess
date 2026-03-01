import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const year = new Date().getFullYear();

  // Don't show footer in game room
  if (location.pathname.startsWith('/room/')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link to="/about">{t('static.about')}</Link>
        <Link to="/privacy">{t('static.privacy')}</Link>
        <Link to="/contact">{t('static.contactUs')}</Link>
      </div>
      <div className={styles.copyright}>
        &copy; {year} DrawAndGuess. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
