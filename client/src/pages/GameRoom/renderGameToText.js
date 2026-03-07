function summarizeClue(maskedWord) {
  if (!maskedWord) {
    return null;
  }

  if (typeof maskedWord === "string") {
    return { text: maskedWord };
  }

  if (typeof maskedWord === "object") {
    return {
      category: maskedWord.category ?? null,
      hint: maskedWord.hint ?? null,
      length: maskedWord.length ?? null,
    };
  }

  return null;
}

function summarizeMessage(message) {
  if (!message) {
    return null;
  }

  if (message.type === "chat") {
    return {
      type: "chat",
      key: null,
      text: `${message.sender}: ${message.text}`,
    };
  }

  return {
    type: message.type ?? "system",
    key: message.key ?? null,
    text: message.text ?? null,
  };
}

export function buildGameRoomTextState({
  roomId,
  joined,
  me,
  isHost,
  isDrawer,
  roomState,
  messages,
}) {
  const players = roomState?.players ?? [];
  const game = roomState?.game ?? {};
  const guessedIds = game.guessedIds ?? [];

  return {
    roomId,
    joined: Boolean(joined),
    me: me
      ? {
          id: me.id,
          name: me.name,
          score: me.score ?? 0,
          isHost: Boolean(isHost),
          isDrawer: Boolean(isDrawer),
        }
      : null,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score ?? 0,
      isHost: player.id === roomState.hostId,
      isDrawer: player.id === game.drawerId,
      hasGuessed: guessedIds.includes(player.id),
    })),
    game: {
      started: Boolean(game.started),
      drawerId: game.drawerId ?? null,
      roundEndsAt: game.roundEndsAt ?? null,
      guessedCount: guessedIds.length,
      word: isDrawer ? game.word ?? null : null,
      clue: summarizeClue(isDrawer ? game.word ?? null : game.maskedWord),
    },
    messages: (messages ?? [])
      .slice(-5)
      .map(summarizeMessage)
      .filter(Boolean),
  };
}

export function renderGameRoomTextState(input) {
  return JSON.stringify(buildGameRoomTextState(input));
}
