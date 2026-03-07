import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import bannerCn from "../assets/img/banner_cn.png";
import bannerEn from "../assets/img/banner_en.png";
import styles from "../home.module.scss";
import LanguageSwitcher from "../components/LanguageSwitcher";
import SeoHead from "../components/SeoHead";
import { normalizeLanguage, withLanguagePrefix } from "../utils/localeRoutes";
import { trackEvent } from "../utils/analytics";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export default function Home() {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState("create"); // "join" or "create"
  const navigate = useNavigate();
  const currentLang = normalizeLanguage(lang || i18n.language);
  const seoTitle =
    currentLang === "zh"
      ? "在线你画我猜多人游戏 | Draw & Guess"
      : "Online Draw & Guess Multiplayer Game | Draw & Guess";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: currentLang === "zh" ? "这是什么游戏？" : "What is Draw & Guess?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            currentLang === "zh"
              ? "这是一款在线多人你画我猜网页游戏，玩家可以创建房间、实时作画并通过聊天猜词。"
              : "Draw & Guess is an online multiplayer drawing and guessing game where players create rooms, draw in real time, and guess through chat.",
        },
      },
      {
        "@type": "Question",
        name: currentLang === "zh" ? "需要下载吗？" : "Do I need to download anything?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            currentLang === "zh"
              ? "不需要，直接在浏览器中打开即可开始游戏，支持手机和桌面端。"
              : "No. You can start playing directly in the browser on mobile or desktop.",
        },
      },
      {
        "@type": "Question",
        name: currentLang === "zh" ? "支持和朋友一起玩吗？" : "Can I play with friends?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            currentLang === "zh"
              ? "支持。你可以创建房间并分享链接，邀请朋友实时加入同一局游戏。"
              : "Yes. You can create a room, share the link, and invite friends to join in real time.",
        },
      },
    ],
  };
  const featureItems = [
    {
      title: t("home.features.instantTitle"),
      text: t("home.features.instantText"),
    },
    {
      title: t("home.features.socialTitle"),
      text: t("home.features.socialText"),
    },
    {
      title: t("home.features.mobileTitle"),
      text: t("home.features.mobileText"),
    },
  ];
  const howItWorksItems = [
    {
      title: t("home.how.step1Title"),
      text: t("home.how.step1Text"),
    },
    {
      title: t("home.how.step2Title"),
      text: t("home.how.step2Text"),
    },
    {
      title: t("home.how.step3Title"),
      text: t("home.how.step3Text"),
    },
  ];
  const faqItems = faqSchema.mainEntity.map((item) => ({
    question: item.name,
    answer: item.acceptedAnswer.text,
  }));
  const featuresPath = withLanguagePrefix(currentLang, "/features");
  const useCasesPath = withLanguagePrefix(currentLang, "/use-cases");
  const faqPath = withLanguagePrefix(currentLang, "/faq");
  const aboutPath = withLanguagePrefix(currentLang, "/about");
  const privacyPath = withLanguagePrefix(currentLang, "/privacy");
  const contactPath = withLanguagePrefix(currentLang, "/contact");
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Draw & Guess",
    url: `https://playflowpulse.com/drawguess/${currentLang}`,
    inLanguage: currentLang,
    applicationCategory: "Game",
    genre: ["Party Game", "Drawing Game", "Word Game"],
    operatingSystem: "Any",
    description: t("home.description"),
    image: "https://playflowpulse.com/drawguess/img/banner.png",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  useEffect(() => {
    trackEvent('landing_view');
  }, []);

  const currentBanner = i18n.language.startsWith('zh') ? bannerCn : bannerEn;

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    navigate(withLanguagePrefix(currentLang, `/room/${roomId}`), { state: { name } });
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    trackEvent('create_room_click');
    // Generate a random 6-character room ID
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(withLanguagePrefix(currentLang, `/room/${newRoomId}`), { state: { name } });
  };

  return (
    <div className={styles["join-page"]}>
      <SeoHead
        lang={currentLang}
        title={seoTitle}
        description={t("home.description")}
        path="/"
        structuredData={[gameSchema, faqSchema]}
      />
      <div className={styles["hero-shell"]}>
        <div className={styles["join-card"]}>
          <div className={styles["join-card-left"]}>
            <img src={currentBanner} alt="Draw and Guess Banner" className={styles["banner-img"]} />
          </div>
          <div className={styles["join-card-right"]}>
            <div className={styles["header-row"]}>
              <h1>{t('home.title')}</h1>
              <LanguageSwitcher />
            </div>

            <p className={styles["hero-copy"]}>{t("home.heroCopy")}</p>

            <div className={styles["mode-switch"]}>
              <button
                className={cx(styles["mode-btn"], mode === "create" && styles.active)}
                onClick={() => setMode("create")}
              >
                {t('home.createRoom')}
              </button>
              <button
                className={cx(styles["mode-btn"], mode === "join" && styles.active)}
                onClick={() => setMode("join")}
              >
                {t('home.joinRoom')}
              </button>
            </div>

            <p className={styles.hint} aria-live="polite">
              {mode === "join" ? t('home.hintJoin') : t('home.hintCreate')}
            </p>

            <label className={styles.field}>
              <span>{t('home.yourName')}</span>
              <input
                name="player_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('home.namePlaceholder')}
                maxLength={20}
                autoComplete="nickname"
                spellCheck={false}
              />
            </label>

            {mode === "join" && (
              <label className={styles.field}>
                <span>{t('home.roomId')}</span>
                <input
                  name="room_id"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder={t('home.roomPlaceholder')}
                  maxLength={24}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
            )}

            <button
              className={styles["action-btn"]}
              onClick={mode === "join" ? handleJoin : handleCreate}
              disabled={!name.trim() || (mode === "join" && !roomId.trim())}
            >
              {mode === "join" ? t('home.enterRoom') : t('home.createAndEnter')}
            </button>
          </div>
        </div>
      </div>

      <div className={styles["content-shell"]}>
        <section className={styles["content-panel"]}>
          <div className={styles["section-heading"]}>
            <h2>{t("home.features.title")}</h2>
            <p>{t("home.features.intro")}</p>
          </div>
          <div className={styles["feature-grid"]}>
            {featureItems.map((item) => (
              <article key={item.title} className={styles["feature-card"]}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles["content-panel"]}>
          <div className={styles["section-heading"]}>
            <h2>{t("home.how.title")}</h2>
            <p>{t("home.how.intro")}</p>
          </div>
          <div className={styles["step-list"]}>
            {howItWorksItems.map((item, index) => (
              <article key={item.title} className={styles["step-card"]}>
                <span className={styles["step-index"]}>{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles["content-panel"]}>
          <div className={styles["section-heading"]}>
            <h2>{t("home.faqTitle")}</h2>
            <p>{t("home.faqIntro")}</p>
          </div>
          <div className={styles["faq-list"]}>
            {faqItems.map((item) => (
              <article key={item.question} className={styles["faq-item"]}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles["content-panel"]}>
          <div className={styles["section-heading"]}>
            <h2>{t("home.linksTitle")}</h2>
            <p>{t("home.linksIntro")}</p>
          </div>
          <div className={styles["link-grid"]}>
            <Link to={featuresPath} className={styles["link-card"]}>
              <h3>{t("static.features")}</h3>
              <p>{t("home.linkFeaturesText")}</p>
            </Link>
            <Link to={useCasesPath} className={styles["link-card"]}>
              <h3>{t("static.useCases")}</h3>
              <p>{t("home.linkUseCasesText")}</p>
            </Link>
            <Link to={faqPath} className={styles["link-card"]}>
              <h3>{t("static.faq")}</h3>
              <p>{t("home.linkFaqText")}</p>
            </Link>
            <Link to={aboutPath} className={styles["link-card"]}>
              <h3>{t("static.about")}</h3>
              <p>{t("home.linkAboutText")}</p>
            </Link>
            <Link to={privacyPath} className={styles["link-card"]}>
              <h3>{t("static.privacy")}</h3>
              <p>{t("home.linkPrivacyText")}</p>
            </Link>
            <Link to={contactPath} className={styles["link-card"]}>
              <h3>{t("static.contactUs")}</h3>
              <p>{t("home.linkContactText")}</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
