export interface DrawingState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
}

export interface Message {
  id: string;
  text: string;
  username: string;
  userColor: string;
  timestamp: Date;
}

export type BrushStyle = 'pen' | 'eraser';
export type ShapeType = 'rectangle' | 'circle' | 'triangle';
export type DrawingMode = 'brush' | 'shape';
