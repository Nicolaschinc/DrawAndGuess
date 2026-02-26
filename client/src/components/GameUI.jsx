import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../modal.module.scss";
import roomStyles from "../room.module.scss";
import homeStyles from "../home.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export const EFFECT_TYPES = [
  { type: "🌸", key: "flower" },
  { type: "🩴", key: "slipper" },
  { type: "🥚", key: "egg" },
  { type: "💋", key: "kiss" },
  { type: "💣", key: "bomb" },
];

export function EffectToolbar({ onThrow, usage, disabled }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={roomStyles["effect-toolbar"]}>
      <button
        className={cx(roomStyles["effect-toggle-btn"], expanded && roomStyles.active)}
        onClick={() => setExpanded(!expanded)}
        title={t('effects.toolbar')}
        disabled={disabled}
      >
        🎁
      </button>
      {expanded && (
        <div className={roomStyles["effect-list"]}>
          {EFFECT_TYPES.map(({ type, key }) => {
            const count = usage[type] || 0;
            const isLimit = count >= 5;
            return (
              <button
                key={type}
                className={roomStyles["effect-btn"]}
                onClick={() => onThrow(type)}
                disabled={disabled || isLimit}
                title={`${t('effects.' + key)} (${t('effects.remaining')} ${5 - count})`}
              >
                {type}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EffectOverlay({ effects, onAnimationEnd }) {
  return (
    <div className={roomStyles["effect-overlay"]}>
      {effects.map((effect) => (
        <div
          key={effect.id}
          className={roomStyles["flying-effect"]}
          style={{
            "--start-x": `${effect.startX}px`,
            "--start-y": `${effect.startY}px`,
            "--target-x": `${effect.targetX}px`,
            "--target-y": `${effect.targetY}px`,
          }}
          onAnimationEnd={() => onAnimationEnd(effect.id)}
        >
          {effect.type}
        </div>
      ))}
    </div>
  );
}

export function ToastModal({ title, message, onClose }) {
  const { t } = useTranslation();
  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={cx(styles["modal-content"], styles["join-modal-content"])} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>{title}</h2>
          <button className={styles["close-btn"]} onClick={onClose}>×</button>
        </div>
        <div className={cx(styles["join-modal-body"], styles["join-modal-body-spaced"])}>
          <p className={styles["toast-message"]}>
            {message}
          </p>
          <div className={cx(styles["modal-actions"], styles["modal-actions-stretch"])}>
            <button 
              onClick={onClose} 
              className={cx(styles["start-btn"], styles["modal-action-full"])}
            >
              {t('modal.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  danger = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  return (
    <div className={styles["modal-overlay"]} onClick={onCancel}>
      <div className={cx(styles["modal-content"], styles["join-modal-content"])} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>{title}</h2>
          <button className={styles["close-btn"]} onClick={onCancel}>×</button>
        </div>
        <div className={cx(styles["join-modal-body"], styles["join-modal-body-spaced"])}>
          <p className={styles["toast-message"]}>{message}</p>
          <div className={cx(styles["modal-actions"], styles["modal-actions-stretch"])}>
            <button
              onClick={onCancel}
              className={cx(styles["cancel-btn"], styles["modal-action-full"])}
            >
              {cancelText || t('modal.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className={cx(danger ? styles["danger-btn"] : styles["start-btn"], styles["modal-action-full"])}
            >
              {confirmText || t('modal.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RulesModal({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>{t('rules.title')}</h2>
          <button className={styles["close-btn"]} onClick={onClose}>×</button>
        </div>
        <div className={styles["rules-content"]}>
          <section>
            <h3>{t('rules.process')}</h3>
            <p>{t('rules.process1')}</p>
            <p>{t('rules.process2')}</p>
            <p>{t('rules.process3')}</p>
          </section>
          <section>
            <h3>{t('rules.score')}</h3>
            <p><strong>{t('rules.scoreGuesser')}</strong>{t('rules.scoreGuesserDesc')}</p>
            <p><strong>{t('rules.scoreDrawer')}</strong>{t('rules.scoreDrawerDesc')}</p>
          </section>
          <section>
            <h3>{t('rules.notice')}</h3>
            <p>{t('rules.notice1')}</p>
            <p>{t('rules.notice2')}</p>
            <p>{t('rules.notice3')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function RulesButton({ onClick, className = "", iconOnly = false }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={cx(roomStyles["rules-btn"], iconOnly && roomStyles["icon-only"], className)}
      title={t('rules.viewRules')}
      aria-label={t('rules.viewRules')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {!iconOnly && <span>{t('rules.gameRules')}</span>}
    </button>
  );
}

export function JoinRoomModal({ roomId, defaultName, onJoin, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);

  return (
    <div className={styles["modal-overlay"]}>
      <div className={cx(styles["modal-content"], styles["join-modal-content"])} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>{t('modal.joinRoom')}</h2>
          <button className={styles["close-btn"]} onClick={onCancel}>×</button>
        </div>
        <div className={styles["join-modal-body"]}>
          <p className={homeStyles.hint}>
            {t('modal.joiningRoom')}: <strong>{roomId}</strong>
          </p>
          <label className={homeStyles.field}>
            <span>{t('modal.yourName')}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('modal.enterNickname')}
              maxLength={20}
              autoComplete="nickname"
              autoFocus
            />
          </label>
          <div className={styles["modal-actions"]}>
            <button onClick={onCancel} className={styles["cancel-btn"]}>{t('modal.cancel')}</button>
            <button 
              onClick={() => onJoin(name)} 
              disabled={!name.trim()} 
              className={styles["start-btn"]}
            >
              {t('modal.join')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
