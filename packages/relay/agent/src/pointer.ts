import type {
  TouchEventCoordinate,
  TouchTelemetryEvent,
} from "@paddy-systems/relay-protocol";

export type TouchCallback = (event: TouchTelemetryEvent) => void;

export class PointerTracker {
  private active = false;
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private touchCancelHandler: ((e: TouchEvent) => void) | null = null;

  constructor(private readonly onTouch: TouchCallback) {}

  public install(): void {
    if (this.active || typeof window === "undefined") return;

    this.touchStartHandler = (e: TouchEvent) =>
      this.handleTouchEvent("touchstart", e);
    this.touchMoveHandler = (e: TouchEvent) =>
      this.handleTouchEvent("touchmove", e);
    this.touchEndHandler = (e: TouchEvent) =>
      this.handleTouchEvent("touchend", e);
    this.touchCancelHandler = (e: TouchEvent) =>
      this.handleTouchEvent("touchcancel", e);

    window.addEventListener("touchstart", this.touchStartHandler, {
      passive: true,
    });
    window.addEventListener("touchmove", this.touchMoveHandler, {
      passive: true,
    });
    window.addEventListener("touchend", this.touchEndHandler, {
      passive: true,
    });
    window.addEventListener("touchcancel", this.touchCancelHandler, {
      passive: true,
    });

    this.active = true;
  }

  private handleTouchEvent(
    type: TouchTelemetryEvent["type"],
    e: TouchEvent,
  ): void {
    const touches: TouchEventCoordinate[] = [];
    const touchList =
      type === "touchend" || type === "touchcancel"
        ? e.changedTouches
        : e.touches;

    for (let i = 0; i < touchList.length; i++) {
      const t = touchList.item(i);
      if (t) {
        touches.push({
          identifier: t.identifier,
          clientX: Math.round(t.clientX),
          clientY: Math.round(t.clientY),
        });
      }
    }

    this.onTouch({
      kind: "touch",
      type,
      touches,
      timestamp: Date.now(),
    });
  }

  public uninstall(): void {
    if (!this.active || typeof window === "undefined") return;

    if (this.touchStartHandler)
      window.removeEventListener("touchstart", this.touchStartHandler);
    if (this.touchMoveHandler)
      window.removeEventListener("touchmove", this.touchMoveHandler);
    if (this.touchEndHandler)
      window.removeEventListener("touchend", this.touchEndHandler);
    if (this.touchCancelHandler)
      window.removeEventListener("touchcancel", this.touchCancelHandler);

    this.touchStartHandler = null;
    this.touchMoveHandler = null;
    this.touchEndHandler = null;
    this.touchCancelHandler = null;
    this.active = false;
  }
}
