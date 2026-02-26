import { memo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            {p.id === drawerId ? t('ui.roleDrawer') : ""}
            {p.id === hostId ? t('ui.roleHost') : ""}
            {guessedIds.includes(p.id) ? t('ui.statusGuessed') : ""}
          </span>
          <strong>{p.score}</strong>
        </li>
      ))}
    </ul>
  );
});

export default PlayerList;
