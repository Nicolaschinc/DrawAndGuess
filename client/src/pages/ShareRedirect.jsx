import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ToastModal } from "../components/GameUI";
import { decryptRoomId } from "../utils/crypto";
import styles from "../home.module.scss";

export default function ShareRedirect() {
  const { t } = useTranslation();
  const { hash } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hash) {
      const roomId = decryptRoomId(hash);
      if (roomId) {
        // Redirect to the actual room page
        navigate(`/room/${roomId}`, { replace: true });
      } else {
        // Handle invalid hash
        setError(t("share.invalid"));
      }
    }
  }, [hash, navigate, t]);

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
            navigate("/", { replace: true });
          }}
        />
      )}
    </div>
  );
}
