"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AnnotationItem,
  AnnotationManager,
  type AnnotationTool,
} from "../../lib/annotation-canvas";

interface DrawingCanvasProps {
  width: number;
  height: number;
  onAnnotationChange?: (items: AnnotationItem[]) => void;
  className?: string;
}

export function DrawingCanvas({
  width,
  height,
  onAnnotationChange,
  className = "",
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<AnnotationManager>(new AnnotationManager());
  const [currentTool, setCurrentTool] = useState<AnnotationTool>("arrow");
  const [currentColor, setCurrentColor] = useState<string>("#FF3366");
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    managerRef.current.renderToCanvas(ctx);
  }, []);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    redraw();

    // Render live preview of pending shape
    ctx.save();
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([4, 4]);

    if (currentTool === "line" || currentTool === "arrow") {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (currentTool === "rect") {
      ctx.strokeRect(
        Math.min(startPos.x, currentX),
        Math.min(startPos.y, currentY),
        Math.abs(currentX - startPos.x),
        Math.abs(currentY - startPos.y),
      );
    } else if (currentTool === "circle") {
      const rx = Math.abs(currentX - startPos.x) / 2;
      const ry = Math.abs(currentY - startPos.y) / 2;
      const cx = Math.min(startPos.x, currentX) + rx;
      const cy = Math.min(startPos.y, currentY) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    setIsDrawing(false);
    setStartPos(null);

    managerRef.current.addItem({
      tool: currentTool,
      color: currentColor,
      lineWidth,
      startX: startPos.x,
      startY: startPos.y,
      endX,
      endY,
      text: currentTool === "text" ? "Bug Note" : undefined,
    });

    redraw();
    if (onAnnotationChange) {
      onAnnotationChange(managerRef.current.getItems());
    }
  };

  const handleClear = () => {
    managerRef.current.clear();
    redraw();
    if (onAnnotationChange) {
      onAnnotationChange([]);
    }
  };

  return (
    <div
      className={`relative inline-block border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/80 ${className}`}
    >
      {/* Annotation Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs">
        <span className="font-semibold text-neutral-400">Tool:</span>
        {(["arrow", "circle", "rect", "line", "text"] as AnnotationTool[]).map(
          (tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => setCurrentTool(tool)}
              className={`px-2 py-1 rounded capitalize ${
                currentTool === tool
                  ? "bg-primary text-black font-medium"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {tool}
            </button>
          ),
        )}

        <span className="ml-2 font-semibold text-neutral-400">Color:</span>
        {["#FF3366", "#00E5FF", "#FFE600", "#00FF66", "#FFFFFF"].map(
          (color) => (
            <button
              key={color}
              type="button"
              onClick={() => setCurrentColor(color)}
              aria-label={`Select color ${color}`}
              className={`w-4 h-4 rounded-full border ${
                currentColor === color
                  ? "border-white ring-2 ring-primary"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ),
        )}

        <span className="ml-2 font-semibold text-neutral-400">Width:</span>
        {[2, 4, 6].map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setLineWidth(w)}
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              lineWidth === w
                ? "bg-neutral-200 text-black font-semibold"
                : "bg-neutral-800 text-neutral-300"
            }`}
          >
            {w}px
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 bg-red-950/60 text-red-400 hover:bg-red-900/60 rounded"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Overlay Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="cursor-crosshair block"
      />
    </div>
  );
}
