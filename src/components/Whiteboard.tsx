import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Palette, Minus, Plus, RotateCcw, Send, Pen, Eraser, Square, Circle, Triangle, ChevronDown, Pipette } from 'lucide-react';

interface DrawingState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
}

interface WhiteBoardProps {
  setOnlineCount: React.Dispatch<React.SetStateAction<number>>;
}


interface Message {
  id: string;
  text: string;
  username: string;
  userColor: string;
  timestamp: Date;
}

type BrushStyle = 'pen' | 'eraser';
type ShapeType = 'rectangle' | 'circle' | 'triangle';
type DrawingMode = 'brush' | 'shape';

export const Whiteboard: React.FC<WhiteBoardProps> = ({ setOnlineCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
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
  const [customColor, setCustomColor] = useState('#3B82F6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushDropdown, setShowBrushDropdown] = useState(false);
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  
  // Drawing tool states
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('pen');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('brush');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Expanded color palette with more options
  const presetColors = [
    // Primary colors
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#6B7280', '#000000',
    // Secondary colors
    '#06B6D4', '#84CC16', '#F97316', '#A855F7',
    '#E11D48', '#059669', '#DC2626', '#7C3AED',
    // Tertiary colors
    '#0EA5E9', '#22C55E', '#EAB308', '#D946EF',
    '#F43F5E', '#14B8A6', '#F97316', '#6366F1',
    // Neutral and pastels
    '#64748B', '#71717A', '#A1A1AA', '#D4D4D8',
    '#FEF3C7', '#DBEAFE', '#DCFCE7', '#FEE2E2',
    // Dark colors
    '#1E293B', '#374151', '#4B5563', '#6B7280',
    '#7F1D1D', '#14532D', '#1E3A8A', '#581C87'
  ];

  const brushStyles = [
    { id: 'pen', name: 'Regular Pen', icon: Pen },
    { id: 'eraser', name: 'Eraser', icon: Eraser },
  ];

  const shapeTypes = [
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'triangle', name: 'Triangle', icon: Triangle },
  ];

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    // Setup canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * 2;
    const height = rect.height * 2;
    
    // Set dimensions for all canvases
    [canvas, previewCanvas].forEach(c => {
      c.width = width;
      c.height = height;
    });

    // Setup contexts
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!ctx || !previewCtx ) return;

    // Configure all contexts
    [ctx, previewCtx].forEach(context => {
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
    });
    
    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Initialize canvas on mount and resize
  useEffect(() => {
    initializeCanvas();
    
    const handleResize = () => {
      initializeCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync custom color with pen color
  useEffect(() => {
    setCustomColor(penColor);
  }, [penColor]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws'); // Replace with the WebSocket server URL
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
      if (data.type === 'chat'){
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: data.text,
            username: data.username,
            userColor: data.userColor,
            timestamp: new Date(data.timestamp),
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

  }, []);

  const getCanvasPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, shape: ShapeType) => {
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    switch (shape) {
      case 'rectangle': {
        const width = endX - startX;
        const height = endY - startY;
        ctx.strokeRect(startX, startY, width, height);
        break;
      }
      case 'circle': {
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case 'triangle': {
        const midX = (startX + endX) / 2;
        ctx.beginPath();
        ctx.moveTo(midX, startY); // Top point
        ctx.lineTo(startX, endY); // Bottom left
        ctx.lineTo(endX, endY);   // Bottom right
        ctx.closePath();
        ctx.stroke();
        break;
      }
    }
  }, [penColor, penSize]);

  const clearPreviewCanvas = useCallback(() => {
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas?.getContext('2d');
    if (!previewCtx || !previewCanvas) return;
    
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPosition(e);
    setDrawingState({
      isDrawing: true,
      lastX: x,
      lastY: y,
      startX: x,
      startY: y,
    });
  }, [getCanvasPosition]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas?.getContext('2d');
    if (!ctx || !previewCtx) return;

    const { x, y } = getCanvasPosition(e);

    if (drawingMode === 'shape') {
      // Clear preview and draw shape preview
      clearPreviewCanvas();
      drawShape(previewCtx, drawingState.startX, drawingState.startY, x, y, selectedShape);
    } else {
      // Brush drawing
      if (brushStyle === 'eraser') {
        // Erase by drawing with white
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = penSize * 2;
        
        ctx.beginPath();
        ctx.moveTo(drawingState.lastX, drawingState.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        // Regular pen
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;

        ctx.beginPath();
        ctx.moveTo(drawingState.lastX, drawingState.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: 'draw',
                x1: drawingState.lastX,
                y1: drawingState.lastY,
                x2: x,
                y2: y,
                color: penColor,
                size: penSize,
              }));
            }
      }

      setDrawingState(prev => ({
        ...prev,
        lastX: x,
        lastY: y,
      }));
    }
  }, [drawingState.isDrawing, drawingState.lastX, drawingState.lastY, drawingState.startX, drawingState.startY, getCanvasPosition, penColor, penSize, brushStyle, drawingMode, selectedShape, drawShape, clearPreviewCanvas]);

  const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return;

    if (drawingMode === 'shape' && e) {
      // Finalize shape on main canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCanvasPosition(e);
      drawShape(ctx, drawingState.startX, drawingState.startY, x, y, selectedShape);
      clearPreviewCanvas();
    }

    setDrawingState(prev => ({ ...prev, isDrawing: false }));
  }, [drawingState.isDrawing, drawingState.startX, drawingState.startY, drawingMode, selectedShape, getCanvasPosition, drawShape, clearPreviewCanvas]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    clearPreviewCanvas();
  }, [clearPreviewCanvas]);

  const handleBrushStyleChange = useCallback((style: BrushStyle) => {
    setBrushStyle(style);
    setDrawingMode('brush');
    setShowBrushDropdown(false);
  }, []);

  const handleShapeSelect = useCallback((shape: ShapeType) => {
    setSelectedShape(shape);
    setDrawingMode('shape');
    setShowShapeDropdown(false);
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setPenColor(color);
    setCustomColor(color);
    setShowColorPicker(false);
  }, []);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setPenColor(color);
  }, []);

  const openColorPicker = useCallback(() => {
    colorInputRef.current?.click();
  }, []);

  const sendMessage = useCallback(() => {
    if (newMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        text: newMessage.trim(),
      }));
      setNewMessage('');
    }
  }, [newMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentBrushIcon = () => {
    const style = brushStyles.find(s => s.id === brushStyle);
    return style ? style.icon : Pen;
  };

  const getCurrentShapeIcon = () => {
    const shape = shapeTypes.find(s => s.id === selectedShape);
    return shape ? shape.icon : Square;
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Enhanced Drawing Controls - Floating Toolbar */}
      <div className="sticky top-0 z-10 bg-[#101521] rounded-lg shadow-md border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Brush Style Selector */}
            <div className="relative">
              <button
                onClick={() => setShowBrushDropdown(!showBrushDropdown)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  drawingMode === 'brush' 
                    ? 'bg-blue-100 text-blue-600 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
                }`}
                title={`Current: ${brushStyles.find(s => s.id === brushStyle)?.name}`}
              >
                {React.createElement(getCurrentBrushIcon(), { size: 16 })}
                <ChevronDown size={12} className={`transition-transform duration-300 ${showBrushDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showBrushDropdown && (
                <div className="absolute top-12 left-0 p-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px] transition-all duration-300 ease-in-out animate-in slide-in-from-top-2">
                  {brushStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleBrushStyleChange(style.id as BrushStyle)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out ${
                        brushStyle === style.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <style.icon size={14} />
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shape Tool */}
            <div className="relative">
              <button
                onClick={() => setShowShapeDropdown(!showShapeDropdown)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  drawingMode === 'shape' 
                    ? 'bg-emerald-100 text-emerald-600 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
                }`}
                title={`Shape: ${shapeTypes.find(s => s.id === selectedShape)?.name}`}
              >
                {React.createElement(getCurrentShapeIcon(), { size: 16 })}
                <ChevronDown size={12} className={`transition-transform duration-300 ${showShapeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showShapeDropdown && (
                <div className="absolute top-12 left-0 p-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px] transition-all duration-300 ease-in-out animate-in slide-in-from-top-2">
                  {shapeTypes.map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => handleShapeSelect(shape.id as ShapeType)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out ${
                        selectedShape === shape.id
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <shape.icon size={14} />
                      <span>{shape.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Pen Size */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPenSize(Math.max(1, penSize - 1))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Decrease brush size"
              >
                <Minus size={16} />
              </button>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
                <div
                  className="rounded-full bg-current transition-all duration-300 ease-in-out"
                  style={{
                    width: `${Math.max(4, penSize * 2)}px`,
                    height: `${Math.max(4, penSize * 2)}px`,
                    color: brushStyle === 'eraser' ? '#FFFFFF' : penColor,
                  }}
                />
                <span className="text-sm text-gray-600">{penSize}px</span>
              </div>
              <button
                onClick={() => setPenSize(Math.min(20, penSize + 1))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Increase brush size"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center space-x-2 p-2 text-gray-300 hover:bg-gray-100 rounded-lg border border-slate-600 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Choose color"
                disabled={brushStyle === 'eraser'}
              >
                <Palette size={16} />
                <div
                  className={`w-4 h-4 rounded border border-gray-300 transition-all duration-300 ease-in-out ${
                    brushStyle === 'eraser' ? 'opacity-50' : ''
                  }`}
                  style={{ backgroundColor: brushStyle === 'eraser' ? '#FFFFFF' : penColor }}
                />
              </button>
              {showColorPicker && brushStyle !== 'eraser' && (
                <div className="absolute top-12 left-0 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 transition-all duration-300 ease-in-out animate-in slide-in-from-top-2 min-w-[280px]">
                  {/* Preset Colors */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preset Colors</h4>
                    <div className="grid grid-cols-8 gap-1.5">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`w-7 h-7 rounded border-2 hover:scale-110 transition-all duration-200 ease-in-out ${
                            penColor === color 
                              ? 'border-gray-400 ring-2 ring-blue-500 ring-opacity-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Section */}
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Color</h4>
                    <div className="flex items-center space-x-2">
                      {/* Hidden color input */}
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        className="sr-only"
                      />
                      
                      {/* Custom color picker button */}
                      <button
                        onClick={openColorPicker}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                        title="Pick custom color"
                      >
                        <Pipette size={14} />
                        <span className="text-sm text-gray-700">Pick Color</span>
                      </button>
                      
                      {/* Current custom color display */}
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-gray-300"
                          style={{ backgroundColor: customColor }}
                        />
                        <span className="text-xs font-mono text-gray-600 uppercase">
                          {customColor}
                        </span>
                      </div>
                    </div>
                    
                    {/* Apply custom color button */}
                    {customColor !== penColor && (
                      <button
                        onClick={() => handleColorSelect(customColor)}
                        className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                      >
                        Apply Color
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clear Canvas Button */}
          <button
            onClick={clearCanvas}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-slate-600 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:shadow-md"
            title="Clear entire canvas"
          >
            <RotateCcw size={16} />
            <span>Clear Canvas</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        {/* Canvas Area */}
        <div className="flex-1">
          <div className="w-full h-full rounded-lg shadow-sm border border-gray-200 overflow-hidden relative bg-white">
            {/* Main Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            {/* Preview Canvas for shapes */}
            <canvas
              ref={previewCanvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-none"
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full lg:w-80 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: '#1a1f2a', borderLeft: '1px solid #dee2e6' }}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800 bg-[#101521] rounded-t-lg">
            <h3 className="text-lg font-semibold text-white-900">Team Chat</h3>
            <p className="text-sm text-gray-400">{messages.length} messages</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64 lg:max-h-none scrollbar-thin">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col space-y-1 rounded-lg p-2 border border-black bg-white shadow-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: message.userColor }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {message.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 ml-5">
                  {message.text}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800 bg-[#101521] rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:transform-none"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};