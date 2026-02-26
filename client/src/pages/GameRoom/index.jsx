import { useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  EffectOverlay,
  RulesModal,
  JoinRoomModal,
  ToastModal,
  ConfirmModal,
} from "../../components/GameUI";
import styles from "../../room.module.scss";
import homeStyles from "../../home.module.scss";

import { useRoomSocket } from "./useRoomSocket";
import { useCanvasDraw } from "./useCanvasDraw";
import RoomHeader from "./RoomHeader";
import PlayerList from "./PlayerList";
import ChatPanel from "./ChatPanel";
import CanvasPanel from "./CanvasPanel";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export default function GameRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Initial name from router state
  const [name, setName] = useState(location.state?.name || "");
  const [showJoinModal, setShowJoinModal] = useState(!name);
  
  // UI State
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  const handleJoinError = useCallback((msg) => {
    setToast({ title: "加入失败", message: msg });
  }, []);

  // Custom Hooks
  const {
    socketRef,
    joined,
    roomState,
    messages,
    flyingEffects,
    setFlyingEffects,
    effectUsage,
    me,
    isHost,
    isDrawer,
    startGame,
    sendMessage,
    throwEffect,
    leaveRoom
  } = useRoomSocket(roomId, name, navigate, handleJoinError);

  const {
    canvasRef,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    activeTool,
    setActiveTool,
    clearByDrawer,
    toggleFullScreen,
    isFullscreen,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useCanvasDraw({
    socketRef,
    isDrawer,
    gameStarted: roomState.game.started,
    joined,
  });

  // Actions
  const handleJoinModalSubmit = useCallback((newName) => {
    setName(newName);
    setShowJoinModal(false);
  }, []);

  const handleAnimationEnd = useCallback((id) => {
    setFlyingEffects((prev) => prev.filter((e) => e.id !== id));
  }, [setFlyingEffects]);

  // Render
  if (showJoinModal) {
    const randomName = "玩家" + Math.floor(1000 + Math.random() * 9000);
    return (
      <div className={homeStyles["join-page"]}>
         <JoinRoomModal 
            roomId={roomId}
            defaultName={randomName}
            onJoin={handleJoinModalSubmit}
            onCancel={() => navigate("/")}
          />
         <div className={cx(homeStyles["join-card"], homeStyles["join-card-muted"])}>
            <h1>你画我猜</h1>
            <p className={homeStyles.hint}>正在连接...</p>
         </div>
      </div>
    );
  }

  if (!joined) {
     return (
        <div className={homeStyles["join-page"]}>
           <div className={cx(homeStyles["join-card"], homeStyles["join-card-centered"])}>
              <p className={homeStyles["join-status-text"]}>正在加入房间...</p>
           </div>
        </div>
     );
  }

  const canDraw = isDrawer && roomState.game.started;

  return (
    <div className={styles.layout}>
      <a className={styles["skip-link"]} href="#game-main">
        跳到游戏内容
      </a>
      <aside className={styles["left-panel"]}>
        <RoomHeader 
          roomId={roomId}
          gameStarted={roomState.game.started}
          playersCount={roomState.players.length}
          roundEndsAt={roomState.game.roundEndsAt}
          onShowRules={() => setShowRules(true)}
          onLeaveRoom={() => setShowLeaveConfirm(true)}
          setToast={setToast}
        />

        <PlayerList 
          players={roomState.players}
          drawerId={roomState.game.drawerId}
          hostId={roomState.hostId}
          guessedIds={roomState.game.guessedIds}
          me={me}
          isHost={isHost}
          gameStarted={roomState.game.started}
          word={roomState.game.word}
          maskedWord={roomState.game.maskedWord}
          isDrawer={isDrawer}
          onStartGame={startGame}
        />
      </aside>

      <main className={styles["board-panel"]} id="game-main">
        <CanvasPanel 
          canvasRef={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          penColor={penColor}
          setPenColor={setPenColor}
          penWidth={penWidth}
          setPenWidth={setPenWidth}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          clearByDrawer={clearByDrawer}
          isFullscreen={isFullscreen}
          toggleFullScreen={toggleFullScreen}
          canDraw={canDraw}
          isDrawer={isDrawer}
          word={roomState.game.word}
          roundEndsAt={roomState.game.roundEndsAt}
          roundDuration={roomState.game.roundDuration}
        />

        <ChatPanel 
          messages={messages}
          onSendMessage={sendMessage}
          effectUsage={effectUsage}
          onThrowEffect={throwEffect}
          gameStarted={roomState.game.started}
          isDrawer={isDrawer}
        />
      </main>
      
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      
      {showLeaveConfirm && (
        <ConfirmModal
          title="退出房间"
          message="退出后将返回首页，当前对局状态不会为你保留。"
          confirmText="确认退出"
          cancelText="留在房间"
          danger
          onCancel={() => setShowLeaveConfirm(false)}
          onConfirm={leaveRoom}
        />
      )}
      
      {toast && (
        <ToastModal 
          title={toast.title} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <EffectOverlay effects={flyingEffects} onAnimationEnd={handleAnimationEnd} />
    </div>
  );
}
