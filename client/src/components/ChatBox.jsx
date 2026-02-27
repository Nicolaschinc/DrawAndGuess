import { memo, useRef, useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import styles from "../room.module.scss";
import { getPlayerColor } from "../utils/playerColor";
import { EffectToolbar } from "./GameUI";

const ChatBox = memo(function ChatBox({
  messages,
  onSendMessage,
  effectUsage,
  onThrowEffect,
  gameStarted,
  isDrawer
}) {
  const { t } = useTranslation();
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const renderSystemMessage = (msg) => {
    if (msg.key) {
      return (
        <Trans
          i18nKey={msg.key}
          values={msg.args}
          components={{
            user: (
              <span
                style={{
                  color: msg.relatedUser ? getPlayerColor(msg.relatedUser.id) : "inherit",
                  fontWeight: 600,
                }}
              />
            ),
          }}
        />
      );
    }

    if (!msg.relatedUser || !msg.text.includes(msg.relatedUser.name)) {
      return msg.text;
    }
    const parts = msg.text.split(msg.relatedUser.name);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span style={{ color: getPlayerColor(msg.relatedUser.id), fontWeight: 600 }}>
                {msg.relatedUser.name}
              </span>
            )}
          </span>
        ))}
      </>
    );
  };

  return (
    <section className={styles["chat-box"]}>
      <ul className={styles.messages} role="log" aria-live="polite" aria-label={t('ui.chat')}>
        {messages.map((m, idx) => (
          <li key={idx} className={m.type === "system" ? styles["msg-system"] : styles["msg-chat"]}>
            {m.type === "system" ? (
              renderSystemMessage(m)
            ) : (
              <>
                <span style={{ color: getPlayerColor(m.senderId), fontWeight: 600 }}>{m.sender}</span>: {m.text}
              </>
            )}
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      <EffectToolbar 
        onThrow={onThrowEffect} 
        usage={effectUsage} 
        disabled={!gameStarted || isDrawer} 
      />
      <form onSubmit={handleSubmit} className={styles["chat-form"]}>
        <input
          name="chat_message"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={t('ui.chatPlaceholder')}
          autoComplete="off"
          maxLength={100}
        />
        <button type="submit">{t('ui.send')}</button>
      </form>
    </section>
  );
});

export default ChatBox;
