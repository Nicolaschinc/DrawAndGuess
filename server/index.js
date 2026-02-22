import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;
const ROUND_SECONDS = 75;
const WORDS = [
  "猫",
  "房子",
  "香蕉",
  "飞机",
  "电脑",
  "吉他",
  "龙",
  "机器人",
  "山",
  "相机",
  "披萨",
  "彩虹",
  "自行车",
  "蝴蝶",
  "企鹅",
  "太阳",
  "月亮",
  "苹果",
  "汽车",
  "雨伞",
];

const rooms = new Map();

function makeRoom() {
  return {
    players: new Map(),
    playerOrder: [],
    hostId: null,
    game: {
      started: false,
      roundEndsAt: null,
      currentWord: null,
      drawerId: null,
      guessed: new Set(),
      timer: null,
    },
    strokes: [],
  };
}

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, makeRoom());
  }
  return rooms.get(roomId);
}

function roomStateFor(room, viewerId) {
  const { game } = room;
  const players = room.playerOrder
    .filter((id) => room.players.has(id))
    .map((id) => {
      const p = room.players.get(id);
      return {
        id,
        name: p.name,
        score: p.score,
      };
    });

  return {
    players,
    hostId: room.hostId,
    game: {
      started: game.started,
      drawerId: game.drawerId,
      roundEndsAt: game.roundEndsAt,
      guessedIds: Array.from(game.guessed),
      word: game.drawerId === viewerId ? game.currentWord : null,
      maskedWord:
        game.currentWord && game.drawerId !== viewerId
          ? "□".repeat(game.currentWord.length)
          : null,
    },
    strokes: room.strokes,
  };
}

function broadcastRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const socketId of room.playerOrder) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    socket.emit("room_state", roomStateFor(room, socketId));
  }
}

function nextDrawer(room) {
  room.playerOrder = room.playerOrder.filter((id) => room.players.has(id));
  if (!room.playerOrder.length) return null;

  const current = room.game.drawerId;
  if (!current || !room.playerOrder.includes(current)) {
    return room.playerOrder[0];
  }

  const idx = room.playerOrder.indexOf(current);
  return room.playerOrder[(idx + 1) % room.playerOrder.length];
}

function stopRound(room) {
  if (room.game.timer) {
    clearTimeout(room.game.timer);
    room.game.timer = null;
  }
}

function endRound(roomId, reason = "timeout") {
  const room = rooms.get(roomId);
  if (!room || !room.game.started) return;

  stopRound(room);

  io.to(roomId).emit("system_message", {
    text:
      reason === "all_guessed"
        ? `回合结束，答案是「${room.game.currentWord}」。`
        : `时间到，答案是「${room.game.currentWord}」。`,
  });

  room.game.drawerId = nextDrawer(room);
  room.game.currentWord = null;
  room.game.roundEndsAt = null;
  room.game.guessed = new Set();
  room.strokes = [];

  if (!room.game.drawerId) {
    room.game.started = false;
    return;
  }

  startRound(roomId);
}

function startRound(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.playerOrder = room.playerOrder.filter((id) => room.players.has(id));
  if (room.playerOrder.length < 2) {
    room.game.started = false;
    io.to(roomId).emit("system_message", {
      text: "至少需要 2 名玩家才能开始。",
    });
    broadcastRoom(roomId);
    return;
  }

  if (!room.game.drawerId || !room.players.has(room.game.drawerId)) {
    room.game.drawerId = nextDrawer(room);
  }

  room.game.started = true;
  room.game.currentWord = pickWord();
  room.game.roundEndsAt = Date.now() + ROUND_SECONDS * 1000;
  room.game.guessed = new Set();
  room.strokes = [];

  io.to(roomId).emit("clear_canvas");
  io.to(roomId).emit("system_message", {
    text: `${room.players.get(room.game.drawerId)?.name || "画家"}正在画。`,
  });

  stopRound(room);
  room.game.timer = setTimeout(() => endRound(roomId, "timeout"), ROUND_SECONDS * 1000);

  broadcastRoom(roomId);
}

