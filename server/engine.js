import { rooms } from "./roomStore.js";
import { getRandomWord } from "./wordManager.js";
import { 
  startRoundState, 
  endRoundState, 
  shouldEndGame, 
  calculateNextDrawer,
  ROUND_SECONDS 
} from "./gameLogic.js";
import { EVENTS } from "../shared/events.mjs";

export function pickWord(room) {
  const picked = getRandomWord(room.language, room.game.usedWords);
  if (picked && picked.word) {
    room.game.usedWords.add(picked.word);
  }
  return picked;
}

export function roomStateFor(room, viewerId) {
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
      roundDuration: ROUND_SECONDS,
      word: game.drawerId === viewerId ? game.currentWord : null,
      maskedWord:
        game.currentWord && game.drawerId !== viewerId
          ? {
              category: game.currentCategory || "系统",
              length: game.currentWord.length,
              hint: game.currentHint || null,
            }
          : null,
    },
    strokes: room.strokes,
  };
}

export function broadcastRoom(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const socketId of room.playerOrder) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    socket.emit(EVENTS.ROOM_STATE, roomStateFor(room, socketId));
  }
}

export function nextDrawer(room) {
  room.playerOrder = room.playerOrder.filter((id) => room.players.has(id));
  return calculateNextDrawer(room.playerOrder, room.game.drawerId);
}

export function stopRound(room) {
  if (room.game.timer) {
    clearTimeout(room.game.timer);
    room.game.timer = null;
  }
  if (room.game.hintTimers) {
    room.game.hintTimers.forEach(t => clearTimeout(t));
    room.game.hintTimers = [];
  }
}

export function endRound(io, roomId, reason = "timeout") {
  const room = rooms.get(roomId);
  if (!room || !room.game.started) return;

  stopRound(room);

  io.to(roomId).emit(EVENTS.SYSTEM_MESSAGE, {
    key: reason === "all_guessed" ? "system.roundEnd" : "system.timeout",
    args: { word: room.game.currentWord },
    text:
      reason === "all_guessed"
        ? `回合结束，答案是「${room.game.currentWord}」。`
        : `时间到，答案是「${room.game.currentWord}」。`,
  });

  if (!room.game.drawnPlayers) {
    room.game.drawnPlayers = new Set();
  }

  // Check if all players have been the drawer
  const allDrawn = shouldEndGame(room.playerOrder, room.game.drawnPlayers);

  if (allDrawn) {
    room.game.started = false;
    io.to(roomId).emit(EVENTS.SYSTEM_MESSAGE, {
      key: "system.gameOver",
      text: "游戏结束！所有玩家都已作画。",
    });
    broadcastRoom(io, roomId);
    return;
  }

  const nextId = nextDrawer(room);
  room.game.drawerId = nextId;
  
  if (nextId) {
    room.game.drawnPlayers.add(nextId);
  }
  
  Object.assign(room.game, endRoundState());
  room.strokes = [];

  if (!room.game.drawerId) {
    room.game.started = false;
    return;
  }

  startRound(io, roomId);
}

export function startRound(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.playerOrder = room.playerOrder.filter((id) => room.players.has(id));
  if (room.playerOrder.length < 2) {
    room.game.started = false;
    io.to(roomId).emit(EVENTS.SYSTEM_MESSAGE, {
      key: "system.minPlayers",
      text: "至少需要 2 名玩家才能开始。",
    });
    broadcastRoom(io, roomId);
    return;
  }

  if (!room.game.drawerId || !room.players.has(room.game.drawerId)) {
    const nextId = nextDrawer(room);
    room.game.drawerId = nextId;
    if (nextId) {
      if (!room.game.drawnPlayers) room.game.drawnPlayers = new Set();
      room.game.drawnPlayers.add(nextId);
    }
  }

  const picked = pickWord(room);
  const newState = startRoundState({
    word: picked.word,
    category: picked.category,
    hints: picked.hints || []
  }, Date.now());

  Object.assign(room.game, newState);
  
  // Setup hint timers if hints are available
  if (room.game.allHints.length > 0) {
    // Hint 1: Immediate
    room.game.currentHint = room.game.allHints[0];
    
    // Hint 2: 25s
    const t1 = setTimeout(() => {
      if (room.game.started && room.game.allHints[1]) {
        room.game.currentHint = room.game.allHints[1];
        broadcastRoom(io, roomId);
      }
    }, 25000);
    room.game.hintTimers.push(t1);

    // Hint 3: 50s
    const t2 = setTimeout(() => {
      if (room.game.started && room.game.allHints[2]) {
        room.game.currentHint = room.game.allHints[2];
        broadcastRoom(io, roomId);
      }
    }, 50000);
    room.game.hintTimers.push(t2);
  }
  
  room.strokes = [];

  room.game.timer = setTimeout(() => endRound(io, roomId, "timeout"), ROUND_SECONDS * 1000);

  const drawer = room.players.get(room.game.drawerId);
  const drawerName = drawer?.name || "画家";
  
  io.to(roomId).emit(EVENTS.CLEAR_CANVAS);
  io.to(roomId).emit(EVENTS.SYSTEM_MESSAGE, {
    key: "system.drawing",
    args: { username: drawerName },
    text: `${drawerName} 正在画。`,
    relatedUser: drawer ? { id: room.game.drawerId, name: drawerName } : null,
  });

  broadcastRoom(io, roomId);
}
