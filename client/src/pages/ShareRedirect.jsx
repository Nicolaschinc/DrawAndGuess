import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decryptRoomId } from "../utils/crypto";

export default function ShareRedirect() {
  const { hash } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      const roomId = decryptRoomId(hash);
      if (roomId) {
        // Redirect to the actual room page
        navigate(`/room/${roomId}`, { replace: true });
      } else {
        // Handle invalid hash (e.g., go home with an error)
        alert("无效的分享链接");
        navigate("/", { replace: true });
      }
    }
  }, [hash, navigate]);

  return (
    <div className="join-page">
      <div className="join-card" style={{ justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <p>正在解析分享链接...</p>
      </div>
    </div>
  );
}
