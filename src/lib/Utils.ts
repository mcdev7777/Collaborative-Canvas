//import {ShapeType} from './Types';

export function drawShape(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  shapeType: string,
  color: string,
  size: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();

  switch (shapeType) {
    case 'rectangle':
      ctx.strokeRect(
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(endX - startX),
        Math.abs(endY - startY)
      );
      break;
    case 'circle': {
      const radius = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    }
    case 'triangle':
      ctx.moveTo(startX, endY);
      ctx.lineTo((startX + endX) / 2, startY);
      ctx.lineTo(endX, endY);
      ctx.closePath();
      ctx.stroke();
      break;
    default:
      break;
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