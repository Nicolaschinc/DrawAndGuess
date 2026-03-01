import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import bannerCn from "../assets/img/banner_cn.png";
import bannerEn from "../assets/img/banner_en.png";
import styles from "../home.module.scss";
import LanguageSwitcher from "../components/LanguageSwitcher";
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
      <Helmet>
        <title>{t('home.title')} - Draw & Guess</title>
        <meta name="description" content={t('home.description')} />
        <link rel="canonical" href="https://drawandguess.com/drawguess/" />
        <link rel="alternate" hreflang="en" href="https://drawandguess.com/drawguess/en" />
        <link rel="alternate" hreflang="zh" href="https://drawandguess.com/drawguess/zh" />
        <link rel="alternate" hreflang="x-default" href="https://drawandguess.com/drawguess/" />
      </Helmet>
      <div className={styles["join-card"]}>
        <div className={styles["join-card-left"]}>
          <img src={currentBanner} alt="Draw and Guess Banner" className={styles["banner-img"]} />
        </div>
        <div className={styles["join-card-right"]}>
          <div className={styles["header-row"]}>
            <h1>{t('home.title')}</h1>
            <LanguageSwitcher />
          </div>

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
  );
}
