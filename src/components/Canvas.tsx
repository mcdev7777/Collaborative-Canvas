import React, { useEffect, useRef, useCallback } from 'react';
import { drawShape, clearPreviewCanvas } from '../lib/Utils';
import { DrawingState, BrushStyle, DrawingMode, ShapeType } from '../lib/Types';

interface CanvasProps {
    penColor: string;
    penSize: number;
    brushStyle: BrushStyle;
    drawingMode: DrawingMode;
    selectedShape: ShapeType;
    drawingState: DrawingState;
    setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
    socketRef: React.MutableRefObject<WebSocket | null>;
}

export const Canvas: React.FC<CanvasProps> = ({
    penColor,
    penSize,
    brushStyle,
    drawingMode,
    selectedShape,
    drawingState,
    setDrawingState,
    socketRef,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const getCanvasPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        return {
            x: (e.clientX - rect.left) * dpr,
            y: (e.clientY - rect.top) * dpr,
        };
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
    }, [getCanvasPosition, setDrawingState]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingState.isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const previewCanvas = previewCanvasRef.current;
        const previewCtx = previewCanvas?.getContext('2d');
        if (!ctx || !previewCtx) return;

        const { x, y } = getCanvasPosition(e);

        if (drawingMode === 'shape') {
            clearPreviewCanvas(previewCtx, previewCanvas!);
            drawShape(previewCtx, drawingState.startX, drawingState.startY, x, y, selectedShape, penColor, penSize);
        } else {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushStyle === 'eraser' ? '#FFFFFF' : penColor;
            ctx.lineWidth = brushStyle === 'eraser' ? penSize * 2 : penSize;

            ctx.beginPath();
            ctx.moveTo(drawingState.lastX, drawingState.lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && brushStyle !== 'eraser') {
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

            setDrawingState(prev => ({
                ...prev,
                lastX: x,
                lastY: y,
            }));
        }
    }, [drawingState, getCanvasPosition, brushStyle, penColor, penSize, drawingMode, selectedShape, setDrawingState, socketRef]);

    const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingState.isDrawing) return;

        if (drawingMode === 'shape' && e) {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;

            const { x, y } = getCanvasPosition(e);
            drawShape(ctx, drawingState.startX, drawingState.startY, x, y, selectedShape, penColor, penSize);
            clearPreviewCanvas(ctx, canvas!);
        }

        setDrawingState(prev => ({ ...prev, isDrawing: false }));
    }, [drawingState, drawingMode, getCanvasPosition, selectedShape, penColor, penSize, setDrawingState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const preview = previewCanvasRef.current;
        if (!canvas || !preview) return;

        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const dpr = window.devicePixelRatio || 1;

        [canvas, preview].forEach(c => {
            c.width = width * dpr;
            c.height = height * dpr;
            c.style.width = `${width}px`;
            c.style.height = `${height}px`;

            const ctx = c.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        });

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
    }, []);


    return (
        <div className="w-full h-full relative bg-white rounded-lg overflow-hidden border border-gray-200">
            <canvas
                ref={previewCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />
        </div>
    );
};
