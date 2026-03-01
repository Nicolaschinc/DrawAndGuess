import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Check } from 'lucide-react';
import styles from './LanguageSwitcher.module.scss';
import { normalizeLanguage, swapLanguageInPath } from '../utils/localeRoutes';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentLang = normalizeLanguage(i18n.language);

  const changeLanguage = (lang) => {
    const normalizedLang = normalizeLanguage(lang);
    i18n.changeLanguage(normalizedLang);
    const localizedPath = swapLanguageInPath(location.pathname, normalizedLang);
    navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true });
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={`${styles.switcherBtn} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Language"
        aria-label="Switch Language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe size={16} />
        <span className={styles.langCode}>
          {currentLang === 'zh' ? 'ZH' : 'EN'}
        </span>
      </button>

      <div className={`${styles.dropdown} ${isOpen ? styles.open : ''}`}>
        <button 
          className={`${styles.option} ${currentLang === 'zh' ? styles.selected : ''}`}
          onClick={() => changeLanguage('zh')}
        >
          <span>简体中文</span>
          {currentLang === 'zh' && <Check size={16} />}
        </button>
        <button 
          className={`${styles.option} ${currentLang === 'en' ? styles.selected : ''}`}
          onClick={() => changeLanguage('en')}
        >
          <span>English</span>
          {currentLang === 'en' && <Check size={16} />}
        </button>
      </div>
    </div>
  );
}
