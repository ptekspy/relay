import { describe, expect, it } from "bun:test";
import { PerformanceProfiler } from "../src/performance-profiler.js";

describe("TASK-146: Real-Time Performance Profiler (FPS, Long Tasks, Layout Shifts)", () => {
  it("tracks frame rates and reports live FPS snapshots", () => {
    const profiler = new PerformanceProfiler();
    profiler.setSimulatedFps(58);

    const snapshot = profiler.getSnapshot();
    expect(snapshot.fps).toBe(58);
    expect(snapshot.clsScore).toBe(0);
    expect(snapshot.longTasksCount).toBe(0);
  });

  it("accumulates CLS layout shifts and records long tasks", () => {
    const profiler = new PerformanceProfiler();

    // Layout shift without user input adds to score
    profiler.recordLayoutShift(0.045, false);
    profiler.recordLayoutShift(0.02, false);

    // Layout shift with user input is ignored
    profiler.recordLayoutShift(0.15, true);

    // Record long tasks
    profiler.recordLongTask(65, "Heavy React render");
    profiler.recordLongTask(120, "JSON parse burst");

    const snapshot = profiler.getSnapshot();
    expect(snapshot.clsScore).toBe(0.065);
    expect(snapshot.longTasksCount).toBe(2);
    expect(snapshot.recentLongTasks[0]?.durationMs).toBe(65);
    expect(snapshot.recentLongTasks[1]?.name).toBe("JSON parse burst");
  });

  it("starts and stops cleanly without leaking timers", () => {
    const canceledIds: number[] = [];
    const profiler = new PerformanceProfiler();

    profiler.start({
      requestAnimationFrame: () => 101,
      cancelAnimationFrame: (id: number) => {
        canceledIds.push(id);
      },
    });

    profiler.stop({
      cancelAnimationFrame: (id: number) => {
        canceledIds.push(id);
      },
    });

    expect(canceledIds).toEqual([101]);
  });
});
