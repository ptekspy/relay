export interface SyntheticInteractionEvent {
  type: "pointermove" | "touchstart" | "touchend" | "scroll";
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

export class UserInteractionSimulator {
  public generateScrollTrajectory(
    steps = 10,
    startY = 0,
    deltaY = 50,
  ): SyntheticInteractionEvent[] {
    const events: SyntheticInteractionEvent[] = [];
    const now = Date.now();

    for (let i = 0; i < steps; i++) {
      events.push({
        type: "scroll",
        x: 100,
        y: startY + deltaY * i,
        timestamp: now + i * 16, // ~60fps
      });
    }

    return events;
  }

  public generateTouchTap(x: number, y: number): SyntheticInteractionEvent[] {
    const now = Date.now();
    return [
      { type: "touchstart", x, y, timestamp: now, pressure: 0.8 },
      { type: "touchend", x, y, timestamp: now + 50, pressure: 0 },
    ];
  }
}

export const userInteractionSimulator = new UserInteractionSimulator();
