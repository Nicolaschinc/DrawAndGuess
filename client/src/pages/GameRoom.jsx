import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Palette, Brush, Trash2, X, Settings, Share2 } from "lucide-react";
import { encryptRoomId } from "../utils/crypto";
import {
  EffectToolbar,
  EffectOverlay,
  RulesModal,
  RulesButton,
  JoinRoomModal,
  ToastModal,
} from "../components/GameUI";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV ? "http://localhost:3001" : window.location.origin);

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
  const [showMobilePlayers, setShowMobilePlayers] = useState(false);
  const [toast, setToast] = useState(null); // { title, message }

  const [effectUsage, setEffectUsage] = useState({});
  const [flyingEffects, setFlyingEffects] = useState([]);

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

    socket.on("connect", () => {
      // Once connected, try to join room
      socket.emit("join_room", { roomId, name }, (res) => {
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

    socket.on("disconnect", () => {
      setJoined(false);
    });

    socket.on("room_state", (state) => {
      setRoomState((prev) => {
        if (prev.game.drawerId !== state.game.drawerId) {
          setEffectUsage({});
        }
        return state;
      });
      redrawAll(state.strokes);
    });

    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, { type: "chat", ...msg }]);
    });

    socket.on("system_message", (msg) => {
      setMessages((prev) => [...prev, { type: "system", ...msg }]);
    });

    socket.on("effect_thrown", ({ type, senderId, targetId }) => {
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

    socket.on("draw", (stroke) => drawStroke(stroke));
    socket.on("clear_canvas", () => clearCanvas());

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
    socketRef.current?.emit("throw_effect", { type });
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
    redrawAll(roomState.strokes);
    const ro = new ResizeObserver(() => {
      resizeCanvas();
      redrawAll(roomState.strokes);
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

  const isHost = roomState.hostId === socketRef.current?.id;
  const isDrawer = roomState.game.drawerId === socketRef.current?.id;
  const canDraw = isDrawer && roomState.game.started;

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawStroke(stroke) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.x0, stroke.y0);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.stroke();
  }

  function redrawAll(strokes) {
    clearCanvas();
    for (const s of strokes) drawStroke(s);
  }

  function startGame() {
    socketRef.current?.emit("start_game");
  }

  function sendChat(event) {
    event.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat_message", chatInput.trim());
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

    const stroke = {
      x0: prev.x,
      y0: prev.y,
      x1: now.x,
      y1: now.y,
      color: penColor,
      width: penWidth,
    };

    drawStroke(stroke);
    socketRef.current?.emit("draw", stroke);
    lastPointRef.current = now;
  }

  function onPointerUp(event) {
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(event.pointerId);
    lastPointRef.current = null;
  }

  function clearByDrawer() {
    if (!isDrawer) return;
    socketRef.current?.emit("clear_canvas");
  }

  // If not joined and no name, show Join Modal
  if (showJoinModal) {
    const randomName = "玩家" + Math.floor(1000 + Math.random() * 9000);
    return (
      <div className="join-page">
         <JoinRoomModal 
            roomId={roomId}
            defaultName={randomName}
            onJoin={handleJoinModalSubmit}
            onCancel={() => navigate("/")}
          />
         {/* Background can be anything, but using join-page style for consistency */}
         <div className="join-card" style={{ opacity: 0.5, pointerEvents: "none" }}>
            <h1>你画我猜</h1>
            <p className="hint">正在连接...</p>
         </div>
      </div>
    );
  }

  if (!joined) {
     return (
        <div className="join-page">
           <div className="join-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
              <p style={{ margin: 0, color: "var(--ink-600)" }}>正在加入房间...</p>
           </div>
        </div>
     );
  }

  return (
    <div className="layout">
      <a className="skip-link" href="#game-main">
        跳到游戏内容
      </a>
      <aside className="left-panel">
        <div className="room-header">
          <h2>房间：{roomId}</h2>
          <div className="header-actions">
            <button 
              className="rules-btn icon-only"
              onClick={() => {
                const hash = encryptRoomId(roomId);
                const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${hash}`;
                
                // Fallback for non-secure contexts (http) or older browsers
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(url).then(() => {
                    setToast({ title: "链接已复制", message: "快去邀请好友加入游戏吧！" });
                  }).catch(err => {
                    console.error("Clipboard write failed", err);
                    alert("复制失败，请手动复制链接: " + url);
                  });
                } else {
                  // Fallback method using textarea
                  const textArea = document.createElement("textarea");
                  textArea.value = url;
                  textArea.style.position = "fixed";
                  textArea.style.left = "-9999px";
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  
                  try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                      setToast({ title: "链接已复制", message: "快去邀请好友加入游戏吧！" });
                    } else {
                      alert("复制失败，请手动复制链接: " + url);
                    }
                  } catch (err) {
                    console.error('Fallback copy failed', err);
                    alert("复制失败，请手动复制链接: " + url);
                  }
                  
                  document.body.removeChild(textArea);
                }
              }}
              title="分享房间链接"
            >
              <Share2 size={20} />
            </button>
            <RulesButton onClick={() => setShowRules(true)} />
          </div>
        </div>
        <div className="status-row">
          <span>玩家：{roomState.players.length}</span>
          <span aria-live="polite">剩余：{timeLeft}秒</span>
        </div>

        <div className="word-box" aria-live="polite">
          {isDrawer
            ? `你的词：${roomState.game.word || "等待回合"}`
            : roomState.game.maskedWord || "等待游戏开始"}
        </div>

        <div className={`mobile-actions-row ${isHost ? "" : "single"}`}>
          {isHost && (
            <button onClick={startGame} className="start-btn">
              开始游戏
            </button>
          )}

          <div className="mobile-players-toggle-wrap">
            <button
              type="button"
              className={`mobile-players-toggle ${showMobilePlayers ? "active" : ""}`}
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
          className={`players ${showMobilePlayers ? "is-open" : "is-collapsed"}`}
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
                {p.name}
                {p.id === roomState.game.drawerId ? " (画家)" : ""}
                {p.id === roomState.hostId ? " (房主)" : ""}
                {roomState.game.guessedIds.includes(p.id) ? " (已猜中)" : ""}
              </span>
              <strong>{p.score}</strong>
            </li>
          ))}
        </ul>

        <p className="me">你：{me?.name || "-"}</p>
      </aside>

      <main className="board-panel" id="game-main">
        <div className="canvas-wrap">
          <button 
            className={`toolbar-trigger ${showToolbar ? 'active' : ''}`}
            onClick={() => setShowToolbar(!showToolbar)}
            title="工具栏"
          >
            <Settings size={20} />
          </button>

          {showToolbar && (
            <div className="floating-toolbar">
              <div className="tool-group">
                <button
                  className={`tool-btn ${activeTool === "color" ? "active" : ""}`}
                  onClick={() => setActiveTool(activeTool === "color" ? null : "color")}
                  disabled={!canDraw}
                  title="颜色"
                  aria-label="选择颜色"
                  aria-expanded={activeTool === "color"}
                >
                  <Palette size={20} />
                  <span className="color-indicator" style={{ backgroundColor: penColor }} />
                </button>
                {activeTool === "color" && (
                  <div className="tool-popup color-popup">
                    <div className="popup-header">
                      <span>选择颜色</span>
                      <button className="popup-close" onClick={() => setActiveTool(null)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="popup-content">
                      <input
                        type="color"
                        className="color-picker-input"
                        value={penColor}
                        onChange={(e) => setPenColor(e.target.value)}
                      />
                      <div className="color-presets">
                        {["#111111", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"].map(c => (
                          <button
                            key={c}
                            className="color-preset-btn"
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

              <div className="tool-group">
                <button
                  className={`tool-btn ${activeTool === "width" ? "active" : ""}`}
                  onClick={() => setActiveTool(activeTool === "width" ? null : "width")}
                  disabled={!canDraw}
                  title="笔刷大小"
                  aria-label="调整笔刷大小"
                  aria-expanded={activeTool === "width"}
                >
                  <Brush size={20} />
                  <span className="width-indicator">{penWidth}</span>
                </button>
                {activeTool === "width" && (
                  <div className="tool-popup width-popup">
                    <div className="popup-header">
                      <span>笔刷大小</span>
                      <button className="popup-close" onClick={() => setActiveTool(null)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="popup-content">
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={penWidth}
                        onChange={(e) => setPenWidth(Number(e.target.value))}
                        className="width-slider"
                      />
                      <div className="width-preview-box">
                        <div
                          className="width-preview-dot"
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

              <div className="tool-divider" />

              <button
                className="tool-btn danger"
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
            className="canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="绘图画布"
          />
        </div>

        <section className="chat-box">
          <ul className="messages" role="log" aria-live="polite" aria-label="聊天消息">
            {messages.map((m, idx) => (
              <li key={idx} className={m.type === "system" ? "msg-system" : "msg-chat"}>
                {m.type === "system" ? m.text : `${m.sender}: ${m.text}`}
              </li>
            ))}
          </ul>
          <EffectToolbar 
            onThrow={handleThrowEffect} 
            usage={effectUsage} 
            disabled={!roomState.game.started || isDrawer} 
          />
          <form onSubmit={sendChat} className="chat-form">
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
