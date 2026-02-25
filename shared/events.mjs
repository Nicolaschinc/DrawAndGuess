// Event names for socket communication
export const EVENTS = {
  // Client -> Server (Actions)
  JOIN_ROOM: "join_room",
  START_GAME: "start_game",
  DRAW: "draw",
  CLEAR_CANVAS: "clear_canvas",
  THROW_EFFECT: "throw_effect",
  
  // Server -> Client (Updates)
  SYSTEM_MESSAGE: "system_message",
  ROOM_STATE: "room_state",
  EFFECT_THROWN: "effect_thrown",
  
  // Bidirectional
  CHAT_MESSAGE: "chat_message",
  
  // Standard Socket.io events
  CONNECTION: "connection",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
};

// Payload structures (for documentation/reference)
/*
JOIN_ROOM: { roomId: string, name: string }
SYSTEM_MESSAGE: { text: string, relatedUser: { id: string, name: string } }
ROOM_STATE: { 
  players: Array<{ id, name, score }>, 
  hostId: string, 
  game: { 
    started: boolean, 
    drawerId: string, 
    roundEndsAt: number, 
    guessedIds: string[], 
    word: string | null, 
    maskedWord: string | null 
  }, 
  strokes: Array 
}
START_GAME: null
DRAW: { x0, y0, x1, y1, color, width } | Array<{ x0, y0, x1, y1, color, width }>
CLEAR_CANVAS: null
CHAT_MESSAGE: string (client->server) | { sender, senderId, text } (server->client)
THROW_EFFECT: { type: string }
EFFECT_THROWN: { type, senderId, targetId }
*/
