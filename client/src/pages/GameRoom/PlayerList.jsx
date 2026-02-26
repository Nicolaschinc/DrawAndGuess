import { useState } from "react";
import PlayerListComponent from "../../components/PlayerList";
import { getPlayerColor } from "../../utils/playerColor";
import styles from "../../room.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export default function PlayerList({
  players,
  drawerId,
  hostId,
  guessedIds,
  me,
  isHost,
  gameStarted,
  word,
  maskedWord,
  isDrawer,
  onStartGame
}) {
  const [showMobilePlayers, setShowMobilePlayers] = useState(false);

  return (
    <>
      {gameStarted && (
        <div className={styles["word-box"]} aria-live="polite">
          {isDrawer
            ? `你的词：${word || "等待回合"}`
            : maskedWord}
        </div>
      )}

      <div className={cx(styles["mobile-actions-row"], !(isHost && !gameStarted) && styles.single)}>
        {isHost && !gameStarted && (
          <button onClick={onStartGame} className={styles["start-btn"]}>
            开始游戏
          </button>
        )}

        <div className={styles["mobile-players-toggle-wrap"]}>
          <button
            type="button"
            className={cx(styles["mobile-players-toggle"], showMobilePlayers && styles.active)}
            onClick={() => setShowMobilePlayers((prev) => !prev)}
            aria-expanded={showMobilePlayers}
            aria-controls="players-list"
          >
            玩家榜 ({players.length})
          </button>
        </div>
      </div>

      <PlayerListComponent 
        players={players}
        drawerId={drawerId}
        hostId={hostId}
        guessedIds={guessedIds}
        showMobilePlayers={showMobilePlayers}
      />

      <p className={styles.me}>
        你：
        <span style={{ color: me ? getPlayerColor(me.id) : 'inherit', fontWeight: 600 }}>
          {me?.name || "-"}
        </span>
      </p>
    </>
  );
}
