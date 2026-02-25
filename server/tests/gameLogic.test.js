import assert from "node:assert";
import test from "node:test";
import {
  calculateNextDrawer,
  calculateGuesserScore,
  calculateDrawerScore,
  shouldEndRound,
  shouldEndGame,
  startRoundState,
  endRoundState,
  ROUND_SECONDS
} from "../gameLogic.js";

test("Game Logic Tests", async (t) => {

  await t.test("calculateNextDrawer - standard rotation", () => {
    const players = ["A", "B", "C"];
    assert.strictEqual(calculateNextDrawer(players, "A"), "B");
    assert.strictEqual(calculateNextDrawer(players, "B"), "C");
    assert.strictEqual(calculateNextDrawer(players, "C"), "A");
  });

  await t.test("calculateNextDrawer - drawer offline (not in list)", () => {
    const players = ["A", "C"]; // B left
    // If current was B (not in list), should return first player (A)
    assert.strictEqual(calculateNextDrawer(players, "B"), "A");
  });

  await t.test("calculateNextDrawer - empty list", () => {
    assert.strictEqual(calculateNextDrawer([], "A"), null);
  });

  await t.test("Score Calculation", () => {
    // Max score at 75s (impossible but logic holds) -> 10 + 15 = 25
    assert.strictEqual(calculateGuesserScore(75), 25);
    // Score at 0s -> 10 + 0 = 10
    assert.strictEqual(calculateGuesserScore(0), 10);
    // Score at 30s -> 10 + 6 = 16
    assert.strictEqual(calculateGuesserScore(30), 16);
    
    assert.strictEqual(calculateDrawerScore(), 5);
  });

  await t.test("shouldEndRound - all guessed", () => {
    // 3 players (1 drawer + 2 guessers)
    // 1 guessed -> continue
    assert.strictEqual(shouldEndRound(1, 3), false);
    // 2 guessed -> end
    assert.strictEqual(shouldEndRound(2, 3), true);
  });

  await t.test("shouldEndRound - single player edge case", () => {
    // 1 player (drawer only) -> activeGuessers = 0 -> should return false (or handle gracefully)
    // Logic: activeGuessers > 0 && ...
    assert.strictEqual(shouldEndRound(0, 1), false);
  });

  await t.test("shouldEndGame - all players drawn", () => {
    const players = ["A", "B"];
    const drawn = new Set(["A"]);
    assert.strictEqual(shouldEndGame(players, drawn), false);
    
    drawn.add("B");
    assert.strictEqual(shouldEndGame(players, drawn), true);
  });

  await t.test("State Transitions - startRound", () => {
    const wordData = { word: "Apple", category: "Fruit", hints: ["Red"] };
    const now = 1000000;
    const state = startRoundState(wordData, now);
    
    assert.strictEqual(state.started, true);
    assert.strictEqual(state.currentWord, "Apple");
    assert.strictEqual(state.roundEndsAt, now + ROUND_SECONDS * 1000);
    assert.deepStrictEqual(state.allHints, ["Red"]);
  });

  await t.test("State Transitions - endRound", () => {
    const state = endRoundState();
    assert.strictEqual(state.currentWord, null);
    assert.strictEqual(state.roundEndsAt, null);
    assert.strictEqual(state.guessed.size, 0);
  });
});
