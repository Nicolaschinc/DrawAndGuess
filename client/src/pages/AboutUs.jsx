import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styles from './StaticPages.module.scss';
import SeoHead from '../components/SeoHead';
import StaticPageLayout from '../components/StaticPageLayout';

const AboutUs = () => {
  const { t } = useTranslation();
  const { lang } = useParams();

  return (
    <StaticPageLayout
      title={t('about.title')}
      intro={t('about.missionText')}
      summary={t('about.summary')}
    >
      <SeoHead
        lang={lang}
        title={`${t('about.title')} | Draw & Guess`}
        description={t('about.missionText')}
        path="/about"
      />
      <section className={styles.section}>
        <h2>{t('about.mission')}</h2>
        <p>{t('about.missionText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('about.story')}</h2>
        <p>{t('about.storyText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('about.team')}</h2>
        <p>{t('about.teamText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('about.roadmap')}</h2>
        <p>{t('about.roadmapText')}</p>
      </section>
    </StaticPageLayout>
  );
};

export default AboutUs;
