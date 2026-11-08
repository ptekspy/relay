export interface FlowControlOptions {
  highWatermarkBytes?: number;
  lowWatermarkBytes?: number;
}

export class FlowControlBuffer {
  private queue: Uint8Array[] = [];
  private totalBytes = 0;
  private isPaused = false;
  private readonly highWatermark: number;
  private readonly lowWatermark: number;
  private pauseCallbacks = new Set<(paused: boolean) => void>();

  constructor(options: FlowControlOptions = {}) {
    this.highWatermark = options.highWatermarkBytes ?? 1024 * 1024; // 1MB
    this.lowWatermark = options.lowWatermarkBytes ?? 256 * 1024; // 256KB
  }

  public push(chunk: Uint8Array): boolean {
    this.queue.push(chunk);
    this.totalBytes += chunk.byteLength;

    if (!this.isPaused && this.totalBytes >= this.highWatermark) {
      this.isPaused = true;
      this.notifyPause(true);
    }

    return !this.isPaused;
  }

  public pull(): Uint8Array | undefined {
    const chunk = this.queue.shift();
    if (!chunk) return undefined;

    this.totalBytes -= chunk.byteLength;

    if (this.isPaused && this.totalBytes <= this.lowWatermark) {
      this.isPaused = false;
      this.notifyPause(false);
    }

    return chunk;
  }

  public get bufferedBytes(): number {
    return this.totalBytes;
  }

  public get paused(): boolean {
    return this.isPaused;
  }

  public onPauseChange(cb: (paused: boolean) => void): () => void {
    this.pauseCallbacks.add(cb);
    return () => this.pauseCallbacks.delete(cb);
  }

  private notifyPause(paused: boolean): void {
    for (const cb of this.pauseCallbacks) {
      cb(paused);
    }
  }
}
