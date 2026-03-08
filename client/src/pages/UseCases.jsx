import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styles from "./StaticPages.module.scss";
import SeoHead from "../components/SeoHead";
import StaticPageLayout from "../components/StaticPageLayout";

const UseCases = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const cases = ["friends", "remote", "classroom", "stream"];

  return (
    <StaticPageLayout
      title={t("useCases.title")}
      intro={t("useCases.intro")}
      summary={t("useCases.summary")}
    >
      <SeoHead
        lang={lang}
        title={`${t("useCases.title")} | Draw & Guess`}
        description={t("useCases.intro")}
        path="/use-cases"
      />
      <section className={styles.section}>
        <span className={styles.eyebrow}>{t("useCases.sectionLabel")}</span>
        <h2>{t("useCases.sectionTitle")}</h2>
        <div className={styles.cards}>
        {cases.map((key) => (
          <article key={key} className={styles.card}>
            <h3>{t(`useCases.items.${key}.title`)}</h3>
            <p>{t(`useCases.items.${key}.text`)}</p>
          </article>
        ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default UseCases;
