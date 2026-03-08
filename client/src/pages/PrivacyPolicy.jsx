import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styles from './StaticPages.module.scss';
import SeoHead from '../components/SeoHead';
import { withLanguagePrefix } from '../utils/localeRoutes';
import StaticPageLayout from '../components/StaticPageLayout';
import StaticPageLink from '../components/StaticPageLink';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const contactPath = withLanguagePrefix(lang, "/contact");

  return (
    <StaticPageLayout
      title={t('privacy.title')}
      intro={t('privacy.introText')}
      summary={t('privacy.summary')}
      metaItems={[
        { label: t('static.updatedLabel'), value: t('privacy.lastUpdatedValue') },
        { label: t('static.effectiveLabel'), value: t('privacy.effectiveDate') },
      ]}
    >
      <SeoHead
        lang={lang}
        title={`${t('privacy.title')} | Draw & Guess`}
        description={t('privacy.introText')}
        path="/privacy"
      />
      <section className={styles.section}>
        <h2>{t('privacy.intro')}</h2>
        <p>{t('privacy.introText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.dataCollection')}</h2>
        <p>{t('privacy.dataCollectionText')}</p>
        <ul>
          <li>{t('privacy.dataPoint1')}</li>
          <li>{t('privacy.dataPoint2')}</li>
          <li>{t('privacy.dataPoint3')}</li>
          <li>{t('privacy.dataPoint4')}</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.dataUsage')}</h2>
        <p>{t('privacy.dataUsageText')}</p>
        <ul>
          <li>{t('privacy.dataUsagePoint1')}</li>
          <li>{t('privacy.dataUsagePoint2')}</li>
          <li>{t('privacy.dataUsagePoint3')}</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.cookies')}</h2>
        <p>{t('privacy.cookiesText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.thirdParty')}</h2>
        <p>{t('privacy.thirdPartyText')}</p>
        <ul>
          <li>{t('privacy.thirdPartyPoint1')}</li>
          <li>{t('privacy.thirdPartyPoint2')}</li>
          <li>{t('privacy.thirdPartyPoint3')}</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.retention')}</h2>
        <p>{t('privacy.retentionText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.rights')}</h2>
        <p>{t('privacy.rightsText')}</p>
      </section>

      <section className={styles.section}>
        <h2>{t('privacy.contact')}</h2>
        <p>{t('privacy.contactText')} <StaticPageLink to={contactPath}>{t('static.contactUs')}</StaticPageLink>.</p>
      </section>
    </StaticPageLayout>
  );
};

export default PrivacyPolicy;
