import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styles from "./StaticPages.module.scss";
import SeoHead from "../components/SeoHead";
import StaticPageLayout from "../components/StaticPageLayout";

const Features = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const featureKeys = ["rooms", "drawing", "guessing", "reference", "mobile", "bilingual"];

  return (
    <StaticPageLayout
      title={t("features.title")}
      intro={t("features.intro")}
      summary={t("features.summary")}
    >
      <SeoHead
        lang={lang}
        title={`${t("features.title")} | Draw & Guess`}
        description={t("features.intro")}
        path="/features"
      />
      <section className={styles.section}>
        <span className={styles.eyebrow}>{t("features.coreTitle")}</span>
        <h2>{t("features.coreTitle")}</h2>
        <div className={styles.cards}>
          {featureKeys.map((key) => (
            <article key={key} className={styles.card}>
              <h3>{t(`features.items.${key}.title`)}</h3>
              <p>{t(`features.items.${key}.text`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.eyebrow}>{t("features.fitTitle")}</span>
        <h2>{t("features.fitTitle")}</h2>
        <ul>
          <li>{t("features.fitPoint1")}</li>
          <li>{t("features.fitPoint2")}</li>
          <li>{t("features.fitPoint3")}</li>
        </ul>
      </section>
    </StaticPageLayout>
  );
};

export default Features;
