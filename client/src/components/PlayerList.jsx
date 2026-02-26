import { memo } from "react";
import styles from "../room.module.scss";
import { getPlayerColor } from "../utils/playerColor";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

const PlayerList = memo(function PlayerList({ 
  players, 
  drawerId, 
  hostId, 
  guessedIds, 
  showMobilePlayers 
}) {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === drawerId) return -1;
    if (b.id === drawerId) return 1;
    return 0;
  });

  return (
    <ul
      id="players-list"
      className={cx(styles.players, !showMobilePlayers && styles["is-collapsed"])}
    >
      {sortedPlayers.map((p) => (
        <li key={p.id} id={`player-${p.id}`}>
          <span>
            <span style={{ color: getPlayerColor(p.id), fontWeight: 600 }}>{p.name}</span>
            {p.id === drawerId ? " (画家)" : ""}
            {p.id === hostId ? " (房主)" : ""}
            {guessedIds.includes(p.id) ? " (已猜中)" : ""}
          </span>
          <strong>{p.score}</strong>
        </li>
      ))}
    </ul>
  );
});

export default PlayerList;
