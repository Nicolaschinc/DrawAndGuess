import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import { EVENTS } from "@shared/events.mjs";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV ? `http://${window.location.hostname}:3001` : window.location.origin);

export function useRoomSocket(roomId, name, navigate, onError) {
  const socketRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [flyingEffects, setFlyingEffects] = useState([]);
  const [effectUsage, setEffectUsage] = useState({});

  const [roomState, setRoomState] = useState({
    players: [],
    hostId: null,
    game: {
      started: false,
      drawerId: null,
      roundEndsAt: null,
      guessedIds: [],
      word: null,
      maskedWord: null,
    },
    strokes: [],
  });

  useEffect(() => {
    if (!name) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on(EVENTS.CONNECT, () => {
      socket.emit(EVENTS.JOIN_ROOM, { roomId, name }, (res) => {
        if (!res?.ok) {
          if (onError) {
            onError(res?.error || "game.joinFailed");
          } else {
            console.error(res?.error || "Join Failed");
          }
          navigate("/");
          return;
        }
        setJoined(true);
        setMessages([]);
      });
    });

    socket.on(EVENTS.DISCONNECT, () => {
      setJoined(false);
    });

    socket.on(EVENTS.ROOM_STATE, (state) => {
      setRoomState((prev) => {
        if (prev.game.drawerId !== state.game.drawerId) {
          setEffectUsage({});
        }
        return state;
      });
    });

    socket.on(EVENTS.CHAT_MESSAGE, (msg) => {
      setMessages((prev) => [...prev, { type: "chat", ...msg }]);
    });

    socket.on(EVENTS.SYSTEM_MESSAGE, (msg) => {
      setMessages((prev) => [...prev, { type: "system", ...msg }]);
    });

    socket.on(EVENTS.EFFECT_THROWN, ({ type, senderId, targetId }) => {
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;
      
      const targetEl = document.getElementById(`player-${targetId}`);
      let targetX = startX;
      let targetY = startY;

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      const id = Date.now() + Math.random().toString();
      setFlyingEffects((prev) => [
        ...prev,
        { id, type, startX, startY, targetX, targetY },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, name, navigate, onError]);

  const me = useMemo(() => {
    const socket = socketRef.current;
    if (!socket) return null;
    return roomState.players.find((p) => p.id === socket.id) || null;
  }, [roomState.players]);

  const isHost = roomState.hostId === socketRef.current?.id;
  const isDrawer = roomState.game.drawerId === socketRef.current?.id;

  const startGame = useCallback(() => {
    socketRef.current?.emit(EVENTS.START_GAME);
  }, []);

  const sendMessage = useCallback((text) => {
    socketRef.current?.emit(EVENTS.CHAT_MESSAGE, text);
  }, []);

  const throwEffect = useCallback((type) => {
    if (isDrawer) return;
    setEffectUsage((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    socketRef.current?.emit(EVENTS.THROW_EFFECT, { type });
  }, [isDrawer]);

  const leaveRoom = useCallback(() => {
    socketRef.current?.disconnect();
    navigate("/");
  }, [navigate]);

  return {
    socketRef,
    joined,
    setJoined,
    roomState,
    setRoomState,
    messages,
    setMessages,
    flyingEffects,
    setFlyingEffects,
    effectUsage,
    setEffectUsage,
    me,
    isHost,
    isDrawer,
    startGame,
    sendMessage,
    throwEffect,
    leaveRoom
  };
}
