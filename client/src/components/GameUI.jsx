import { useState } from "react";
import styles from "../modal.module.scss";
import roomStyles from "../room.module.scss";
import homeStyles from "../home.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export const EFFECT_TYPES = [
  { type: "🌸", label: "鲜花" },
  { type: "🩴", label: "拖鞋" },
  { type: "🥚", label: "鸡蛋" },
  { type: "💋", label: "飞吻" },
  { type: "💣", label: "炸弹" },
];

export function EffectToolbar({ onThrow, usage, disabled }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={roomStyles["effect-toolbar"]}>
      <button
        className={cx(roomStyles["effect-toggle-btn"], expanded && roomStyles.active)}
        onClick={() => setExpanded(!expanded)}
        title="互动道具"
        disabled={disabled}
      >
        🎁
      </button>
      {expanded && (
        <div className={roomStyles["effect-list"]}>
          {EFFECT_TYPES.map(({ type, label }) => {
            const count = usage[type] || 0;
            const isLimit = count >= 5;
            return (
              <button
                key={type}
                className={roomStyles["effect-btn"]}
                onClick={() => onThrow(type)}
                disabled={disabled || isLimit}
                title={`${label} (剩余 ${5 - count})`}
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
              确定
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
  confirmText = "确定",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}) {
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
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={cx(danger ? styles["danger-btn"] : styles["start-btn"], styles["modal-action-full"])}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RulesModal({ onClose }) {
  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>游戏规则</h2>
          <button className={styles["close-btn"]} onClick={onClose}>×</button>
        </div>
        <div className={styles["rules-content"]}>
          <section>
            <h3>🎨 游戏流程</h3>
            <p>1. 玩家轮流当画家，其他人猜词</p>
            <p>2. 每回合 75 秒，全员猜中或时间到则结束</p>
            <p>3. 所有人当过一次画家后游戏结束</p>
          </section>
          <section>
            <h3>🏆 计分规则</h3>
            <p><strong>猜词者：</strong>基础分 10 分 + 剩余时间奖励</p>
            <p><strong>画家：</strong>每有一个人猜中 +5 分</p>
          </section>
          <section>
            <h3>⚠️ 注意事项</h3>
            <p>• 画家不能写字、写拼音或直接给提示</p>
            <p>• 猜词者在聊天框输入答案</p>
            <p>• 只有系统判定的答案才算分</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function RulesButton({ onClick, className = "", iconOnly = false }) {
  return (
    <button
      onClick={onClick}
      className={cx(roomStyles["rules-btn"], iconOnly && roomStyles["icon-only"], className)}
      title="游戏规则"
      aria-label="查看游戏规则"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {!iconOnly && <span>游戏规则</span>}
    </button>
  );
}

export function JoinRoomModal({ roomId, defaultName, onJoin, onCancel }) {
  const [name, setName] = useState(defaultName);

  return (
    <div className={styles["modal-overlay"]}>
      <div className={cx(styles["modal-content"], styles["join-modal-content"])} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>加入房间</h2>
          <button className={styles["close-btn"]} onClick={onCancel}>×</button>
        </div>
        <div className={styles["join-modal-body"]}>
          <p className={homeStyles.hint}>
            正在加入房间: <strong>{roomId}</strong>
          </p>
          <label className={homeStyles.field}>
            <span>你的名称</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入昵称"
              maxLength={20}
              autoComplete="nickname"
              autoFocus
            />
          </label>
          <div className={styles["modal-actions"]}>
            <button onClick={onCancel} className={styles["cancel-btn"]}>取消</button>
            <button 
              onClick={() => onJoin(name)} 
              disabled={!name.trim()} 
              className={styles["start-btn"]}
            >
              加入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
