import {ShapeType} from './Types';

export function drawShape(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    shape: ShapeType,
    penColor: string,
    penSize: number
) {
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.globalAlpha = 1; // Ensure full opacity for shapes
    ctx.globalCompositeOperation = 'source-over'; // Default composite operation

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
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }
        case 'triangle': {
            const midX = (startX + endX) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, startY);
            ctx.lineTo(startX, endY);
            ctx.lineTo(endX, endY);
            ctx.closePath();
            ctx.stroke();
            break;
        }
    }
}

export function clearPreviewCanvas(
    ctx: CanvasRenderingContext2D,
    canavas: HTMLCanvasElement
){
    ctx.clearRect(0, 0, canavas.width, canavas.height);
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}