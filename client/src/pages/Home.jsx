import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bannerImg from "../assets/img/banner.png";
import styles from "../styles.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export default function Home() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState("create"); // "join" or "create"
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    navigate(`/room/${roomId}`, { state: { name } });
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    // Generate a random 6-character room ID
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${newRoomId}`, { state: { name } });
  };

  return (
    <div className={styles["join-page"]}>
      <div className={styles["join-card"]}>
        <div className={styles["join-card-left"]}>
          <img src={bannerImg} alt="Draw and Guess Banner" className={styles["banner-img"]} />
        </div>
        <div className={styles["join-card-right"]}>
          <h1>你画我猜</h1>

          <div className={styles["mode-switch"]}>
            <button
              className={cx(styles["mode-btn"], mode === "create" && styles.active)}
              onClick={() => setMode("create")}
            >
              创建房间
            </button>
            <button
              className={cx(styles["mode-btn"], mode === "join" && styles.active)}
              onClick={() => setMode("join")}
            >
              加入房间
            </button>
          </div>

          <p className={styles.hint} aria-live="polite">
            {mode === "join" ? "请输入房间号加入游戏" : "创建新房间并邀请好友"}
          </p>

          <label className={styles.field}>
            <span>你的名称</span>
            <input
              name="player_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入昵称，例如小王…"
              maxLength={20}
              autoComplete="nickname"
              spellCheck={false}
            />
          </label>

          {mode === "join" && (
            <label className={styles.field}>
              <span>房间 ID</span>
              <input
                name="room_id"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="例如 room1…"
                maxLength={24}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
          )}

          <button
            onClick={mode === "join" ? handleJoin : handleCreate}
            disabled={!name.trim() || (mode === "join" && !roomId.trim())}
          >
            {mode === "join" ? "进入房间" : "创建并进入"}
          </button>
        </div>
      </div>
    </div>
  );
}
