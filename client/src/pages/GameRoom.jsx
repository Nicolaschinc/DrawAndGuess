import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Share2, LogOut, Ellipsis, CircleHelp } from "lucide-react";
import { encryptRoomId } from "../utils/crypto";
import { getPlayerColor } from "../utils/playerColor";
import { EVENTS } from "@shared/events.mjs";
import {
  EffectOverlay,
  RulesModal,
  JoinRoomModal,
  ToastModal,
  ConfirmModal,
} from "../components/GameUI";
import GameTimer from "../components/GameTimer";
import PlayerList from "../components/PlayerList";
import ChatBox from "../components/ChatBox";
import CanvasControls from "../components/CanvasControls";
import styles from "../styles.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV ? `http://${window.location.hostname}:3001` : window.location.origin);

function getPointerPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
  const clientY = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export default function GameRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPointRef = useRef(null);
  const strokesRef = useRef([]);
  const localDrawQueue = useRef([]);
  const socketDrawQueue = useRef([]);

  // Name state might come from router state or be empty
  const [name, setName] = useState(location.state?.name || "");
  const [joined, setJoined] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(!name);

  const [roomState, setRoomState] = useState({
    players: [],
    hostId: null,
    game: {
      started: false,
      drawerId: null,
      roundEndsAt: null,
      guessedIds: [],
      word: null,
      maskedWord: null,
    },
    strokes: [],
  });

  const [messages, setMessages] = useState([]);
  const [penColor, setPenColor] = useState("#111111");
  const [penWidth, setPenWidth] = useState(4);
  const [activeTool, setActiveTool] = useState(null);

  const [showRules, setShowRules] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showMobilePlayers, setShowMobilePlayers] = useState(false);
  const [toast, setToast] = useState(null); // { title, message }
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceImages, setReferenceImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const [effectUsage, setEffectUsage] = useState({});
  const [flyingEffects, setFlyingEffects] = useState([]);
  const headerMenuRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Drawing Loop (rAF)
  useEffect(() => {
    let animationFrameId;
    const renderLoop = () => {
      if (localDrawQueue.current.length > 0) {
        const strokesToDraw = localDrawQueue.current;
        localDrawQueue.current = []; // Clear queue
        
        for (const s of strokesToDraw) {
          drawStroke(s);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Socket Batch Sending (Throttle)
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketDrawQueue.current.length > 0) {
        const batch = [...socketDrawQueue.current];
        socketDrawQueue.current = [];
        socketRef.current?.emit(EVENTS.DRAW, batch);
      }
    }, 40); // 25Hz
    return () => clearInterval(interval);
  }, []);

  // Helper to draw a single stroke
  const drawStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Use client dimensions for denormalization to match CSS pixels
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    let x0 = stroke.x0;
    let y0 = stroke.y0;
    let x1 = stroke.x1;
    let y1 = stroke.y1;
    let lineWidth = stroke.width;

    const isNormalized = stroke.normalized === true || (stroke.x0 <= 1 && stroke.x0 >= 0 && stroke.y0 <= 1 && stroke.y0 >= 0);

    if (isNormalized) {
      x0 *= w;
      y0 *= h;
      x1 *= w;
      y1 *= h;
      // Scale line width relative to canvas width (base 1000px)
      lineWidth = stroke.width * (w / 1000);
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }, []); // Dependencies are refs, so empty array is fine

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const redrawAll = useCallback((strokes) => {
    clearCanvas();
    for (const s of strokes) drawStroke(s);
  }, [clearCanvas, drawStroke]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;

    // Mobile optimization: Cap DPR at 1.5 for small screens
    const isMobile = window.innerWidth < 768;
    const maxDpr = isMobile ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    const width = Math.floor(w * dpr);
    const height = Math.floor(h * dpr);
    if (canvas.width === width && canvas.height === height) return;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  // Handle joining when name is available
  useEffect(() => {
    if (joined) return;
    if (!name) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on(EVENTS.CONNECT, () => {
      socket.emit(EVENTS.JOIN_ROOM, { roomId, name }, (res) => {
        if (!res?.ok) {
          alert(res?.error || "加入失败");
          navigate("/");
          return;
        }
        setJoined(true);
        setShowJoinModal(false);
        setMessages([]);
      });
    });

    socket.on(EVENTS.DISCONNECT, () => {
      setJoined(false);
    });

    socket.on(EVENTS.ROOM_STATE, (state) => {
      setRoomState((prev) => {
        if (prev.game.drawerId !== state.game.drawerId) {
          setEffectUsage({});
        }
        return state;
      });
      strokesRef.current = state.strokes;
      redrawAll(state.strokes);
    });

    socket.on(EVENTS.CHAT_MESSAGE, (msg) => {
      setMessages((prev) => [...prev, { type: "chat", ...msg }]);
    });

    socket.on(EVENTS.SYSTEM_MESSAGE, (msg) => {
      setMessages((prev) => [...prev, { type: "system", ...msg }]);
    });

    socket.on(EVENTS.EFFECT_THROWN, ({ type, senderId, targetId }) => {
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;
      
      const targetEl = document.getElementById(`player-${targetId}`);
      let targetX = startX;
      let targetY = startY;

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      const id = Date.now() + Math.random().toString();
      setFlyingEffects((prev) => [
        ...prev,
        { id, type, startX, startY, targetX, targetY },
      ]);
    });

    socket.on(EVENTS.DRAW, (data) => {
      // Handle both single stroke and array of strokes
      const newStrokes = Array.isArray(data) ? data : [data];
      strokesRef.current.push(...newStrokes);
      localDrawQueue.current.push(...newStrokes);
    });

    socket.on(EVENTS.CLEAR_CANVAS, () => {
      strokesRef.current = [];
      clearCanvas();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, name, navigate, redrawAll, clearCanvas]);

  const handleJoinModalSubmit = useCallback((newName) => {
    setName(newName);
  }, []);

  const handleThrowEffect = useCallback((type) => {
    if (roomState.game.drawerId === socketRef.current?.id) return;
    setEffectUsage((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    socketRef.current?.emit(EVENTS.THROW_EFFECT, { type });
  }, [roomState.game.drawerId]);

  const handleAnimationEnd = useCallback((id) => {
    setFlyingEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Resize canvas when strokes change (initial load mostly)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resizeCanvas();
    redrawAll(roomState.strokes);
  }, [roomState.strokes.length, resizeCanvas, redrawAll]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !joined) return;
    resizeCanvas();
    redrawAll(strokesRef.current);
    const ro = new ResizeObserver(() => {
      resizeCanvas();
      redrawAll(strokesRef.current);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [joined, resizeCanvas, redrawAll]);

  const me = useMemo(() => {
    const socket = socketRef.current;
    if (!socket) return null;
    return roomState.players.find((p) => p.id === socket.id) || null;
  }, [roomState.players]);

  const isHost = roomState.hostId === socketRef.current?.id;
  const isDrawer = roomState.game.drawerId === socketRef.current?.id;
  const canDraw = isDrawer && roomState.game.started;
  
  const roundEndsAt = roomState.game.roundEndsAt;
  const roundDuration = roomState.game.roundDuration || 75; 
  
  // Memoize canShowReference calculation to avoid unnecessary re-renders
  // Actually this depends on time, but we only check it when rendering.
  // Since we removed timeLeft state, this logic needs to be robust.
  // We can just calculate it on render.
  let canShowReference = false;
  if (canDraw && roundEndsAt) {
    const remainingMs = roundEndsAt - Date.now();
    const elapsedSeconds = (roundDuration * 1000 - remainingMs) / 1000;
    canShowReference = elapsedSeconds >= 10;
  }

  const startGame = useCallback(() => {
    socketRef.current?.emit(EVENTS.START_GAME);
  }, []);

  const onSendMessage = useCallback((text) => {
    socketRef.current?.emit(EVENTS.CHAT_MESSAGE, text);
  }, []);

  const onPointerDown = useCallback((event) => {
    if (!isDrawer || !roomState.game.started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    lastPointRef.current = getPointerPosition(canvas, event);
  }, [isDrawer, roomState.game.started]);

  const onPointerMove = useCallback((event) => {
    if (!isDrawer || !roomState.game.started) return;
    if (!lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    // Use getCoalescedEvents for higher precision
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    
    let prev = lastPointRef.current;

    for (const e of events) {
      const now = getPointerPosition(canvas, e);
      
      // Skip if position hasn't changed
      if (now.x === prev.x && now.y === prev.y) continue;

      const stroke = {
        x0: prev.x / w,
        y0: prev.y / h,
        x1: now.x / w,
        y1: now.y / h,
        color: penColor,
        width: penWidth,
        normalized: true,
      };

      // Push to queues
      localDrawQueue.current.push(stroke);
      socketDrawQueue.current.push(stroke);
      strokesRef.current.push(stroke);

      prev = now;
    }
    
    lastPointRef.current = prev;
  }, [isDrawer, roomState.game.started, penColor, penWidth]);

  const onPointerUp = useCallback((event) => {
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(event.pointerId);
    lastPointRef.current = null;
  }, []);

  const clearByDrawer = useCallback(() => {
    if (!isDrawer) return;
    socketRef.current?.emit(EVENTS.CLEAR_CANVAS);
  }, [isDrawer]);

  const toggleFullScreen = useCallback(() => {
    const canvasWrap = canvasRef.current?.parentElement;
    if (!canvasWrap) return;

    if (!document.fullscreenElement) {
      canvasWrap.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Fetch reference images
  useEffect(() => {
    if (isDrawer && roomState.game.word) {
      setReferenceImages([]);
      
      const loadReferenceImages = async () => {
        setLoadingImages(true);
        try {
          const res = await fetch(`${SERVER_URL}/api/reference-images?word=${encodeURIComponent(roomState.game.word)}`);
          const data = await res.json();
          if (data.images) {
            setReferenceImages(data.images);
          }
        } catch (err) {
          console.error("Failed to fetch reference images", err);
        } finally {
          setLoadingImages(false);
        }
      };

      loadReferenceImages();
    }
  }, [isDrawer, roomState.game.word]);

  const handleShareLink = useCallback(() => {
    const hash = encryptRoomId(roomId);
    const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${hash}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setToast({ title: "链接已复制", message: "快去邀请好友加入游戏吧！" });
      }).catch((err) => {
        console.error("Clipboard write failed", err);
        alert("复制失败，请手动复制链接: " + url);
      });
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setToast({ title: "链接已复制", message: "快去邀请好友加入游戏吧！" });
      } else {
        alert("复制失败，请手动复制链接: " + url);
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
      alert("复制失败，请手动复制链接: " + url);
    }

    document.body.removeChild(textArea);
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    socketRef.current?.disconnect();
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!headerMenuRef.current) return;
      if (!headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  if (showJoinModal) {
    const randomName = "玩家" + Math.floor(1000 + Math.random() * 9000);
    return (
      <div className={styles["join-page"]}>
         <JoinRoomModal 
            roomId={roomId}
            defaultName={randomName}
            onJoin={handleJoinModalSubmit}
            onCancel={() => navigate("/")}
          />
         <div className={cx(styles["join-card"], styles["join-card-muted"])}>
            <h1>你画我猜</h1>
            <p className={styles.hint}>正在连接...</p>
         </div>
      </div>
    );
  }

  if (!joined) {
     return (
        <div className={styles["join-page"]}>
           <div className={cx(styles["join-card"], styles["join-card-centered"])}>
              <p className={styles["join-status-text"]}>正在加入房间...</p>
           </div>
        </div>
     );
  }

  return (
    <div className={styles.layout}>
      <a className={styles["skip-link"]} href="#game-main">
        跳到游戏内容
      </a>
      <aside className={styles["left-panel"]}>
        <div className={styles["room-header"]}>
          <h2>
            房间：{roomId}
            {!roomState.game.started && <span className={styles["room-status"]}>等待开始</span>}
          </h2>
          <div className={styles["header-actions"]} ref={headerMenuRef}>
            <button
              className={cx(styles["header-menu-trigger"], showHeaderMenu && styles.active)}
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              title="房间功能"
              aria-label="房间功能"
              aria-expanded={showHeaderMenu}
            >
              <Ellipsis size={18} />
            </button>
            {showHeaderMenu && (
              <div className={styles["header-menu-panel"]}>
                <button
                  className={styles["header-menu-item"]}
                  onClick={() => {
                    handleShareLink();
                    setShowHeaderMenu(false);
                  }}
                >
                  <Share2 size={16} />
                  <span>分享房间</span>
                </button>
                <button
                  className={styles["header-menu-item"]}
                  onClick={() => {
                    setShowRules(true);
                    setShowHeaderMenu(false);
                  }}
                >
                  <CircleHelp size={16} />
                  <span>游戏规则</span>
                </button>
                <button
                  className={cx(styles["header-menu-item"], styles["header-menu-item-danger"])}
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowLeaveConfirm(true);
                  }}
                >
                  <LogOut size={16} />
                  <span>退出房间</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={styles["status-row"]}>
          <span>玩家：{roomState.players.length}</span>
          <GameTimer roundEndsAt={roomState.game.roundEndsAt} />
        </div>

        {roomState.game.started && (
          <div className={styles["word-box"]} aria-live="polite">
            {isDrawer
              ? `你的词：${roomState.game.word || "等待回合"}`
              : roomState.game.maskedWord}
          </div>
        )}

        <div className={cx(styles["mobile-actions-row"], !(isHost && !roomState.game.started) && styles.single)}>
          {isHost && !roomState.game.started && (
            <button onClick={startGame} className={styles["start-btn"]}>
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
              玩家榜 ({roomState.players.length})
            </button>
          </div>
        </div>

        <PlayerList 
          players={roomState.players}
          drawerId={roomState.game.drawerId}
          hostId={roomState.hostId}
          guessedIds={roomState.game.guessedIds}
          showMobilePlayers={showMobilePlayers}
        />

        <p className={styles.me}>
          你：
          <span style={{ color: me ? getPlayerColor(me.id) : 'inherit', fontWeight: 600 }}>
            {me?.name || "-"}
          </span>
        </p>
      </aside>

      <main className={styles["board-panel"]} id="game-main">
        <div className={styles["canvas-wrap"]}>
          <CanvasControls
            showToolbar={showToolbar}
            setShowToolbar={setShowToolbar}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            penColor={penColor}
            setPenColor={setPenColor}
            penWidth={penWidth}
            setPenWidth={setPenWidth}
            canDraw={canDraw}
            clearByDrawer={clearByDrawer}
            isFullscreen={isFullscreen}
            toggleFullScreen={toggleFullScreen}
            canShowReference={canShowReference}
            setShowReferenceModal={setShowReferenceModal}
          />

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="绘图画布"
          />
        </div>

        <ChatBox 
          messages={messages}
          onSendMessage={onSendMessage}
          effectUsage={effectUsage}
          onThrowEffect={handleThrowEffect}
          gameStarted={roomState.game.started}
          isDrawer={isDrawer}
        />
      </main>
      
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showReferenceModal && (
        <div className={styles["modal-overlay"]}>
          <div className={cx(styles["modal-content"], styles["modal-content-ref"])}>
            <div className={styles["modal-header"]}>
              <h2>参考图 - {roomState.game.word}</h2>
              <button className={styles["close-btn"]} onClick={() => setShowReferenceModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={cx(styles["popup-content"], styles["ref-popup-content"])}>
              {loadingImages ? (
                <div className={styles["ref-loading"]}>正在生成参考图...</div>
              ) : referenceImages.length > 0 ? (
                <div className={styles["ref-grid"]}>
                  {referenceImages.map((url, idx) => (
                    <div key={idx} className={styles["ref-item"]}>
                      <img 
                        src={url} 
                        alt={`参考图 ${idx + 1}`} 
                        className={styles["ref-img"]}
                        onClick={() => window.open(url, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="${styles["ref-error-placeholder"]}">图片加载失败</div>`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles["ref-empty"]}>未找到相关参考图</div>
              )}
              <p className={styles["ref-hint"]}>
                *图片由 AI 实时生成，仅供参考，请勿直接照抄哦~
              </p>
            </div>
          </div>
        </div>
      )}

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