io.on("connection", (socket) => {
  socket.on("join_room", ({ roomId, name }, cb = () => {}) => {
    const safeRoomId = String(roomId || "").trim().toLowerCase().slice(0, 24);
    const safeName = String(name || "").trim().slice(0, 20);

    if (!safeRoomId || !safeName) {
      cb({ ok: false, error: "请填写房间 ID 和名称。" });
      return;
    }

    const room = getRoom(safeRoomId);

    socket.join(safeRoomId);
    socket.data.roomId = safeRoomId;

    room.players.set(socket.id, {
      name: safeName,
      score: 0,
    });

    if (!room.playerOrder.includes(socket.id)) {
      room.playerOrder.push(socket.id);
    }

    if (!room.hostId || !room.players.has(room.hostId)) {
      room.hostId = socket.id;
    }

    io.to(safeRoomId).emit("system_message", { text: `${safeName} 加入了房间。` });
    broadcastRoom(safeRoomId);
    cb({ ok: true });
  });

  socket.on("start_game", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;

    room.game.drawerId = nextDrawer(room);
    startRound(roomId);
  });

  socket.on("draw", (stroke) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.game.drawerId !== socket.id || !room.game.started) return;

    const safeStroke = {
      x0: Number(stroke?.x0),
      y0: Number(stroke?.y0),
      x1: Number(stroke?.x1),
      y1: Number(stroke?.y1),
      color: String(stroke?.color || "#111111").slice(0, 10),
      width: Math.max(1, Math.min(24, Number(stroke?.width) || 4)),
    };

    room.strokes.push(safeStroke);
    socket.to(roomId).emit("draw", safeStroke);
  });

  socket.on("clear_canvas", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.game.drawerId !== socket.id) return;

    room.strokes = [];
    io.to(roomId).emit("clear_canvas");
  });

  socket.on("chat_message", (text) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const msg = String(text || "").trim().slice(0, 100);
    if (!msg) return;

    const normalized = msg.trim();
    const word = room.game.currentWord?.trim();
    const isDrawer = room.game.drawerId === socket.id;

    if (
      room.game.started &&
      word &&
      !isDrawer &&
      !room.game.guessed.has(socket.id) &&
      normalized === word
    ) {
      room.game.guessed.add(socket.id);

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((room.game.roundEndsAt - now) / 1000));
      const guesserScore = 10 + Math.floor(remaining / 5);
      const drawerScore = 5;

      player.score += guesserScore;
      const drawer = room.players.get(room.game.drawerId);
      if (drawer) drawer.score += drawerScore;

      io.to(roomId).emit("system_message", {
        text: `${player.name} 猜对了！(+${guesserScore} 分)`,
      });

      broadcastRoom(roomId);

      const activeGuessers = room.playerOrder.filter(
        (id) => id !== room.game.drawerId && room.players.has(id)
      ).length;

      if (room.game.guessed.size >= activeGuessers && activeGuessers > 0) {
        endRound(roomId, "all_guessed");
      }

      return;
    }

    io.to(roomId).emit("chat_message", {
      sender: player.name,
      text: msg,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const leaving = room.players.get(socket.id);
    room.players.delete(socket.id);
    room.playerOrder = room.playerOrder.filter((id) => id !== socket.id);
    room.game.guessed.delete(socket.id);

    if (leaving) {
      io.to(roomId).emit("system_message", {
        text: `${leaving.name} 离开了房间。`,
      });
    }

    if (room.hostId === socket.id) {
      room.hostId = room.playerOrder[0] || null;
    }

    if (!room.players.size) {
      stopRound(room);
      rooms.delete(roomId);
      return;
    }

    if (room.game.drawerId === socket.id) {
      room.game.drawerId = nextDrawer(room);
      if (room.game.started) {
        startRound(roomId);
      }
    }

    broadcastRoom(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
