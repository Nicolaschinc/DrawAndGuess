
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rooms, makeRoom } from '../roomStore.js';
import { startRound, endRound, broadcastRoom } from '../engine.js';
import { EVENTS } from '../../shared/events.mjs';

// Mock wordManager to return deterministic words
vi.mock('../wordManager.js', () => ({
  getRandomWord: vi.fn(() => ({ word: 'testWord', category: 'testCat', hints: ['hint1'] })),
  pickWord: vi.fn(() => ({ word: 'testWord', category: 'testCat', hints: ['hint1'] })), // engine.js re-exports pickWord
}));

describe('Game Engine', () => {
  let io;
  let socket;
  const roomId = 'test-room';

  beforeEach(() => {
    vi.useFakeTimers();
    rooms.clear();
    
    // Setup mock socket
    socket = {
      id: 'socket1',
      emit: vi.fn(),
      join: vi.fn(),
    };

    // Setup mock io
    io = {
      to: vi.fn().mockReturnThis(), // Allow chaining .to().emit()
      emit: vi.fn(),
      sockets: {
        sockets: {
          get: vi.fn().mockReturnValue(socket),
        }
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('startRound should fail if room does not exist', () => {
    startRound(io, 'non-existent');
    expect(io.to).not.toHaveBeenCalled();
  });

  it('startRound should fail if less than 2 players', () => {
    const room = makeRoom();
    room.players.set('p1', { name: 'Player 1', score: 0 });
    room.playerOrder = ['p1'];
    rooms.set(roomId, room);

    startRound(io, roomId);

    expect(io.to).toHaveBeenCalledWith(roomId);
    expect(io.emit).toHaveBeenCalledWith(EVENTS.SYSTEM_MESSAGE, expect.objectContaining({
      text: expect.stringContaining('至少需要 2 名玩家')
    }));
    expect(room.game.started).toBe(false);
  });

  it('startRound should start game successfully with 2 players', () => {
    const room = makeRoom();
    room.players.set('p1', { name: 'Player 1', score: 0 });
    room.players.set('p2', { name: 'Player 2', score: 0 });
    room.playerOrder = ['p1', 'p2'];
    rooms.set(roomId, room);

    startRound(io, roomId);

    expect(room.game.started).toBe(true);
    expect(room.game.currentWord).toBe('testWord');
    expect(room.game.drawerId).toBe('p1'); // First player
    
    // Should emit clear canvas and system message
    expect(io.to).toHaveBeenCalledWith(roomId);
    expect(io.emit).toHaveBeenCalledWith(EVENTS.CLEAR_CANVAS);
    
    // Should broadcast room state
    // We can't easily check broadcastRoom internal calls unless we mock it, 
    // but we can check if sockets.get was called to send state to players
    expect(io.sockets.sockets.get).toHaveBeenCalled();
  });

  it('endRound should transition to next drawer', () => {
    const room = makeRoom();
    room.players.set('p1', { name: 'Player 1', score: 0 });
    room.players.set('p2', { name: 'Player 2', score: 0 });
    room.playerOrder = ['p1', 'p2'];
    room.game.started = true;
    room.game.drawerId = 'p1';
    room.game.drawnPlayers = new Set(['p1']);
    rooms.set(roomId, room);

    endRound(io, roomId, 'timeout');

    // Should have moved to p2
    expect(room.game.drawerId).toBe('p2');
    expect(room.game.drawnPlayers.has('p2')).toBe(true);
    // Should have started next round automatically
    expect(room.game.started).toBe(true);
  });

  it('endRound should end game if all players have drawn', () => {
    const room = makeRoom();
    room.players.set('p1', { name: 'Player 1', score: 0 });
    room.players.set('p2', { name: 'Player 2', score: 0 });
    room.playerOrder = ['p1', 'p2'];
    room.game.started = true;
    room.game.drawerId = 'p2';
    room.game.drawnPlayers = new Set(['p1', 'p2']); // Both drawn
    rooms.set(roomId, room);

    endRound(io, roomId, 'timeout');

    expect(room.game.started).toBe(false);
    expect(io.emit).toHaveBeenCalledWith(EVENTS.SYSTEM_MESSAGE, expect.objectContaining({
      text: expect.stringContaining('游戏结束')
    }));
  });

  it('timers should trigger endRound automatically', () => {
    const room = makeRoom();
    room.players.set('p1', { name: 'Player 1', score: 0 });
    room.players.set('p2', { name: 'Player 2', score: 0 });
    room.playerOrder = ['p1', 'p2'];
    rooms.set(roomId, room);

    startRound(io, roomId);
    expect(room.game.started).toBe(true);

    // Fast forward time by ROUND_SECONDS (75s) + buffer
    vi.advanceTimersByTime(76000);

    // Since endRound calls startRound for next player, game should still be running but drawer changed
    expect(room.game.drawerId).toBe('p2');
  });
});
