// Canvas.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { drawShape } from '../lib/Utils';
import { DrawingState, BrushStyle, DrawingMode, ShapeType, IncomingDrawMessage } from '../lib/Types';

interface CanvasProps {
    penColor: string;
    penSize: number;
    brushStyle: BrushStyle;
    drawingMode: DrawingMode;
    selectedShape: ShapeType;
    drawingState: DrawingState;
    setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
    socketRef: React.MutableRefObject<WebSocket | null>;
    clearCanvasRef: React.MutableRefObject<() => void>;
    receiveDrawRef: React.MutableRefObject<(data: IncomingDrawMessage) => void>;
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
    clearCanvasRef,
    receiveDrawRef,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const snapshotRef = useRef<ImageData | null>(null);
    const pointsRef = useRef<{ x: number; y: number }[]>([]);

    const getCtx = () => {
        const canvas = canvasRef.current;
        return canvas?.getContext('2d') ?? null;
    };

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
    
    const getMidpoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    });
    
    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasPosition(e);
        const ctx = getCtx();
        if (!ctx) return;

        if (drawingMode === 'shape') {
            snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        }

        pointsRef.current = [{ x, y }];

        setDrawingState({
            isDrawing: true,
            lastX: x,
            lastY: y,
            startX: x,
            startY: y,
        });
    }, [drawingMode, getCanvasPosition, setDrawingState]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingState.isDrawing) return;
        const ctx = getCtx();
        if (!ctx) return;

        const { x, y } = getCanvasPosition(e);

        if (drawingMode === 'shape') {
            if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
            drawShape(ctx, drawingState.startX, drawingState.startY, x, y, selectedShape, penColor, penSize);
        } else {
            const newPoint = { x, y };
            pointsRef.current.push(newPoint);

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushStyle === 'eraser' ? '#FFFFFF' : penColor;
            ctx.lineWidth = brushStyle === 'eraser' ? penSize * 2 : penSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (pointsRef.current.length >= 3) {
                const [p0, p1, p2] = pointsRef.current.slice(-3);
                const mid1 = getMidpoint(p0, p1);
                const mid2 = getMidpoint(p1, p2);

                ctx.beginPath();
                ctx.moveTo(mid1.x, mid1.y);
                ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
                ctx.stroke();
                ctx.closePath();
            }

            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(
                JSON.stringify({
                    type: 'draw',
                    x1: drawingState.lastX,
                    y1: drawingState.lastY,
                    x2: x,
                    y2: y,
                    color: brushStyle === 'eraser' ? '#FFFFFF' : penColor,
                    size: brushStyle === 'eraser' ? penSize * 2 : penSize,
                    isEraser: brushStyle === 'eraser',
                })
                );
            }

            setDrawingState(prev => ({ ...prev, lastX: x, lastY: y }));
        }
    }, [drawingState, getCanvasPosition, brushStyle, penColor, penSize, drawingMode, selectedShape, setDrawingState, socketRef]);

    const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingState.isDrawing || !e) return;
        const ctx = getCtx();
        if (!ctx) return;

        const { x, y } = getCanvasPosition(e);

        if (drawingMode === 'shape') {
            ctx.restore();
            drawShape(ctx, drawingState.startX, drawingState.startY, x, y, selectedShape, penColor, penSize);

            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'shape',
                    shapeType: selectedShape,
                    startX: drawingState.startX,
                    startY: drawingState.startY,
                    endX: x,
                    endY: y,
                    color: penColor,
                    size: penSize,
                }));
            }
        }

        pointsRef.current = [];
        setDrawingState(prev => ({ ...prev, isDrawing: false }));
    }, [drawingState, drawingMode, getCanvasPosition, selectedShape, penColor, penSize, setDrawingState, socketRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);

        clearCanvasRef.current = () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(dpr, dpr);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, rect.width, rect.height);
        };

        receiveDrawRef.current = (data: IncomingDrawMessage) => {
            if (!ctx) return;
            ctx.save();

            if (data.type === 'draw') {
                ctx.strokeStyle = data.color;
                ctx.lineWidth = data.size;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(data.x1 / dpr, data.y1 / dpr);
                ctx.lineTo(data.x2 / dpr, data.y2 / dpr);
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            } else if (data.type === 'shape') {
                drawShape(ctx, data.startX / dpr, data.startY / dpr, data.endX / dpr, data.endY / dpr, data.shapeType, data.color, data.size);
            }

            ctx.restore();
        };
    }, []);

    return (
        <div className="w-full h-full relative bg-white rounded-lg overflow-hidden border border-gray-200">
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
