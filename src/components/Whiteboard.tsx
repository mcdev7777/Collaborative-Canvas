import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Palette, Minus, Plus, RotateCcw, Send, Pen, Highlighter, Eraser, Square, Circle, Triangle, 
  ChevronDown, Pipette, Type, Move, Undo, Redo, ZoomIn, ZoomOut, Download, Upload, 
  Minus as LineIcon, Copy, Trash2
} from 'lucide-react';

interface DrawingState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
}

interface Message {
  id: string;
  text: string;
  username: string;
  userColor: string;
  timestamp: Date;
}

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

type BrushStyle = 'pen' | 'highlighter' | 'eraser';
type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line';
type DrawingMode = 'brush' | 'shape' | 'text' | 'select';

export const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const highlighterCanvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  
  // Drawing tool states
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('pen');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('brush');
  
  // New tool states
  const [zoom, setZoom] = useState(1);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to the collaborative whiteboard!',
      username: 'Alice Johnson',
      userColor: '#3B82F6',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '2',
      text: 'Great! Let\'s start brainstorming ideas.',
      username: 'Bob Smith',
      userColor: '#EF4444',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
    },
    {
      id: '3',
      text: 'I\'ll start drawing the main concept on the board.',
      username: 'Carol Davis',
      userColor: '#10B981',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const currentUser = { name: 'You', color: '#8B5CF6' };

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
    { id: 'highlighter', name: 'Highlighter', icon: Highlighter },
    { id: 'eraser', name: 'Eraser', icon: Eraser },
  ];

  const shapeTypes = [
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'triangle', name: 'Triangle', icon: Triangle },
    { id: 'line', name: 'Line', icon: LineIcon },
  ];

  const additionalTools = [
    { id: 'text', name: 'Text Tool', icon: Type },
    { id: 'select', name: 'Select & Move', icon: Move },
  ];

  // Save canvas state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const highlighterCanvas = highlighterCanvasRef.current;
    if (!canvas || !highlighterCanvas) return;

    const mainData = canvas.toDataURL();
    const highlighterData = highlighterCanvas.toDataURL();
    const state = JSON.stringify({ main: mainData, highlighter: highlighterData, textElements });
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep, textElements]);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const highlighterCanvas = highlighterCanvasRef.current;
    const textCanvas = textCanvasRef.current;
    if (!canvas || !previewCanvas || !highlighterCanvas || !textCanvas) return;

    // Setup canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * 2;
    const height = rect.height * 2;
    
    // Set dimensions for all canvases
    [canvas, previewCanvas, highlighterCanvas, textCanvas].forEach(c => {
      c.width = width;
      c.height = height;
    });

    // Setup contexts
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    const highlighterCtx = highlighterCanvas.getContext('2d');
    const textCtx = textCanvas.getContext('2d');
    
    if (!ctx || !previewCtx || !highlighterCtx || !textCtx) return;

    // Configure all contexts
    [ctx, previewCtx, highlighterCtx, textCtx].forEach(context => {
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
    });
    
    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state
    if (history.length === 0) {
      saveToHistory();
    }
  }, [history.length, saveToHistory]);

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

  // Render text elements
  useEffect(() => {
    const textCanvas = textCanvasRef.current;
    const textCtx = textCanvas?.getContext('2d');
    if (!textCtx || !textCanvas) return;

    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    
    textElements.forEach(element => {
      textCtx.fillStyle = element.color;
      textCtx.font = `${element.size}px Arial`;
      textCtx.fillText(element.text, element.x, element.y);
    });
  }, [textElements]);

  const getCanvasPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, shape: ShapeType) => {
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    switch (shape) {
      case 'rectangle':
        const width = endX - startX;
        const height = endY - startY;
        ctx.strokeRect(startX, startY, width, height);
        break;
      
      case 'circle':
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      
      case 'triangle':
        const midX = (startX + endX) / 2;
        ctx.beginPath();
        ctx.moveTo(midX, startY); // Top point
        ctx.lineTo(startX, endY); // Bottom left
        ctx.lineTo(endX, endY);   // Bottom right
        ctx.closePath();
        ctx.stroke();
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        break;
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
    
    if (drawingMode === 'text') {
      setTextPosition({ x, y });
      setIsAddingText(true);
      return;
    }
    
    setDrawingState({
      isDrawing: true,
      lastX: x,
      lastY: y,
      startX: x,
      startY: y,
    });
  }, [getCanvasPosition, drawingMode]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas?.getContext('2d');
    const highlighterCanvas = highlighterCanvasRef.current;
    const highlighterCtx = highlighterCanvas?.getContext('2d');
    if (!ctx || !previewCtx || !highlighterCtx) return;

    const { x, y } = getCanvasPosition(e);

    if (drawingMode === 'shape') {
      // Clear preview and draw shape preview
      clearPreviewCanvas();
      drawShape(previewCtx, drawingState.startX, drawingState.startY, x, y, selectedShape);
    } else if (drawingMode === 'brush') {
      // Brush drawing
      if (brushStyle === 'highlighter') {
        // Use separate highlighter canvas with multiply blend mode for consistent opacity
        highlighterCtx.globalAlpha = 0.3;
        highlighterCtx.globalCompositeOperation = 'source-over';
        highlighterCtx.strokeStyle = penColor;
        highlighterCtx.lineWidth = penSize * 3;
        
        highlighterCtx.beginPath();
        highlighterCtx.moveTo(drawingState.lastX, drawingState.lastY);
        highlighterCtx.lineTo(x, y);
        highlighterCtx.stroke();
        
        // Reset highlighter context
        highlighterCtx.globalAlpha = 1;
      } else if (brushStyle === 'eraser') {
        // Erase by drawing with white
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = penSize * 2;
        
        ctx.beginPath();
        ctx.moveTo(drawingState.lastX, drawingState.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Also erase from highlighter canvas
        highlighterCtx.globalCompositeOperation = 'destination-out';
        highlighterCtx.lineWidth = penSize * 2;
        highlighterCtx.beginPath();
        highlighterCtx.moveTo(drawingState.lastX, drawingState.lastY);
        highlighterCtx.lineTo(x, y);
        highlighterCtx.stroke();
        highlighterCtx.globalCompositeOperation = 'source-over';
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
      saveToHistory();
    } else if (drawingMode === 'brush') {
      saveToHistory();
    }

    setDrawingState(prev => ({ ...prev, isDrawing: false }));
  }, [drawingState.isDrawing, drawingState.startX, drawingState.startY, drawingMode, selectedShape, getCanvasPosition, drawShape, clearPreviewCanvas, saveToHistory]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const highlighterCanvas = highlighterCanvasRef.current;
    const highlighterCtx = highlighterCanvas?.getContext('2d');
    const textCanvas = textCanvasRef.current;
    const textCtx = textCanvas?.getContext('2d');
    if (!ctx || !canvas || !highlighterCtx || !highlighterCanvas || !textCtx || !textCanvas) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear highlighter canvas
    highlighterCtx.clearRect(0, 0, highlighterCanvas.width, highlighterCanvas.height);
    
    // Clear text canvas and elements
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    setTextElements([]);
    
    clearPreviewCanvas();
    saveToHistory();
  }, [clearPreviewCanvas, saveToHistory]);

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

  const handleToolSelect = useCallback((tool: string) => {
    setDrawingMode(tool as DrawingMode);
    setShowToolsDropdown(false);
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

  // Undo functionality
  const undo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const state = JSON.parse(history[newStep]);
      
      const canvas = canvasRef.current;
      const highlighterCanvas = highlighterCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      const highlighterCtx = highlighterCanvas?.getContext('2d');
      
      if (!ctx || !highlighterCtx || !canvas || !highlighterCanvas) return;
      
      const mainImg = new Image();
      const highlighterImg = new Image();
      
      mainImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mainImg, 0, 0);
      };
      
      highlighterImg.onload = () => {
        highlighterCtx.clearRect(0, 0, highlighterCanvas.width, highlighterCanvas.height);
        highlighterCtx.drawImage(highlighterImg, 0, 0);
      };
      
      mainImg.src = state.main;
      highlighterImg.src = state.highlighter;
      setTextElements(state.textElements || []);
      setHistoryStep(newStep);
    }
  }, [history, historyStep]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      const state = JSON.parse(history[newStep]);
      
      const canvas = canvasRef.current;
      const highlighterCanvas = highlighterCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      const highlighterCtx = highlighterCanvas?.getContext('2d');
      
      if (!ctx || !highlighterCtx || !canvas || !highlighterCanvas) return;
      
      const mainImg = new Image();
      const highlighterImg = new Image();
      
      mainImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mainImg, 0, 0);
      };
      
      highlighterImg.onload = () => {
        highlighterCtx.clearRect(0, 0, highlighterCanvas.width, highlighterCanvas.height);
        highlighterCtx.drawImage(highlighterImg, 0, 0);
      };
      
      mainImg.src = state.main;
      highlighterImg.src = state.highlighter;
      setTextElements(state.textElements || []);
      setHistoryStep(newStep);
    }
  }, [history, historyStep]);

  // Zoom functionality
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Export canvas
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const highlighterCanvas = highlighterCanvasRef.current;
    const textCanvas = textCanvasRef.current;
    if (!canvas || !highlighterCanvas || !textCanvas) return;

    // Create a temporary canvas to combine all layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw all layers
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.drawImage(highlighterCanvas, 0, 0);
    tempCtx.drawImage(textCanvas, 0, 0);

    // Download
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = tempCanvas.toDataURL();
    link.click();
  }, []);

  // Import image
  const importImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // Clear canvas and draw imported image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale image to fit canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) / 2;
        const x = (canvas.width / 2 - img.width * scale) / 2;
        const y = (canvas.height / 2 - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        saveToHistory();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [saveToHistory]);

  // Add text
  const addText = useCallback(() => {
    if (textInput.trim()) {
      const newTextElement: TextElement = {
        id: Date.now().toString(),
        x: textPosition.x,
        y: textPosition.y,
        text: textInput.trim(),
        color: penColor,
        size: penSize * 8,
      };
      setTextElements(prev => [...prev, newTextElement]);
      setTextInput('');
      setIsAddingText(false);
      saveToHistory();
    }
  }, [textInput, textPosition, penColor, penSize, saveToHistory]);

  const sendMessage = useCallback(() => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        username: currentUser.name,
        userColor: currentUser.color,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  }, [newMessage, currentUser]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isAddingText) {
        addText();
      } else {
        sendMessage();
      }
    }
  }, [sendMessage, addText, isAddingText]);

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
      <div className="sticky top-0 z-10 bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
                <div className="absolute top-12 left-0 p-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
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
                <div className="absolute top-12 left-0 p-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
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

            {/* Additional Tools */}
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  drawingMode === 'text' || drawingMode === 'select'
                    ? 'bg-purple-100 text-purple-600 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
                }`}
                title="Additional Tools"
              >
                {drawingMode === 'text' ? <Type size={16} /> : drawingMode === 'select' ? <Move size={16} /> : <Type size={16} />}
                <ChevronDown size={12} className={`transition-transform duration-300 ${showToolsDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showToolsDropdown && (
                <div className="absolute top-12 left-0 p-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                  {additionalTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out ${
                        drawingMode === tool.id
                          ? 'bg-purple-100 text-purple-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <tool.icon size={14} />
                      <span>{tool.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <button
                onClick={undo}
                disabled={historyStep <= 0}
                className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Undo"
              >
                <Undo size={16} />
              </button>
              <button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Redo"
              >
                <Redo size={16} />
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={zoomOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded min-w-[40px] transition-all duration-300 ease-in-out"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
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

            {/* Enhanced Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
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

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2">
            {/* Import/Export */}
            <button
              onClick={importImage}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
              title="Import image"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={exportCanvas}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
              title="Export canvas"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Clear Canvas Button */}
            <button
              onClick={clearCanvas}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:shadow-md"
              title="Clear entire canvas"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      {isAddingText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Text</h3>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={addText}
                disabled={!textInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200"
              >
                Add Text
              </button>
              <button
                onClick={() => setIsAddingText(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        {/* Canvas Area */}
        <div className="flex-1">
          <div 
            className="w-full h-full rounded-lg shadow-sm border border-gray-200 overflow-hidden relative bg-white"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {/* Main Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            {/* Highlighter Canvas */}
            <canvas
              ref={highlighterCanvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-none"
              style={{ mixBlendMode: 'multiply' }}
            />
            {/* Text Canvas */}
            <canvas
              ref={textCanvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-none"
            />
            {/* Preview Canvas for shapes */}
            <canvas
              ref={previewCanvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-none"
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full lg:w-80 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: '#f1f3f5', borderLeft: '1px solid #dee2e6' }}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">Team Chat</h3>
            <p className="text-sm text-gray-500">{messages.length} messages</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64 lg:max-h-none scrollbar-thin">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col space-y-1 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors duration-200">
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
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
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