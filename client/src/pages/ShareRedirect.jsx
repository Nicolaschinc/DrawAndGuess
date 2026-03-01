import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ToastModal } from "../components/GameUI";
import { decryptRoomId } from "../utils/crypto";
import styles from "../home.module.scss";
import { withLanguagePrefix } from "../utils/localeRoutes";

export default function ShareRedirect() {
  const { t } = useTranslation();
  const { hash, lang } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hash) {
      const roomId = decryptRoomId(hash);
      if (roomId) {
        // Redirect to the actual room page
        navigate(withLanguagePrefix(lang, `/room/${roomId}`), { replace: true });
      } else {
        // Handle invalid hash
        setError(t("share.invalid"));
      }
    }
  }, [hash, lang, navigate, t]);

  return (
    <div className={styles["join-page"]}>
      <div className={`${styles["join-card"]} ${styles["join-card-centered"]}`}>
        <p>{t("share.resolving")}</p>
      </div>
      {error && (
        <ToastModal
          title={t("share.notice")}
          message={error}
          onClose={() => {
            setError(null);
            navigate(withLanguagePrefix(lang, "/"), { replace: true });
          }}
        />
      )}
    </div>
  );
}
