import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import styles from "./StaticPages.module.scss";
import SeoHead from "../components/SeoHead";
import { withLanguagePrefix } from "../utils/localeRoutes";

const FAQ_ITEMS = ["what", "download", "friends", "mobile", "private", "ai"];

const FaqPage = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
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
    <div className={styles.container}>
      <SeoHead
        lang={lang}
        title={`${t("faqPage.title")} | Draw & Guess`}
        description={t("faqPage.intro")}
        path="/faq"
        structuredData={structuredData}
      />
      <Link to={homePath} className={styles["back-link"]}>
        ← {t("static.backHome")}
      </Link>
      <h1>{t("faqPage.title")}</h1>
      <p>{t("faqPage.intro")}</p>

      <div className={styles["faq-stack"]}>
        {FAQ_ITEMS.map((key) => (
          <section key={key} className={styles.card}>
            <h2>{t(`faqPage.items.${key}.question`)}</h2>
            <p>{t(`faqPage.items.${key}.answer`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;
