import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Palette, Brush, Trash2, X, Settings, Share2, LogOut, Ellipsis, CircleHelp, Image as ImageIcon, Maximize, Minimize } from "lucide-react";
import { encryptRoomId } from "../utils/crypto";
import { getPlayerColor } from "../utils/playerColor";
import { EVENTS } from "@shared/events.mjs";
import {
  EffectToolbar,
  EffectOverlay,
  RulesModal,
  JoinRoomModal,
  ToastModal,
  ConfirmModal,
} from "../components/GameUI";
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

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [penColor, setPenColor] = useState("#111111");
  const [penWidth, setPenWidth] = useState(4);
  const [activeTool, setActiveTool] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

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

  // Handle joining when name is available
  useEffect(() => {
    // If already joined, do nothing
    if (joined) return;

    // If no name is provided, show the join modal (handled by rendering logic below)
    if (!name) return;

    // Clean up any existing socket connection to prevent duplicates
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on(EVENTS.CONNECT, () => {
      // Once connected, try to join room
      socket.emit(EVENTS.JOIN_ROOM, { roomId, name }, (res) => {
        if (!res?.ok) {
          alert(res?.error || "加入失败");
          navigate("/"); // Go back home on failure
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

    socket.on(EVENTS.DRAW, (stroke) => {
      strokesRef.current.push(stroke);
      drawStroke(stroke);
    });
    socket.on(EVENTS.CLEAR_CANVAS, () => {
      strokesRef.current = [];
      clearCanvas();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, name, navigate]);

  function handleJoinModalSubmit(newName) {
    setName(newName);
    // The effect will trigger join
  }

  function handleThrowEffect(type) {
    if (isDrawer) return;
    setEffectUsage((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    socketRef.current?.emit(EVENTS.THROW_EFFECT, { type });
  }

  function handleAnimationEnd(id) {
    setFlyingEffects((prev) => prev.filter((e) => e.id !== id));
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resizeCanvas();
    redrawAll(roomState.strokes);
  }, [roomState.strokes.length]);

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
  }, [joined]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (!roomState.game.roundEndsAt) {
        setTimeLeft(0);
        return;
      }
      const left = Math.max(0, Math.ceil((roomState.game.roundEndsAt - Date.now()) / 1000));
      setTimeLeft(left);
    }, 300);

    return () => clearInterval(tick);
  }, [roomState.game.roundEndsAt]);

  const me = useMemo(() => {
    const socket = socketRef.current;
    if (!socket) return null;
    return roomState.players.find((p) => p.id === socket.id) || null;
  }, [roomState.players]);

  const renderSystemMessage = (msg) => {
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

  const isHost = roomState.hostId === socketRef.current?.id;
  const isDrawer = roomState.game.drawerId === socketRef.current?.id;
  const canDraw = isDrawer && roomState.game.started;
  
  // Calculate if 10 seconds have passed in the current round
  // Use Date.now() directly to ensure accuracy and avoid state sync issues
  const roundEndsAt = roomState.game.roundEndsAt;
  const roundDuration = roomState.game.roundDuration || 75; 
  
  let canShowReference = false;
  if (canDraw && roundEndsAt) {
    const remainingMs = roundEndsAt - Date.now();
    const elapsedSeconds = (roundDuration * 1000 - remainingMs) / 1000;
    canShowReference = elapsedSeconds >= 10;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawStroke(stroke) {
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

    // Check if stroke is normalized (flag or heuristic)
    // We prefer the explicit flag, but fallback to heuristic for safety during transition
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
  }

  function redrawAll(strokes) {
    clearCanvas();
    for (const s of strokes) drawStroke(s);
  }

  function startGame() {
    socketRef.current?.emit(EVENTS.START_GAME);
  }

  function sendChat(event) {
    event.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit(EVENTS.CHAT_MESSAGE, chatInput.trim());
    setChatInput("");
  }

  function onPointerDown(event) {
    if (!isDrawer || !roomState.game.started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    lastPointRef.current = getPointerPosition(canvas, event);
  }

  function onPointerMove(event) {
    if (!isDrawer || !roomState.game.started) return;
    if (!lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();

    const now = getPointerPosition(canvas, event);
    const prev = lastPointRef.current;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const stroke = {
      x0: prev.x / w,
      y0: prev.y / h,
      x1: now.x / w,
      y1: now.y / h,
      color: penColor,
      width: penWidth,
      normalized: true,
    };

    drawStroke(stroke);
    strokesRef.current.push(stroke);
    socketRef.current?.emit(EVENTS.DRAW, stroke);
    lastPointRef.current = now;
  }

  function onPointerUp(event) {
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(event.pointerId);
    lastPointRef.current = null;
  }

  function clearByDrawer() {
    if (!isDrawer) return;
    socketRef.current?.emit(EVENTS.CLEAR_CANVAS);
  }

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

  function handleShareLink() {
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
  }

  function leaveRoom() {
    socketRef.current?.disconnect();
    navigate("/");
  }

  function toggleFullScreen() {
    const canvasWrap = canvasRef.current?.parentElement;
    if (!canvasWrap) return;

    if (!document.fullscreenElement) {
      canvasWrap.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }

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

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If not joined and no name, show Join Modal
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
         {/* Background can be anything, but using join-page style for consistency */}
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
          <span aria-live="polite">剩余：{timeLeft}秒</span>
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

        <ul
          id="players-list"
          className={cx(styles.players, !showMobilePlayers && styles["is-collapsed"])}
        >
          {[...roomState.players]
            .sort((a, b) => {
              if (a.id === roomState.game.drawerId) return -1;
              if (b.id === roomState.game.drawerId) return 1;
              return 0;
            })
            .map((p) => (
            <li key={p.id} id={`player-${p.id}`}>
              <span>
                <span style={{ color: getPlayerColor(p.id), fontWeight: 600 }}>{p.name}</span>
                {p.id === roomState.game.drawerId ? " (画家)" : ""}
                {p.id === roomState.hostId ? " (房主)" : ""}
                {roomState.game.guessedIds.includes(p.id) ? " (已猜中)" : ""}
              </span>
              <strong>{p.score}</strong>
            </li>
          ))}
        </ul>

        <p className={styles.me}>
          你：
          <span style={{ color: me ? getPlayerColor(me.id) : 'inherit', fontWeight: 600 }}>
            {me?.name || "-"}
          </span>
        </p>
      </aside>

      <main className={styles["board-panel"]} id="game-main">
        <div className={styles["canvas-wrap"]}>
          <button 
            className={cx(styles["toolbar-trigger"], showToolbar && styles.active)}
            onClick={() => setShowToolbar(!showToolbar)}
            title="工具栏"
          >
            <Settings size={20} />
          </button>

          {canShowReference && (
            <button
              className={cx(styles["toolbar-trigger"], styles["toolbar-trigger-ai"])}
              onClick={() => setShowReferenceModal(true)}
              disabled={!canDraw}
              title="AI 参考图"
              aria-label="AI 参考图"
            >
              <ImageIcon size={20} />
            </button>
          )}

          {showToolbar && (
            <div className={cx(styles["floating-toolbar"])}>
              <div className={styles["tool-group"]}>
                <button
                  className={cx(styles["tool-btn"], activeTool === "color" && styles.active)}
                  onClick={() => setActiveTool(activeTool === "color" ? null : "color")}
                  disabled={!canDraw}
                  title="颜色"
                  aria-label="选择颜色"
                  aria-expanded={activeTool === "color"}
                >
                  <Palette size={20} />
                  <span className={styles["color-indicator"]} style={{ backgroundColor: penColor }} />
                </button>
                {activeTool === "color" && (
                  <div className={styles["tool-popup"]}>
                    <div className={styles["popup-header"]}>
                      <span>选择颜色</span>
                      <button className={styles["popup-close"]} onClick={() => setActiveTool(null)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className={styles["popup-content"]}>
                      <input
                        type="color"
                        className={styles["color-picker-input"]}
                        value={penColor}
                        onChange={(e) => setPenColor(e.target.value)}
                      />
                      <div className={styles["color-presets"]}>
                        {["#111111", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"].map(c => (
                          <button
                            key={c}
                            className={styles["color-preset-btn"]}
                            style={{ backgroundColor: c }}
                            onClick={() => setPenColor(c)}
                            aria-label={`选择颜色 ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles["tool-group"]}>
                <button
                  className={cx(styles["tool-btn"], activeTool === "width" && styles.active)}
                  onClick={() => setActiveTool(activeTool === "width" ? null : "width")}
                  disabled={!canDraw}
                  title="笔刷大小"
                  aria-label="调整笔刷大小"
                  aria-expanded={activeTool === "width"}
                >
                  <Brush size={20} />
                  <span className={styles["width-indicator"]}>{penWidth}</span>
                </button>
                {activeTool === "width" && (
                  <div className={styles["tool-popup"]}>
                    <div className={styles["popup-header"]}>
                      <span>笔刷大小</span>
                      <button className={styles["popup-close"]} onClick={() => setActiveTool(null)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className={styles["popup-content"]}>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={penWidth}
                        onChange={(e) => setPenWidth(Number(e.target.value))}
                        className={styles["width-slider"]}
                      />
                      <div className={styles["width-preview-box"]}>
                        <div
                          className={styles["width-preview-dot"]}
                          style={{
                            width: penWidth,
                            height: penWidth,
                            backgroundColor: penColor
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles["tool-divider"]} />

              <button
                className={cx(styles["tool-btn"], styles.danger)}
                onClick={clearByDrawer}
                disabled={!canDraw}
                title="清空画布"
                aria-label="清空画布"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

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

          <button
            className={styles["fullscreen-trigger"]}
            onClick={toggleFullScreen}
            title={isFullscreen ? "退出全屏" : "全屏模式"}
            aria-label={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>

        <section className={styles["chat-box"]}>
          <ul className={styles.messages} role="log" aria-live="polite" aria-label="聊天消息">
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
            onThrow={handleThrowEffect} 
            usage={effectUsage} 
            disabled={!roomState.game.started || isDrawer} 
          />
          <form onSubmit={sendChat} className={styles["chat-form"]}>
            <input
              name="chat_message"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="输入猜测或聊天内容…"
              autoComplete="off"
              maxLength={100}
            />
            <button type="submit">发送</button>
          </form>
        </section>
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
