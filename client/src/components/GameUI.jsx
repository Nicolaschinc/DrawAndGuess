import { useState } from "react";

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
    <div className="effect-toolbar">
      <button
        className={`effect-toggle-btn ${expanded ? "active" : ""}`}
        onClick={() => setExpanded(!expanded)}
        title="互动道具"
        disabled={disabled}
      >
        🎁
      </button>
      {expanded && (
        <div className="effect-list">
          {EFFECT_TYPES.map(({ type, label }) => {
            const count = usage[type] || 0;
            const isLimit = count >= 5;
            return (
              <button
                key={type}
                className="effect-btn"
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
    <div className="effect-overlay">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="flying-effect"
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

export function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>游戏规则</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="rules-content">
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
      className={`rules-btn ${iconOnly ? "icon-only" : ""} ${className}`}
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
    <div className="modal-overlay">
      <div className="modal-content join-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>加入房间</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <div className="join-modal-body">
          <p className="hint">
            正在加入房间: <strong>{roomId}</strong>
          </p>
          <label className="field">
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
          <div className="modal-actions">
            <button onClick={onCancel} className="cancel-btn">取消</button>
            <button 
              onClick={() => onJoin(name)} 
              disabled={!name.trim()} 
              className="start-btn"
            >
              加入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
