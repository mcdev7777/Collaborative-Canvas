import React, { useRef } from 'react';
import {
    Minus, Plus, RotateCcw, Pen, Eraser,
    Square, Circle, Triangle, Pipette
} from 'lucide-react';
import { BrushStyle, DrawingMode, ShapeType } from '../lib/Types';

interface ToolbarProps {
  penSize: number;
  setPenSize: (size: number) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  brushStyle: BrushStyle;
  setBrushStyle: (style: BrushStyle) => void;
  selectedShape: ShapeType;
  setSelectedShape: (shape: ShapeType) => void;
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  clearCanvas: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  penSize,
  setPenSize,
  penColor,
  setPenColor,
  brushStyle,
  setBrushStyle,
  selectedShape,
  setSelectedShape,
  drawingMode,
  setDrawingMode,
  clearCanvas
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  const presetColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#6B7280', '#000000',
    '#06B6D4', '#84CC16', '#F97316', '#A855F7',
    '#E11D48', '#059669', '#DC2626', '#7C3AED'
  ];

  const brushStyles = [
    { id: 'pen', name: 'Pen', icon: Pen },
    { id: 'eraser', name: 'Eraser', icon: Eraser }
  ];

  const shapeTypes = [
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'triangle', name: 'Triangle', icon: Triangle }
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#101521] text-white p-4 rounded-md shadow-md border border-gray-700">
      {/* Brush Styles */}
      <div className="flex gap-2">
        {brushStyles.map(style => (
          <button
            key={style.id}
            onClick={() => {
              setBrushStyle(style.id as BrushStyle);
              setDrawingMode('brush');
            }}
            className={`p-2 rounded-md border ${
              brushStyle === style.id ? 'bg-blue-600' : 'bg-gray-800'
            }`}
            title={style.name}
          >
            <style.icon size={18} />
          </button>
        ))}
      </div>

      {/* Shape Selector */}
      <div className="flex gap-2">
        {shapeTypes.map(shape => (
          <button
            key={shape.id}
            onClick={() => {
              setSelectedShape(shape.id as ShapeType);
              setDrawingMode('shape');
            }}
            className={`p-2 rounded-md border ${
              selectedShape === shape.id && drawingMode === 'shape'
                ? 'bg-emerald-600'
                : 'bg-gray-800'
            }`}
            title={shape.name}
          >
            <shape.icon size={18} />
          </button>
        ))}
      </div>

      {/* Pen Size */}
      <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-md">
        <button
          onClick={() => setPenSize(Math.max(1, penSize - 1))}
          className="text-white"
        >
          <Minus size={14} />
        </button>
        <div className="w-6 text-center text-sm">{penSize}px</div>
        <button
          onClick={() => setPenSize(Math.min(20, penSize + 1))}
          className="text-white"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          ref={colorInputRef}
          className="hidden"
          onChange={(e) => setPenColor(e.target.value)}
        />
        <button
          onClick={() => colorInputRef.current?.click()}
          className="flex items-center gap-2 p-2 rounded-md bg-gray-800"
          disabled={brushStyle === 'eraser'}
          title="Pick Custom Color"
        >
          <Pipette size={14} />
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: penColor }}
          />
        </button>
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => setPenColor(color)}
            className={`w-5 h-5 rounded-full border-2 ${
              penColor === color ? 'border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Clear Canvas */}
      <button
        onClick={clearCanvas}
        className="ml-auto flex items-center gap-2 text-red-500 border border-red-500 px-3 py-1 rounded-md hover:bg-red-600 hover:text-white transition"
      >
        <RotateCcw size={14} />
        <span>Clear</span>
      </button>
    </div>
  );
};
