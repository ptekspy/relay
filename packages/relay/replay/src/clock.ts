import type { PlaybackState } from "./types.js";

export type ClockTickCallback = (
  currentTime: number,
  state: PlaybackState,
) => void;

/**
 * Headless virtual playhead clock supporting variable playback speeds and seeking.
 */
export class VirtualClock {
  private startTime: number;
  private endTime: number;
  private currentTime: number;
  private speed = 1.0;
  private state: PlaybackState = "idle";
  private tickListeners = new Set<ClockTickCallback>();
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private lastTickWallTime: number = Date.now();

  constructor(startTime: number, endTime: number) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.currentTime = startTime;
  }

  public setSpeed(speed: number): void {
    if (speed <= 0) {
      throw new Error("Playback speed must be strictly positive");
    }
    this.speed = speed;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public getProgressPercent(): number {
    const range = this.endTime - this.startTime;
    if (range <= 0) return 100;
    const progress = ((this.currentTime - this.startTime) / range) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  public seek(targetTimestamp: number): void {
    this.currentTime = Math.min(
      this.endTime,
      Math.max(this.startTime, targetTimestamp),
    );
    if (this.currentTime >= this.endTime) {
      this.state = "ended";
    }
    this.emitTick();
  }

  public play(): void {
    if (this.currentTime >= this.endTime) {
      this.currentTime = this.startTime;
    }
    this.state = "playing";
    this.lastTickWallTime = Date.now();
    this.emitTick();

    if (!this.intervalTimer) {
      this.intervalTimer = setInterval(() => this.step(), 50);
    }
  }

  public pause(): void {
    this.state = "paused";
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.emitTick();
  }

  public step(stepMs?: number): void {
    if (this.state !== "playing") return;

    const now = Date.now();
    const elapsedWall =
      stepMs !== undefined ? stepMs : now - this.lastTickWallTime;
    this.lastTickWallTime = now;

    const delta = elapsedWall * this.speed;
    this.currentTime += delta;

    if (this.currentTime >= this.endTime) {
      this.currentTime = this.endTime;
      this.state = "ended";
      if (this.intervalTimer) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
    }

    this.emitTick();
  }

  public onTick(cb: ClockTickCallback): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  private emitTick(): void {
    for (const listener of this.tickListeners) {
      listener(this.currentTime, this.state);
    }
  }

  public destroy(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.tickListeners.clear();
  }
}
