import React, { useRef, useState, useCallback } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { Chat } from './Chat';
import { useWebSocket } from '../lib/Hooks';
import { DrawingState, BrushStyle, DrawingMode, ShapeType, Message } from '../lib/Types';

interface WhiteboardProps {
  setOnlineCount: React.Dispatch<React.SetStateAction<number>>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ setOnlineCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

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

  // Initialize WebSocket
  useWebSocket({
    socketRef,
    canvasRef,
    setMessages,
    setOnlineCount,
  });

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

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
