import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { Chat } from './Chat';
import {
  DrawingState,
  BrushStyle,
  DrawingMode,
  ShapeType,
  Message,
  IncomingDrawMessage,
} from '../lib/Types';

interface WhiteboardProps {
  setOnlineCount: React.Dispatch<React.SetStateAction<number>>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ setOnlineCount }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const clearCanvasRef = useRef<() => void>(() => {});
  const receiveDrawRef = useRef<(data: IncomingDrawMessage) => void>(() => {});

  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
  });

  const [penSize, setPenSize] = useState(2);
  const [penColor, setPenColor] = useState('#3B82F6');
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('pen');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('brush');

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const clearCanvas = useCallback(() => {
    if (clearCanvasRef.current) {
      clearCanvasRef.current();
    }
  }, []);

  useEffect(() => {
    const socket = new WebSocket('wss://canvas-backend-955998363646.us-central1.run.app/ws');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket received:', data);

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

      if ((data.type === 'draw' || data.type === 'shape') && receiveDrawRef.current) {
        receiveDrawRef.current(data);
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
  }, [setOnlineCount]);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <Toolbar
        penSize={penSize}
        setPenSize={setPenSize}
        penColor={penColor}
        setPenColor={setPenColor}
        brushStyle={brushStyle}
        setBrushStyle={setBrushStyle}
        selectedShape={selectedShape}
        setSelectedShape={setSelectedShape}
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        clearCanvas={clearCanvas}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Canvas
            penColor={penColor}
            penSize={penSize}
            brushStyle={brushStyle}
            drawingMode={drawingMode}
            selectedShape={selectedShape}
            drawingState={drawingState}
            setDrawingState={setDrawingState}
            socketRef={socketRef}
            clearCanvasRef={clearCanvasRef}
            receiveDrawRef={receiveDrawRef}
          />
        </div>

        <Chat
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          socketRef={socketRef}
        />
      </div>
    </div>
  );
};
