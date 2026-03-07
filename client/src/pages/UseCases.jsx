import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import styles from "./StaticPages.module.scss";
import SeoHead from "../components/SeoHead";
import { withLanguagePrefix } from "../utils/localeRoutes";

const UseCases = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
  const cases = ["friends", "remote", "classroom", "stream"];

  return (
    <div className={styles.container}>
      <SeoHead
        lang={lang}
        title={`${t("useCases.title")} | Draw & Guess`}
        description={t("useCases.intro")}
        path="/use-cases"
      />
      <Link to={homePath} className={styles["back-link"]}>
        ← {t("static.backHome")}
      </Link>
      <h1>{t("useCases.title")}</h1>
      <p>{t("useCases.intro")}</p>

      <div className={styles.cards}>
        {cases.map((key) => (
          <section key={key} className={styles.card}>
            <h2>{t(`useCases.items.${key}.title`)}</h2>
            <p>{t(`useCases.items.${key}.text`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default UseCases;
