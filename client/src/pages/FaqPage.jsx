import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styles from "./StaticPages.module.scss";
import SeoHead from "../components/SeoHead";
import StaticPageLayout from "../components/StaticPageLayout";

const FAQ_ITEMS = ["what", "download", "friends", "mobile", "private", "ai"];

const FaqPage = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((key) => ({
      "@type": "Question",
      name: t(`faqPage.items.${key}.question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faqPage.items.${key}.answer`),
      },
    })),
  };

  return (
    <StaticPageLayout
      title={t("faqPage.title")}
      intro={t("faqPage.intro")}
      summary={t("faqPage.summary")}
    >
      <SeoHead
        lang={lang}
        title={`${t("faqPage.title")} | Draw & Guess`}
        description={t("faqPage.intro")}
        path="/faq"
        structuredData={structuredData}
      />
      <section className={styles.section}>
        <span className={styles.eyebrow}>{t("faqPage.sectionLabel")}</span>
        <h2>{t("faqPage.sectionTitle")}</h2>
        <div className={styles["faq-stack"]}>
        {FAQ_ITEMS.map((key) => (
          <article key={key} className={styles.card}>
            <h2>{t(`faqPage.items.${key}.question`)}</h2>
            <p>{t(`faqPage.items.${key}.answer`)}</p>
          </article>
        ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default FaqPage;
