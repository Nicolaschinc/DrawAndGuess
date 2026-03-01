import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './StaticPages.module.scss';

const ContactUs = () => {
  const { t } = useTranslation();
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@game2048.xyz';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = formData.subject.trim() || t('contact.defaultSubject');
    const lines = [
      `${t('contact.name')}: ${formData.name}`,
      `${t('contact.email')}: ${formData.email}`,
      '',
      formData.message
    ];

    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = mailto;
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles['back-link']}>
        ← {t('static.backHome')}
      </Link>
      <h1>{t('contact.title')}</h1>
      <p>{t('contact.intro')}</p>

      <section>
        <h2>{t('contact.directTitle')}</h2>
        <p>
          {t('contact.directText')}{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
        <p className={styles.meta}>{t('contact.responseTime')}</p>
      </section>

      <section>
        <h2>{t('contact.formTitle')}</h2>
        <form className={styles['contact-form']} onSubmit={handleSubmit}>
          <label>
            {t('contact.name')}
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={t('contact.namePlaceholder')}
            />
          </label>

          <label>
            {t('contact.email')}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('contact.emailPlaceholder')}
            />
          </label>

          <label>
            {t('contact.subject')}
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder={t('contact.subjectPlaceholder')}
            />
          </label>

          <label>
            {t('contact.message')}
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder={t('contact.messagePlaceholder')}
            />
          </label>

          <button type="submit">{t('contact.send')}</button>
        </form>
        <p className={styles.meta}>{t('contact.notice')}</p>
      </section>
    </div>
  );
};

export default ContactUs;
