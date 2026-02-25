export const ROUND_SECONDS = 75;

/**
 * Calculate the next drawer ID based on current player order and current drawer.
 * @param {string[]} playerOrder - Array of player IDs
 * @param {string} currentDrawerId - Current drawer ID
 * @returns {string|null} - Next drawer ID or null
 */
export function calculateNextDrawer(playerOrder, currentDrawerId) {
  if (!playerOrder || playerOrder.length === 0) return null;
  
  // Filter out any invalid IDs if necessary, but assuming playerOrder is clean here
  // Logic from engine.js: nextDrawer
  
  if (!currentDrawerId || !playerOrder.includes(currentDrawerId)) {
    return playerOrder[0];
  }

  const idx = playerOrder.indexOf(currentDrawerId);
  return playerOrder[(idx + 1) % playerOrder.length];
}

/**
 * Calculate score for a guesser based on remaining time.
 * @param {number} remainingSeconds 
 * @returns {number}
 */
export function calculateGuesserScore(remainingSeconds) {
  return 10 + Math.floor(Math.max(0, remainingSeconds) / 5);
}

/**
 * Calculate score for the drawer when someone guesses correctly.
 * @returns {number}
 */
export function calculateDrawerScore() {
  return 5;
}

/**
 * Check if the round should end because all guessers have guessed.
 * @param {number} guessedCount - Number of players who guessed correctly
 * @param {number} totalPlayers - Total number of players in the room
 * @returns {boolean}
 */
export function shouldEndRound(guessedCount, totalPlayers) {
  // Drawer doesn't guess, so active guessers = totalPlayers - 1
  const activeGuessers = Math.max(0, totalPlayers - 1);
  return activeGuessers > 0 && guessedCount >= activeGuessers;
}

/**
 * Check if the game should end (all players have drawn).
 * @param {string[]} playerOrder 
 * @param {Set<string>} drawnPlayers 
 * @returns {boolean}
 */
export function shouldEndGame(playerOrder, drawnPlayers) {
  if (!playerOrder || playerOrder.length === 0) return true;
  return playerOrder.every(id => drawnPlayers && drawnPlayers.has(id));
}

/**
 * Generate initial state for a new round.
 * @param {Object} wordData - { word, category, hints }
 * @param {number} now - Current timestamp (ms)
 * @returns {Object} - New game state properties
 */
export function startRoundState(wordData, now) {
  return {
    started: true,
    currentWord: wordData.word,
    currentCategory: wordData.category,
    allHints: wordData.hints || [],
    currentHint: null,
    roundEndsAt: now + ROUND_SECONDS * 1000,
    guessed: new Set(),
    effectUsage: new Map(),
    timer: null,      // Reset timer references (to be managed by engine)
    hintTimers: [],   // Reset hint timer references
  };
}

/**
 * Generate state for ending a round.
 * @returns {Object} - Reset game state properties
 */
export function endRoundState() {
  return {
    currentWord: null,
    currentCategory: null,
    roundEndsAt: null,
    guessed: new Set(),
    // drawnPlayers is NOT reset here, it accumulates
    // drawerId is updated separately
  };
}
