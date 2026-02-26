import { useEffect, useRef, useState, useCallback } from "react";
import { EVENTS } from "@shared/events.mjs";

function getPointerPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
  const clientY = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function useCanvasDraw({ socketRef, isDrawer, gameStarted, joined }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPointRef = useRef(null);
  const strokesRef = useRef([]);
  const localDrawQueue = useRef([]);
  const socketDrawQueue = useRef([]);

  const [penColor, setPenColor] = useState("#111111");
  const [penWidth, setPenWidth] = useState(4);
  const [activeTool, setActiveTool] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to draw a single stroke
  const drawStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Use client dimensions for denormalization to match CSS pixels
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    let x0 = stroke.x0;
    let y0 = stroke.y0;
    let x1 = stroke.x1;
    let y1 = stroke.y1;
    let lineWidth = stroke.width;

    const isNormalized = stroke.normalized === true || (stroke.x0 <= 1 && stroke.x0 >= 0 && stroke.y0 <= 1 && stroke.y0 >= 0);

    if (isNormalized) {
      x0 *= w;
      y0 *= h;
      x1 *= w;
      y1 *= h;
      // Scale line width relative to canvas width (base 1000px)
      lineWidth = stroke.width * (w / 1000);
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const redrawAll = useCallback((strokes) => {
    clearCanvas();
    for (const s of strokes) drawStroke(s);
  }, [clearCanvas, drawStroke]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;

    // Mobile optimization: Cap DPR at 1.5 for small screens
    const isMobile = window.innerWidth < 768;
    const maxDpr = isMobile ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    const width = Math.floor(w * dpr);
    const height = Math.floor(h * dpr);
    if (canvas.width === width && canvas.height === height) return;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  // Drawing Loop (rAF)
  useEffect(() => {
    let animationFrameId;
    const renderLoop = () => {
      if (localDrawQueue.current.length > 0) {
        const strokesToDraw = localDrawQueue.current;
        localDrawQueue.current = []; // Clear queue
        
        for (const s of strokesToDraw) {
          drawStroke(s);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [drawStroke]);

  // Socket Batch Sending (Throttle)
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketDrawQueue.current.length > 0) {
        const batch = [...socketDrawQueue.current];
        socketDrawQueue.current = [];
        socketRef.current?.emit(EVENTS.DRAW, batch);
      }
    }, 40); // 25Hz
    return () => clearInterval(interval);
  }, [socketRef]);

  // Socket Listeners for Drawing
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !joined) return;

    const handleRoomState = (state) => {
      strokesRef.current = state.strokes;
      redrawAll(state.strokes);
    };

    const handleDraw = (data) => {
      const newStrokes = Array.isArray(data) ? data : [data];
      strokesRef.current.push(...newStrokes);
      localDrawQueue.current.push(...newStrokes);
    };

    const handleClear = () => {
      strokesRef.current = [];
      clearCanvas();
    };

    socket.on(EVENTS.ROOM_STATE, handleRoomState);
    socket.on(EVENTS.DRAW, handleDraw);
    socket.on(EVENTS.CLEAR_CANVAS, handleClear);

    return () => {
      socket.off(EVENTS.ROOM_STATE, handleRoomState);
      socket.off(EVENTS.DRAW, handleDraw);
      socket.off(EVENTS.CLEAR_CANVAS, handleClear);
    };
  }, [socketRef, joined, redrawAll, clearCanvas]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !joined) return;
    resizeCanvas();
    redrawAll(strokesRef.current);
    const ro = new ResizeObserver(() => {
      resizeCanvas();
      redrawAll(strokesRef.current);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [joined, resizeCanvas, redrawAll]);

  // Pointer Events
  const onPointerDown = useCallback((event) => {
    if (!isDrawer || !gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    lastPointRef.current = getPointerPosition(canvas, event);
  }, [isDrawer, gameStarted]);

  const onPointerMove = useCallback((event) => {
    if (!isDrawer || !gameStarted) return;
    if (!lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    // Use getCoalescedEvents for higher precision
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    
    let prev = lastPointRef.current;

    for (const e of events) {
      const now = getPointerPosition(canvas, e);
      
      // Skip if position hasn't changed
      if (now.x === prev.x && now.y === prev.y) continue;

      const stroke = {
        x0: prev.x / w,
        y0: prev.y / h,
        x1: now.x / w,
        y1: now.y / h,
        color: penColor,
        width: penWidth,
        normalized: true,
      };

      // Push to queues
      localDrawQueue.current.push(stroke);
      socketDrawQueue.current.push(stroke);
      strokesRef.current.push(stroke);

      prev = now;
    }
    
    lastPointRef.current = prev;
  }, [isDrawer, gameStarted, penColor, penWidth]);

  const onPointerUp = useCallback((event) => {
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(event.pointerId);
    lastPointRef.current = null;
  }, []);

  const clearByDrawer = useCallback(() => {
    if (!isDrawer) return;
    socketRef.current?.emit(EVENTS.CLEAR_CANVAS);
  }, [isDrawer, socketRef]);

  // Fullscreen
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = useCallback(() => {
    const canvasWrap = canvasRef.current?.parentElement;
    if (!canvasWrap) return;

    if (!document.fullscreenElement) {
      canvasWrap.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  return {
    canvasRef,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    activeTool,
    setActiveTool,
    clearByDrawer,
    toggleFullScreen,
    isFullscreen,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
