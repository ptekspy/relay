export interface TerminalDimensions {
  columns: number;
  rows: number;
  isNarrow: boolean;
  isCompact: boolean;
}

export type ResizeListener = (dimensions: TerminalDimensions) => void;

export class TerminalLayoutManager {
  private listeners = new Set<ResizeListener>();
  private onResizeHandler: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof process === "undefined" || !process.stdout) return;

    this.onResizeHandler = () => {
      const dims = this.getDimensions();
      for (const listener of this.listeners) {
        try {
          listener(dims);
        } catch {
          // Never throw from terminal listener
        }
      }
    };

    process.stdout.on("resize", this.onResizeHandler);
  }

  public getDimensions(): TerminalDimensions {
    const columns = process.stdout?.columns || 80;
    const rows = process.stdout?.rows || 24;

    return {
      columns,
      rows,
      isNarrow: columns < 80,
      isCompact: rows < 20,
    };
  }

  public subscribe(listener: ResizeListener): () => void {
    this.listeners.add(listener);
    // Emit initial dimensions
    listener(this.getDimensions());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    if (this.onResizeHandler && process.stdout) {
      process.stdout.off("resize", this.onResizeHandler);
      this.onResizeHandler = null;
    }
    this.listeners.clear();
  }
}
