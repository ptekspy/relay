import type { ViewportResizeEvent } from "@paddy-systems/relay-protocol";

export type ViewportCallback = (event: ViewportResizeEvent) => void;

export class ViewportTracker {
  private active = false;
  private resizeHandler: (() => void) | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onViewport: ViewportCallback,
    private readonly debounceMs = 16, // Max ~60fps
  ) {}

  public install(): void {
    if (this.active || typeof window === "undefined") return;

    this.resizeHandler = () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.emitCurrentViewport();
      }, this.debounceMs);
    };

    window.addEventListener("resize", this.resizeHandler);
    window.addEventListener("orientationchange", this.resizeHandler);

    // Initial snapshot
    this.emitCurrentViewport();
    this.active = true;
  }

  public emitCurrentViewport(): void {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const orientation: "portrait" | "landscape" =
      width >= height ? "landscape" : "portrait";

    this.onViewport({
      kind: "viewport_resize",
      width,
      height,
      devicePixelRatio,
      orientation,
      timestamp: Date.now(),
    });
  }

  public uninstall(): void {
    if (!this.active || typeof window === "undefined") return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      window.removeEventListener("orientationchange", this.resizeHandler);
      this.resizeHandler = null;
    }

    this.active = false;
  }
}
