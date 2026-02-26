import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [showMobilePlayers, setShowMobilePlayers] = useState(false);

  return (
    <>
      {gameStarted && (
        <div className={styles["word-box"]} aria-live="polite">
          {isDrawer
            ? `${t('ui.yourWord')}：${word || t('ui.waiting')}`
            : maskedWord}
        </div>
      )}

      <div className={cx(styles["mobile-actions-row"], !(isHost && !gameStarted) && styles.single)}>
        {isHost && !gameStarted && (
          <button onClick={onStartGame} className={styles["start-btn"]}>
            {t('ui.start')}
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
            {t('ui.players')} ({players.length})
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
        {t('ui.me')}：
        <span style={{ color: me ? getPlayerColor(me.id) : 'inherit', fontWeight: 600 }}>
          {me?.name || "-"}
        </span>
      </p>
    </>
  );
}
