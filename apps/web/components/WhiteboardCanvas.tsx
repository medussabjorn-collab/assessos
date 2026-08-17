'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { Pencil, Square, Circle, ArrowRight, Type, Eraser, Trash2 } from 'lucide-react';

type Tool = 'pen' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'eraser';

interface BaseShape {
  id: string;
  color: string;
}
interface PenShape extends BaseShape {
  type: 'pen';
  points: number[]; // flat [x1, y1, x2, y2, ...]
}
interface RectShape extends BaseShape {
  type: 'rect' | 'ellipse';
  x: number;
  y: number;
  w: number;
  h: number;
}
interface ArrowShape extends BaseShape {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
}
type Shape = PenShape | RectShape | ArrowShape | TextShape;

const TOOLS: { id: Tool; label: string; icon: typeof Pencil }[] = [
  { id: 'pen', label: 'Pen', icon: Pencil },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
];

const COLORS = ['#0f172a', '#dc2626', '#2563eb', '#16a34a', '#d97706'];

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (shape.type === 'pen') {
    if (shape.points.length < 4) return;
    ctx.beginPath();
    ctx.moveTo(shape.points[0], shape.points[1]);
    for (let i = 2; i < shape.points.length; i += 2) ctx.lineTo(shape.points[i], shape.points[i + 1]);
    ctx.stroke();
  } else if (shape.type === 'rect') {
    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
  } else if (shape.type === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(shape.x + shape.w / 2, shape.y + shape.h / 2, Math.abs(shape.w) / 2, Math.abs(shape.h) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape.type === 'arrow') {
    const { x1, y1, x2, y2 } = shape;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  } else if (shape.type === 'text') {
    ctx.font = '16px sans-serif';
    ctx.fillText(shape.text, shape.x, shape.y);
  }
}

function hitTest(shape: Shape, x: number, y: number): boolean {
  const pad = 6;
  if (shape.type === 'pen') {
    for (let i = 0; i < shape.points.length - 2; i += 2) {
      const [x1, y1, x2, y2] = [shape.points[i], shape.points[i + 1], shape.points[i + 2], shape.points[i + 3]];
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (len * len)));
      const px = x1 + t * (x2 - x1);
      const py = y1 + t * (y2 - y1);
      if (Math.hypot(x - px, y - py) <= pad + 4) return true;
    }
    return false;
  }
  if (shape.type === 'rect' || shape.type === 'ellipse') {
    return x >= shape.x - pad && x <= shape.x + shape.w + pad && y >= shape.y - pad && y <= shape.y + shape.h + pad;
  }
  if (shape.type === 'arrow') {
    const len = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) || 1;
    const t = Math.max(
      0,
      Math.min(1, ((x - shape.x1) * (shape.x2 - shape.x1) + (y - shape.y1) * (shape.y2 - shape.y1)) / (len * len)),
    );
    const px = shape.x1 + t * (shape.x2 - shape.x1);
    const py = shape.y1 + t * (shape.y2 - shape.y1);
    return Math.hypot(x - px, y - py) <= pad + 6;
  }
  if (shape.type === 'text') {
    return x >= shape.x - pad && x <= shape.x + 200 && y >= shape.y - 18 && y <= shape.y + pad;
  }
  return false;
}

interface WhiteboardCanvasProps {
  ydoc: Y.Doc;
  connected: boolean;
}

export default function WhiteboardCanvas({ ydoc, connected }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesMapRef = useRef<Y.Map<Shape>>();
  if (!shapesMapRef.current) shapesMapRef.current = ydoc.getMap<Shape>('whiteboard');
  const shapesMap = shapesMapRef.current;

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const drawingRef = useRef<Shape | null>(null);

  useEffect(() => {
    const sync = () => setShapes([...shapesMap.values()]);
    sync();
    shapesMap.observe(sync);
    return () => shapesMap.unobserve(sync);
  }, [shapesMap]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const shape of shapes) drawShape(ctx, shape);
    if (drawingRef.current) drawShape(ctx, drawingRef.current);
  }, [shapes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerPos(e);

    if (tool === 'eraser') {
      const hit = [...shapesMap.values()].find((s) => hitTest(s, x, y));
      if (hit) shapesMap.delete(hit.id);
      return;
    }

    if (tool === 'text') {
      const text = window.prompt('Text:');
      if (text) {
        const shape: TextShape = { id: crypto.randomUUID(), type: 'text', color, x, y, text };
        shapesMap.set(shape.id, shape);
      }
      return;
    }

    const id = crypto.randomUUID();
    if (tool === 'pen') {
      drawingRef.current = { id, type: 'pen', color, points: [x, y] };
    } else if (tool === 'rect' || tool === 'ellipse') {
      drawingRef.current = { id, type: tool, color, x, y, w: 0, h: 0 };
    } else if (tool === 'arrow') {
      drawingRef.current = { id, type: 'arrow', color, x1: x, y1: y, x2: x, y2: y };
    }
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drawing = drawingRef.current;
    if (!drawing || tool === 'eraser' || tool === 'text') return;
    const { x, y } = pointerPos(e);

    if (drawing.type === 'pen') {
      drawing.points.push(x, y);
    } else if (drawing.type === 'rect' || drawing.type === 'ellipse') {
      drawing.w = x - drawing.x;
      drawing.h = y - drawing.y;
    } else if (drawing.type === 'arrow') {
      drawing.x2 = x;
      drawing.y2 = y;
    }
    redraw();
  };

  const handlePointerUp = () => {
    const drawing = drawingRef.current;
    if (drawing) shapesMap.set(drawing.id, drawing);
    drawingRef.current = null;
    redraw();
  };

  const clearAll = () => {
    for (const id of [...shapesMap.keys()]) shapesMap.delete(id);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-hairline">
      <div className="flex items-center gap-2 px-4 py-2 bg-canvas border-b border-hairline">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            title={label}
            onClick={() => setTool(id)}
            className={`p-1.5 rounded-lg transition ${
              tool === id ? 'bg-brand-600 text-white' : 'text-subtle hover:bg-surface hover:text-ink'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
        <div className="flex items-center gap-1 ml-2">
          {COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={clearAll}
          title="Clear all"
          className="p-1.5 rounded-lg text-subtle hover:bg-surface hover:text-red-500 transition ml-auto"
        >
          <Trash2 size={16} />
        </button>
        <span className={`text-xs font-medium ${connected ? 'text-green-600' : 'text-subtle'}`}>
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={520}
        className="bg-white touch-none cursor-crosshair w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
