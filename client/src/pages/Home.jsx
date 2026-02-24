import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    navigate(`/room/${roomId}`, { state: { name } });
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <h1>你画我猜</h1>
        <p className="hint" aria-live="polite">
          请输入您的昵称和房间号开始游戏
        </p>
        <label className="field">
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
        <label className="field">
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
        <button onClick={handleJoin} disabled={!name.trim() || !roomId.trim()}>
          进入房间
        </button>
      </div>
    </div>
  );
}
