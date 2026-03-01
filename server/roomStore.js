export const rooms = new Map();

export function makeRoom() {
  return {
    players: new Map(),
    playerOrder: [],
    hostId: null,
    language: 'zh',
    game: {
      started: false,
      roundEndsAt: null,
      currentWord: null,
      currentCategory: null,
      drawerId: null,
      guessed: new Set(),
      drawnPlayers: new Set(),
      usedWords: new Set(),
      timer: null,
      hintTimers: [],
      currentHint: null,
      allHints: [],
      effectUsage: new Map(), // userId -> { effectType: count }
    },
    strokes: [],
  };
}

export function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, makeRoom());
  }
  return rooms.get(roomId);
}
