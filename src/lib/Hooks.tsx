import { useEffect, RefObject } from 'react';
import { Message } from './Types';

interface UseWebSocketOptions {
  socketRef: React.MutableRefObject<WebSocket | null>;
  canvasRef: RefObject<HTMLCanvasElement>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setOnlineCount: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Hook for initializing and handling WebSocket communication.
 */
export function useWebSocket({
  socketRef,
  canvasRef,
  setMessages,
  setOnlineCount,
}: UseWebSocketOptions) {
  useEffect(() => {
    const socket = new WebSocket('wss://canvas-backend-955998363646.us-central1.run.app/ws');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'draw') {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.beginPath();
        ctx.moveTo(data.x1, data.y1);
        ctx.lineTo(data.x2, data.y2);
        ctx.stroke();
      }

      if (data.type === 'user_count') {
        setOnlineCount(data.count);
      }

      if (data.type === 'chat') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: data.text,
            username: data.username,
            userColor: data.userColor,
            timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
          },
        ]);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [canvasRef, setMessages, setOnlineCount, socketRef]);
}
