/**
 * Real-Time Performance Profiler (FPS, Long Tasks, Layout Shifts)
 *
 * Instruments the browser runtime with PerformanceObserver to monitor
 * rendering framerate (FPS), Long Tasks (>50ms), Cumulative Layout Shift (CLS),
 * and input responsiveness metrics.
 *
 * Note for Octavia: Telemetry flows into the Performance dashboard timeline.
 */

export interface LongTaskRecord {
  durationMs: number;
  startTime: number;
  name?: string;
}

export interface PerformanceSnapshot {
  fps: number;
  clsScore: number;
  longTasksCount: number;
  recentLongTasks: LongTaskRecord[];
  timestamp: number;
}

export interface PerformanceEnvironment {
  requestAnimationFrame?: (cb: (time: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  PerformanceObserver?: typeof PerformanceObserver;
}

export class PerformanceProfiler {
  private active = false;
  private rafId: number | null = null;
  private frameCount = 0;
  private lastFpsCalculationTime = 0;
  private currentFps = 60;
  private clsScore = 0;
  private longTasks: LongTaskRecord[] = [];
  private observer: PerformanceObserver | null = null;

  public start(
    env: PerformanceEnvironment = typeof window !== "undefined" ? window : {},
  ): void {
    if (this.active) return;
    this.active = true;
    this.frameCount = 0;
    this.lastFpsCalculationTime =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    // Start FPS tracking loop
    if (typeof env.requestAnimationFrame === "function") {
      const loop = (timestamp: number) => {
        if (!this.active) return;
        this.frameCount++;
        const elapsed = timestamp - this.lastFpsCalculationTime;
        if (elapsed >= 1000) {
          this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
          this.frameCount = 0;
          this.lastFpsCalculationTime = timestamp;
        }
        if (env.requestAnimationFrame) {
          this.rafId = env.requestAnimationFrame(loop);
        }
      };
      this.rafId = env.requestAnimationFrame(loop);
    }

    // Initialize PerformanceObserver if supported
    const ObsClass =
      env.PerformanceObserver ||
      (typeof PerformanceObserver !== "undefined" ? PerformanceObserver : null);
    if (ObsClass) {
      try {
        this.observer = new ObsClass((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "layout-shift") {
              const shift = entry as unknown as {
                hadRecentInput?: boolean;
                value?: number;
              };
              if (!shift.hadRecentInput && typeof shift.value === "number") {
                this.clsScore += shift.value;
              }
            } else if (entry.entryType === "longtask") {
              this.longTasks.push({
                durationMs: Math.round(entry.duration),
                startTime: Math.round(entry.startTime),
                name: entry.name,
              });
              if (this.longTasks.length > 50) {
                this.longTasks.shift();
              }
            }
          }
        });

        // Observe supported types
        const supported =
          typeof ObsClass.supportedEntryTypes !== "undefined"
            ? ObsClass.supportedEntryTypes
            : ["layout-shift", "longtask"];

        const typesToObserve = ["layout-shift", "longtask"].filter((t) =>
          supported.includes(t),
        );
        if (typesToObserve.length > 0) {
          this.observer.observe({ entryTypes: typesToObserve });
        }
      } catch {
        // Fallback gracefully if observer entryTypes aren't supported
      }
    }
  }

  public recordLayoutShift(value: number, hadRecentInput = false): void {
    if (!hadRecentInput) {
      this.clsScore += value;
    }
  }

  public recordLongTask(durationMs: number, name = "self"): void {
    this.longTasks.push({
      durationMs,
      startTime: Date.now(),
      name,
    });
    if (this.longTasks.length > 50) {
      this.longTasks.shift();
    }
  }

  public setSimulatedFps(fps: number): void {
    this.currentFps = Math.max(0, Math.min(120, fps));
  }

  public getSnapshot(): PerformanceSnapshot {
    return {
      fps: this.currentFps,
      clsScore: Math.round(this.clsScore * 1000) / 1000,
      longTasksCount: this.longTasks.length,
      recentLongTasks: [...this.longTasks.slice(-10)],
      timestamp: Date.now(),
    };
  }

  public stop(
    env: PerformanceEnvironment = typeof window !== "undefined" ? window : {},
  ): void {
    this.active = false;
    if (this.rafId !== null && typeof env.cancelAnimationFrame === "function") {
      env.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
