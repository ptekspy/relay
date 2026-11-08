/**
 * Touch Ripple & Pointer Visualization Overlay
 *
 * Tracks multi-touch interactions from mobile receivers and renders animated
 * visual ripples and pointer paths on the host dev screen in real time (< 30ms overhead).
 *
 * Note for Octavia: This provides desktop developers with a visual representation of mobile touch gestures.
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  radiusX?: number;
  radiusY?: number;
  force?: number;
}

export type TouchPhase = "start" | "move" | "end" | "cancel";

export interface TouchStreamEvent {
  phase: TouchPhase;
  touches: TouchPoint[];
  timestamp: number;
}

export interface TouchMarker {
  id: number;
  x: number;
  y: number;
  phase: TouchPhase;
  createdTimestamp: number;
  latencyMs: number;
}

export class TouchVisualizer {
  private activeTouches = new Map<number, TouchMarker>();
  private completedRipples: TouchMarker[] = [];
  private static readonly MAX_COMPLETED_RIPPLES = 50;

  public getActiveTouches(): TouchMarker[] {
    return Array.from(this.activeTouches.values());
  }

  public getCompletedRipples(): TouchMarker[] {
    return [...this.completedRipples];
  }

  public processTouchEvent(event: TouchStreamEvent): TouchMarker[] {
    const now = Date.now();
    const latencyMs = Math.max(0, now - event.timestamp);
    const affectedMarkers: TouchMarker[] = [];

    switch (event.phase) {
      case "start":
      case "move": {
        for (const pt of event.touches) {
          const marker: TouchMarker = {
            id: pt.id,
            x: pt.x,
            y: pt.y,
            phase: event.phase,
            createdTimestamp: now,
            latencyMs,
          };
          this.activeTouches.set(pt.id, marker);
          affectedMarkers.push(marker);
        }
        break;
      }

      case "end":
      case "cancel": {
        for (const pt of event.touches) {
          const existing = this.activeTouches.get(pt.id);
          const marker: TouchMarker = {
            id: pt.id,
            x: pt.x,
            y: pt.y,
            phase: event.phase,
            createdTimestamp: existing?.createdTimestamp ?? now,
            latencyMs,
          };
          this.activeTouches.delete(pt.id);
          this.completedRipples.push(marker);
          if (
            this.completedRipples.length > TouchVisualizer.MAX_COMPLETED_RIPPLES
          ) {
            this.completedRipples.shift();
          }
          affectedMarkers.push(marker);
        }
        break;
      }
    }

    return affectedMarkers;
  }

  public generateRippleCss(color = "rgba(59, 130, 246, 0.6)"): string {
    return `
      .relay-touch-ripple {
        position: absolute;
        pointer-events: none;
        border-radius: 50%;
        background: ${color};
        transform: translate(-50%, -50%) scale(0);
        animation: relayRippleExpand 400ms cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        box-shadow: 0 0 12px ${color};
        z-index: 999999;
      }
      @keyframes relayRippleExpand {
        0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.9; width: 24px; height: 24px; }
        100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0; width: 48px; height: 48px; }
      }
    `.trim();
  }

  public renderRippleElement(
    x: number,
    y: number,
  ): { style: Record<string, string>; className: string } {
    return {
      className: "relay-touch-ripple",
      style: {
        left: `${x}px`,
        top: `${y}px`,
        width: "36px",
        height: "36px",
      },
    };
  }

  public clear(): void {
    this.activeTouches.clear();
    this.completedRipples = [];
  }
}
