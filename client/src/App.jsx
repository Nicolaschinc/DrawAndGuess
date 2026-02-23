import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

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

function RulesModal({ onClose }) {
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

function RulesButton({ onClick, className = "", iconOnly = false }) {
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

export default function App() {
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPointRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");

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
  const [timeLeft, setTimeLeft] = useState(0);

  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => {
      setConnected(false);
      setJoined(false);
    });

    socket.on("room_state", (state) => {
      setRoomState(state);
      redrawAll(state.strokes);
    });

    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, { type: "chat", ...msg }]);
    });

    socket.on("system_message", (msg) => {
      setMessages((prev) => [...prev, { type: "system", ...msg }]);
    });

    socket.on("draw", (stroke) => drawStroke(stroke));

    socket.on("clear_canvas", () => clearCanvas());

    return () => {
      socket.disconnect();
    };
  }, []);


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
  const joinDisabled = !connected || !name.trim() || !roomId.trim();
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

  function sendJoin() {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("join_room", { roomId, name }, (res) => {
      if (!res?.ok) {
        alert(res?.error || "加入失败");
        return;
      }
      setJoined(true);
      setMessages([]);
    });
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


  if (!joined) {
    return (
      <div className="join-page">
        <div className="join-card">
          <h1>你画我猜</h1>
          <p className="hint" aria-live="polite">
            <span className={`status-dot ${connected ? "online" : "offline"}`} aria-hidden="true" />
            {connected ? "服务器已连接，准备开始" : "正在连接服务器..."}
          </p>
          <label className="field">
            <span>你的名称</span>
            <input
              name="player_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入昵称，例如小王…"
              maxLength={20}
              autoComplete="nickname"
              spellCheck={false}
            />
          </label>
          <label className="field">
            <span>房间 ID</span>
            <input
              name="room_id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="例如 room1…"
              maxLength={24}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <button onClick={sendJoin} disabled={joinDisabled}>
            进入房间
          </button>
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
          <RulesButton onClick={() => setShowRules(true)} />
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

        {isHost && (
          <button onClick={startGame} className="start-btn">
            开始游戏
          </button>
        )}

        <ul className="players">
          {roomState.players.map((p) => (
            <li key={p.id}>
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
        <div className="tool-row">
          <label>
            颜色
            <input
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              disabled={!canDraw}
            />
          </label>
          <label>
            笔粗
            <input
              type="range"
              min="1"
              max="24"
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              disabled={!canDraw}
            />
          </label>
          <button onClick={clearByDrawer} disabled={!canDraw}>
            清空画布
          </button>
        </div>

        <div className="canvas-wrap">
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
    </div>
  );
}
