import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import styles from "./StaticPages.module.scss";
import SeoHead from "../components/SeoHead";
import { withLanguagePrefix } from "../utils/localeRoutes";

const Features = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
  const featureKeys = ["rooms", "drawing", "guessing", "reference", "mobile", "bilingual"];

  return (
    <div className={styles.container}>
      <SeoHead
        lang={lang}
        title={`${t("features.title")} | Draw & Guess`}
        description={t("features.intro")}
        path="/features"
      />
      <Link to={homePath} className={styles["back-link"]}>
        ← {t("static.backHome")}
      </Link>
      <h1>{t("features.title")}</h1>
      <p>{t("features.intro")}</p>

      <section>
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

      <section>
        <h2>{t("features.fitTitle")}</h2>
        <ul>
          <li>{t("features.fitPoint1")}</li>
          <li>{t("features.fitPoint2")}</li>
          <li>{t("features.fitPoint3")}</li>
        </ul>
      </section>
    </div>
  );
};

export default Features;
