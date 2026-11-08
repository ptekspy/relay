import { describe, expect, it } from "bun:test";
import {
  MemoryMonitor,
  type PerformanceWithMemory,
} from "../src/memory-monitor.js";

describe("TASK-147: Memory Heap Allocation & Leak Indicator", () => {
  it("records memory samples from performance.memory API", () => {
    const monitor = new MemoryMonitor();
    const mockPerf: PerformanceWithMemory = {
      memory: {
        usedJSHeapSize: 25 * 1024 * 1024,
        totalJSHeapSize: 40 * 1024 * 1024,
        jsHeapSizeLimit: 128 * 1024 * 1024,
      },
    };

    const sample = monitor.recordSample(mockPerf);

    expect(sample).not.toBeNull();
    expect(sample?.usedJsHeapSize).toBe(25 * 1024 * 1024);
    expect(sample?.totalJsHeapSize).toBe(40 * 1024 * 1024);
    expect(sample?.jsHeapSizeLimit).toBe(128 * 1024 * 1024);
  });

  it("detects monotonic memory growth and raises leak warning", () => {
    const monitor = new MemoryMonitor();
    const baseTime = Date.now();

    // Add 5 samples with continuous 2MB jumps every 30s
    for (let i = 0; i < 5; i++) {
      monitor.addSample({
        usedJsHeapSize: (20 + i * 2) * 1024 * 1024,
        totalJsHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 128 * 1024 * 1024,
        timestamp: baseTime + i * 30000,
      });
    }

    const warning = monitor.checkLeakRisk(4);
    expect(warning).not.toBeNull();
    expect(warning?.isLeaking).toBe(true);
    expect(warning?.message).toContain("Potential memory leak");
  });

  it("does not report leak warning when memory is fluctuating normally", () => {
    const monitor = new MemoryMonitor();
    const baseTime = Date.now();

    // Normal garbage collection fluctuation
    const sizes = [20, 24, 21, 25, 22];
    for (let i = 0; i < sizes.length; i++) {
      monitor.addSample({
        usedJsHeapSize: (sizes[i] || 20) * 1024 * 1024,
        totalJsHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 128 * 1024 * 1024,
        timestamp: baseTime + i * 30000,
      });
    }

    const warning = monitor.checkLeakRisk(4);
    expect(warning).toBeNull();
  });
});
