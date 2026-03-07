import ChatBox from "../../components/ChatBox";

export default function ChatPanel({
  messages,
  onSendMessage,
  effectUsage,
  onThrowEffect,
  gameStarted,
  isDrawer,
  hiddenOnMobile = false,
}) {
  return (
    <ChatBox 
      messages={messages}
      onSendMessage={onSendMessage}
      effectUsage={effectUsage}
      onThrowEffect={onThrowEffect}
      gameStarted={gameStarted}
      isDrawer={isDrawer}
      hiddenOnMobile={hiddenOnMobile}
    />
  );
}
