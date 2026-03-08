import styles from "../pages/StaticPages.module.scss";

export default function StaticPageLayout({
  title,
  intro,
  metaItems = [],
  summary,
  children,
}) {
  return (
    <div className={styles["page-shell"]}>
      <div className={styles.container}>
        <header className={styles["page-hero"]}>
          <h1>{title}</h1>
          {(metaItems.length > 0 || intro) && (
            <div className={styles["hero-body"]}>
              {metaItems.length > 0 && (
                <dl className={styles["meta-grid"]}>
                  {metaItems.map((item) => (
                    <div key={item.label} className={styles["meta-item"]}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {intro && <p className={styles.lead}>{intro}</p>}
              {summary && <p className={styles.summary}>{summary}</p>}
            </div>
          )}
        </header>

        <div className={styles["content-stack"]}>{children}</div>
      </div>
    </div>
  );
}
