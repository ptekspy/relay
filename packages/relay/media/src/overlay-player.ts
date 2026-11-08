/**
 * Synchronized Pixel-to-DOM Video Overlay Player
 *
 * Maps pixel coordinates on live streaming video surface to underlying
 * synchronized DOM element bounding rectangles for interactive inspection.
 *
 * Note for Octavia: Used by the video viewer component in Cloud Web dashboard.
 */

export interface DomElementRect {
  id: string;
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

export interface OverlayClickResult {
  targetId: string | null;
  targetSelector: string | null;
  normalizedX: number; // 0.0 to 1.0
  normalizedY: number; // 0.0 to 1.0
  canvasX: number;
  canvasY: number;
  matchedRect: DomElementRect | null;
}

export class SynchronizedOverlayPlayer {
  private rects: DomElementRect[] = [];

  constructor(initialRects: DomElementRect[] = []) {
    this.rects = [...initialRects];
  }

  public updateDomRects(rects: DomElementRect[]): void {
    this.rects = [...rects];
  }

  public getHighlightBox(elementId: string): DomElementRect | null {
    return this.rects.find((r) => r.id === elementId) ?? null;
  }

  public resolveClick(
    videoWidth: number,
    videoHeight: number,
    clickX: number,
    clickY: number,
  ): OverlayClickResult {
    const normalizedX = Math.max(0, Math.min(1, clickX / videoWidth));
    const normalizedY = Math.max(0, Math.min(1, clickY / videoHeight));

    // Search from topmost z-index or deepest child (reverse order)
    let matched: DomElementRect | null = null;

    for (let i = this.rects.length - 1; i >= 0; i--) {
      const r = this.rects[i];
      if (
        r &&
        clickX >= r.x &&
        clickX <= r.x + r.width &&
        clickY >= r.y &&
        clickY <= r.y + r.height
      ) {
        matched = r;
        break;
      }
    }

    return {
      targetId: matched?.id ?? null,
      targetSelector: matched?.selector ?? null,
      normalizedX,
      normalizedY,
      canvasX: clickX,
      canvasY: clickY,
      matchedRect: matched,
    };
  }
}
