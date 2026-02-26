import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastModal } from "../components/GameUI";
import { decryptRoomId } from "../utils/crypto";
import styles from "../styles.module.scss";

export default function ShareRedirect() {
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
        setError("无效的分享链接");
      }
    }
  }, [hash, navigate]);

  return (
    <div className={styles["join-page"]}>
      <div className={`${styles["join-card"]} ${styles["join-card-centered"]}`}>
        <p>正在解析分享链接...</p>
      </div>
      {error && (
        <ToastModal
          title="提示"
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
