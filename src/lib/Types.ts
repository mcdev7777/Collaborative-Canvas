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

export type IncomingDrawMessage =
  | {
      type: 'draw';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      size: number;
      isEraser?: boolean;
    }
  | {
      type: 'shape';
      shapeType: ShapeType;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
      size: number;
    };

export type BrushStyle = 'pen' | 'eraser';
export type ShapeType = 'rectangle' | 'circle' | 'triangle';
export type DrawingMode = 'brush' | 'shape';
