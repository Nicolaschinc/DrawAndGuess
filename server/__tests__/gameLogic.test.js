
import { describe, it, expect } from 'vitest';
import { 
  calculateNextDrawer, 
  calculateGuesserScore, 
  calculateDrawerScore, 
  shouldEndRound, 
  shouldEndGame,
  startRoundState,
  endRoundState
} from '../gameLogic.js';

describe('Game Logic', () => {
  describe('calculateNextDrawer', () => {
    it('should return null for empty player list', () => {
      expect(calculateNextDrawer([], 'p1')).toBeNull();
    });

    it('should return first player if current drawer is invalid', () => {
      const players = ['p1', 'p2', 'p3'];
      expect(calculateNextDrawer(players, 'invalid')).toBe('p1');
      expect(calculateNextDrawer(players, null)).toBe('p1');
    });

    it('should return next player in order', () => {
      const players = ['p1', 'p2', 'p3'];
      expect(calculateNextDrawer(players, 'p1')).toBe('p2');
      expect(calculateNextDrawer(players, 'p2')).toBe('p3');
    });

    it('should loop back to first player', () => {
      const players = ['p1', 'p2', 'p3'];
      expect(calculateNextDrawer(players, 'p3')).toBe('p1');
    });
  });

  describe('calculateGuesserScore', () => {
    it('should calculate score based on remaining time', () => {
      // Base 10 + floor(remaining / 5)
      expect(calculateGuesserScore(60)).toBe(10 + 12); // 22
      expect(calculateGuesserScore(5)).toBe(10 + 1); // 11
      expect(calculateGuesserScore(0)).toBe(10 + 0); // 10
      expect(calculateGuesserScore(-5)).toBe(10); // Should handle negative as 0
    });
  });

  describe('calculateDrawerScore', () => {
    it('should always return 5', () => {
      expect(calculateDrawerScore()).toBe(5);
    });
  });

  describe('shouldEndRound', () => {
    it('should return true if all guessers guessed correctly', () => {
      // 3 players, 1 drawer, 2 guessers needed
      expect(shouldEndRound(2, 3)).toBe(true);
    });

    it('should return false if not all guessers guessed', () => {
      // 3 players, 1 drawer, 2 guessers needed, only 1 guessed
      expect(shouldEndRound(1, 3)).toBe(false);
    });

    it('should return false if no active guessers (e.g. 1 player)', () => {
      expect(shouldEndRound(1, 1)).toBe(false);
    });
  });

  describe('shouldEndGame', () => {
    it('should return true if all players have drawn', () => {
      const players = ['p1', 'p2'];
      const drawn = new Set(['p1', 'p2']);
      expect(shouldEndGame(players, drawn)).toBe(true);
    });

    it('should return false if not all players have drawn', () => {
      const players = ['p1', 'p2'];
      const drawn = new Set(['p1']);
      expect(shouldEndGame(players, drawn)).toBe(false);
    });

    it('should return true if player list is empty', () => {
      expect(shouldEndGame([], new Set())).toBe(true);
    });
  });

  describe('State Generators', () => {
    it('startRoundState should initialize correctly', () => {
      const now = 1000;
      const wordData = { word: 'test', category: 'test', hints: ['h1'] };
      const state = startRoundState(wordData, now);
      
      expect(state.started).toBe(true);
      expect(state.currentWord).toBe('test');
      expect(state.currentCategory).toBe('test');
      expect(state.allHints).toEqual(['h1']);
      expect(state.roundEndsAt).toBe(now + 75000); // 75s
      expect(state.guessed.size).toBe(0);
    });

    it('endRoundState should reset state', () => {
      const state = endRoundState();
      expect(state.currentWord).toBeNull();
      expect(state.started).toBeUndefined(); // It doesn't set started to false, just resets round data
      expect(state.guessed.size).toBe(0);
    });
  });
});
