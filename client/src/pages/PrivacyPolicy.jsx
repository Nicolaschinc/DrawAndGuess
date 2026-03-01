import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import styles from './StaticPages.module.scss';
import { withLanguagePrefix } from '../utils/localeRoutes';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
  const contactPath = withLanguagePrefix(lang, "/contact");

  return (
    <div className={styles.container}>
      <Link to={homePath} className={styles['back-link']}>
        ← {t('static.backHome')}
      </Link>
      <h1>{t('privacy.title')}</h1>
      <p className={styles.meta}>{t('privacy.lastUpdated')}</p>
      
      <section>
        <h2>{t('privacy.intro')}</h2>
        <p>{t('privacy.introText')}</p>
      </section>

      <section>
        <h2>{t('privacy.dataCollection')}</h2>
        <p>{t('privacy.dataCollectionText')}</p>
        <ul>
          <li>{t('privacy.dataPoint1')}</li>
          <li>{t('privacy.dataPoint2')}</li>
          <li>{t('privacy.dataPoint3')}</li>
          <li>{t('privacy.dataPoint4')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('privacy.dataUsage')}</h2>
        <p>{t('privacy.dataUsageText')}</p>
        <ul>
          <li>{t('privacy.dataUsagePoint1')}</li>
          <li>{t('privacy.dataUsagePoint2')}</li>
          <li>{t('privacy.dataUsagePoint3')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('privacy.cookies')}</h2>
        <p>{t('privacy.cookiesText')}</p>
      </section>

      <section>
        <h2>{t('privacy.thirdParty')}</h2>
        <p>{t('privacy.thirdPartyText')}</p>
        <ul>
          <li>{t('privacy.thirdPartyPoint1')}</li>
          <li>{t('privacy.thirdPartyPoint2')}</li>
          <li>{t('privacy.thirdPartyPoint3')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('privacy.retention')}</h2>
        <p>{t('privacy.retentionText')}</p>
      </section>

      <section>
        <h2>{t('privacy.rights')}</h2>
        <p>{t('privacy.rightsText')}</p>
      </section>

      <section>
        <h2>{t('privacy.contact')}</h2>
        <p>{t('privacy.contactText')} <Link to={contactPath}>{t('static.contactUs')}</Link>.</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
