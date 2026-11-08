/**
 * Session Annotation & Drawing Canvas Tool
 *
 * Implements redline overlays, circles, arrows, rectangles, and text notes
 * on top of live receiver streams or replay viewports. Annotations synchronize
 * with mobile screens and can be embedded into bug report screenshots.
 *
 * Note for Octavia: Used in apps/relay/cloud-web/components/annotation/DrawingCanvas.tsx
 */

export type AnnotationTool = "line" | "circle" | "arrow" | "rect" | "text";

export interface AnnotationItem {
  id: string;
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  text?: string;
  timestamp: number;
}

export class AnnotationManager {
  private items: AnnotationItem[] = [];

  public addItem(
    item: Omit<AnnotationItem, "id" | "timestamp">,
  ): AnnotationItem {
    const fullItem: AnnotationItem = {
      ...item,
      id: `ann_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: Date.now(),
    };
    this.items.push(fullItem);
    return fullItem;
  }

  public removeItem(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return this.items.length < initialLen;
  }

  public clear(): void {
    this.items = [];
  }

  public getItems(): AnnotationItem[] {
    return [...this.items];
  }

  public renderToCanvas(
    ctx: CanvasRenderingContext2D,
    itemsToRender = this.items,
  ): void {
    for (const item of itemsToRender) {
      ctx.save();
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (item.tool === "line") {
        ctx.beginPath();
        ctx.moveTo(item.startX, item.startY);
        ctx.lineTo(item.endX, item.endY);
        ctx.stroke();
      } else if (item.tool === "rect") {
        const x = Math.min(item.startX, item.endX);
        const y = Math.min(item.startY, item.endY);
        const w = Math.abs(item.endX - item.startX);
        const h = Math.abs(item.endY - item.startY);
        ctx.strokeRect(x, y, w, h);
      } else if (item.tool === "circle") {
        const rx = Math.abs(item.endX - item.startX) / 2;
        const ry = Math.abs(item.endY - item.startY) / 2;
        const cx = Math.min(item.startX, item.endX) + rx;
        const cy = Math.min(item.startY, item.endY) + ry;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          Math.max(1, rx),
          Math.max(1, ry),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      } else if (item.tool === "arrow") {
        // Draw main line
        ctx.beginPath();
        ctx.moveTo(item.startX, item.startY);
        ctx.lineTo(item.endX, item.endY);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(
          item.endY - item.startY,
          item.endX - item.startX,
        );
        const headLength = 12;
        ctx.beginPath();
        ctx.moveTo(item.endX, item.endY);
        ctx.lineTo(
          item.endX - headLength * Math.cos(angle - Math.PI / 6),
          item.endY - headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          item.endX - headLength * Math.cos(angle + Math.PI / 6),
          item.endY - headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
      } else if (item.tool === "text" && item.text) {
        ctx.font = `${Math.max(12, item.lineWidth * 4)}px sans-serif`;
        ctx.fillText(item.text, item.startX, item.startY);
      }

      ctx.restore();
    }
  }

  public serialize(): string {
    return JSON.stringify(this.items);
  }

  public deserialize(json: string): void {
    try {
      const parsed = JSON.parse(json) as AnnotationItem[];
      if (Array.isArray(parsed)) {
        this.items = parsed;
      }
    } catch {
      // Ignore malformed json
    }
  }
}
