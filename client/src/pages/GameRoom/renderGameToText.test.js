import test from "node:test";
import assert from "node:assert/strict";

import { buildGameRoomTextState } from "./renderGameToText.js";

test("buildGameRoomTextState summarizes room, players, game, and recent messages", () => {
  const output = buildGameRoomTextState({
    roomId: "abc123",
    joined: true,
    me: { id: "p1", name: "Alice", score: 25 },
    isHost: true,
    isDrawer: false,
    roomState: {
      hostId: "p1",
      players: [
        { id: "p1", name: "Alice", score: 25 },
        { id: "p2", name: "Bob", score: 10 },
      ],
      game: {
        started: true,
        drawerId: "p2",
        roundEndsAt: 1741300000000,
        guessedIds: ["p1"],
        word: null,
        maskedWord: { category: "Animals", length: 3 },
      },
    },
    messages: [
      { type: "system", key: "system.joined", args: { username: "Alice" } },
      { type: "chat", sender: "Bob", text: "cat" },
    ],
  });

  assert.equal(output.roomId, "abc123");
  assert.equal(output.joined, true);
  assert.equal(output.me.name, "Alice");
  assert.equal(output.me.isHost, true);
  assert.equal(output.game.started, true);
  assert.equal(output.game.drawerId, "p2");
  assert.equal(output.game.clue.category, "Animals");
  assert.equal(output.game.clue.length, 3);
  assert.equal(output.players[0].isHost, true);
  assert.equal(output.players[0].hasGuessed, true);
  assert.equal(output.players[1].isDrawer, true);
  assert.deepEqual(output.messages, [
    { type: "system", key: "system.joined", text: null },
    { type: "chat", key: null, text: "Bob: cat" },
  ]);
});

test("buildGameRoomTextState preserves drawer word and trims message history to the last five entries", () => {
  const output = buildGameRoomTextState({
    roomId: "drawer-room",
    joined: true,
    me: { id: "p2", name: "Bob", score: 8 },
    isHost: false,
    isDrawer: true,
    roomState: {
      hostId: "p1",
      players: [
        { id: "p1", name: "Alice", score: 12 },
        { id: "p2", name: "Bob", score: 8 },
      ],
      game: {
        started: true,
        drawerId: "p2",
        roundEndsAt: null,
        guessedIds: [],
        word: "banana",
        maskedWord: null,
      },
    },
    messages: [
      { type: "chat", sender: "a", text: "1" },
      { type: "chat", sender: "b", text: "2" },
      { type: "chat", sender: "c", text: "3" },
      { type: "chat", sender: "d", text: "4" },
      { type: "chat", sender: "e", text: "5" },
      { type: "chat", sender: "f", text: "6" },
    ],
  });

  assert.equal(output.game.word, "banana");
  assert.equal(output.messages.length, 5);
  assert.deepEqual(output.messages[0], { type: "chat", key: null, text: "b: 2" });
  assert.deepEqual(output.messages[4], { type: "chat", key: null, text: "f: 6" });
});
