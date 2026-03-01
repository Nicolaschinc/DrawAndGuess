import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import styles from './StaticPages.module.scss';
import { withLanguagePrefix } from '../utils/localeRoutes';

const AboutUs = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");

  return (
    <div className={styles.container}>
      <Link to={homePath} className={styles['back-link']}>
        ← {t('static.backHome')}
      </Link>
      <h1>{t('about.title')}</h1>
      
      <section>
        <h2>{t('about.mission')}</h2>
        <p>{t('about.missionText')}</p>
      </section>

      <section>
        <h2>{t('about.story')}</h2>
        <p>{t('about.storyText')}</p>
      </section>

      <section>
        <h2>{t('about.team')}</h2>
        <p>{t('about.teamText')}</p>
      </section>

      <section>
        <h2>{t('about.roadmap')}</h2>
        <p>{t('about.roadmapText')}</p>
      </section>
    </div>
  );
};

export default AboutUs;
