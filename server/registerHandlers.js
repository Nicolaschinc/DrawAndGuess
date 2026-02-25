import { rooms, getRoom } from "./roomStore.js";
import { 
  broadcastRoom, 
  nextDrawer, 
  stopRound, 
  startRound, 
  endRound 
} from "./engine.js";
import { 
  calculateGuesserScore, 
  calculateDrawerScore, 
  shouldEndRound 
} from "./gameLogic.js";
import { EVENTS } from "../shared/events.mjs";

export default function registerSocketHandlers(io) {
  io.on(EVENTS.CONNECTION, (socket) => {
    socket.on(EVENTS.JOIN_ROOM, ({ roomId, name }, cb = () => {}) => {
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

      io.to(safeRoomId).emit(EVENTS.SYSTEM_MESSAGE, { 
        text: `${safeName} 加入了房间。`,
        relatedUser: { id: socket.id, name: safeName }
      });
      broadcastRoom(io, safeRoomId);
      cb({ ok: true });
    });

    socket.on(EVENTS.START_GAME, () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room || room.hostId !== socket.id) return;

      room.game.drawnPlayers = new Set();
      const firstDrawer = nextDrawer(room);
      room.game.drawerId = firstDrawer;
      
      if (firstDrawer) {
        room.game.drawnPlayers.add(firstDrawer);
      }

      startRound(io, roomId);
    });

    socket.on(EVENTS.DRAW, (data) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.game.drawerId !== socket.id || !room.game.started) return;

      // Handle both single stroke and batched strokes
      const strokes = Array.isArray(data) ? data : [data];
      
      const safeStrokes = strokes.map(stroke => ({
        x0: Number(stroke?.x0),
        y0: Number(stroke?.y0),
        x1: Number(stroke?.x1),
        y1: Number(stroke?.y1),
        color: String(stroke?.color || "#111111").slice(0, 10),
        width: Math.max(1, Math.min(24, Number(stroke?.width) || 4)),
        normalized: !!stroke?.normalized,
      }));

      if (safeStrokes.length > 0) {
        room.strokes.push(...safeStrokes);
        // Emit batch to clients
        socket.to(roomId).emit(EVENTS.DRAW, safeStrokes);
      }
    });

    socket.on(EVENTS.CLEAR_CANVAS, () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.game.drawerId !== socket.id) return;

      room.strokes = [];
      io.to(roomId).emit(EVENTS.CLEAR_CANVAS);
    });

    socket.on(EVENTS.CHAT_MESSAGE, (text) => {
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
        const guesserScore = calculateGuesserScore(remaining);
        const drawerScore = calculateDrawerScore();

        player.score += guesserScore;
        const drawer = room.players.get(room.game.drawerId);
        if (drawer) drawer.score += drawerScore;

        io.to(roomId).emit(EVENTS.SYSTEM_MESSAGE, {
          text: `${player.name} 猜对了！(+${guesserScore} 分)`,
          relatedUser: { id: socket.id, name: player.name }
        });

        broadcastRoom(io, roomId);

        // activeGuessers logic logic is implicitly handled by shouldEndRound if we pass total players
        // However, to be safe and match logic, let's look at what we pass.
        // shouldEndRound takes (guessedCount, totalPlayers). 
        // It assumes totalPlayers includes drawer.
        // room.playerOrder contains all players.
        
        // We need to ensure room.playerOrder only has present players, which engine usually does.
        // But here we are in handler.
        const currentTotalPlayers = room.playerOrder.filter(id => room.players.has(id)).length;

        if (shouldEndRound(room.game.guessed.size, currentTotalPlayers)) {
          endRound(io, roomId, "all_guessed");
        }

        return;
      }

      io.to(roomId).emit(EVENTS.CHAT_MESSAGE, {
        sender: player.name,
        senderId: socket.id,
        text: msg,
      });
    });

    socket.on(EVENTS.THROW_EFFECT, ({ type }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || !room.game.started) return;
      
      // Only spectators can throw effects
      if (room.game.drawerId === socket.id) return;

      const allowedEffects = ["🌸", "🩴", "🥚", "💋", "💣"];
      if (!allowedEffects.includes(type)) return;

      // Check usage limit
      if (!room.game.effectUsage.has(socket.id)) {
        room.game.effectUsage.set(socket.id, {});
      }
      const userUsage = room.game.effectUsage.get(socket.id);
      const currentCount = userUsage[type] || 0;

      if (currentCount >= 5) return;

      userUsage[type] = currentCount + 1;

      // Broadcast effect
      io.to(roomId).emit(EVENTS.EFFECT_THROWN, {
        type,
        senderId: socket.id,
        targetId: room.game.drawerId,
      });
    });

    socket.on(EVENTS.DISCONNECT, () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const leaving = room.players.get(socket.id);
      room.players.delete(socket.id);
      room.playerOrder = room.playerOrder.filter((id) => id !== socket.id);
      room.game.guessed.delete(socket.id);

      if (leaving) {
        io.to(roomId).emit(EVENTS.SYSTEM_MESSAGE, {
          text: `${leaving.name} 离开了房间。`,
          relatedUser: { id: socket.id, name: leaving.name }
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
        const nextId = nextDrawer(room);
        room.game.drawerId = nextId;
        if (nextId && room.game.started) {
          if (!room.game.drawnPlayers) room.game.drawnPlayers = new Set();
          room.game.drawnPlayers.add(nextId);
          startRound(io, roomId);
        }
      }

      broadcastRoom(io, roomId);
    });
  });
}
