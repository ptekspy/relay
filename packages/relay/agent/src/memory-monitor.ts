/**
 * Memory Heap Allocation & Leak Indicator
 *
 * Samples performance.memory metrics (Chrome/Android WebView), tracks JS heap
 * allocation trends over time, and computes memory leak warning heuristics.
 *
 * Note for Octavia: Used by the Memory inspector graph in Cloud Web DevTools.
 */

export interface MemorySample {
  usedJsHeapSize: number;
  totalJsHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemoryLeakWarning {
  isLeaking: boolean;
  growthRateBytesPerMin: number;
  message: string;
}

export interface MemoryReport {
  supported: boolean;
  current: MemorySample | null;
  samples: MemorySample[];
  leakWarning?: MemoryLeakWarning;
}

export interface PerformanceWithMemory {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export class MemoryMonitor {
  private samples: MemorySample[] = [];
  private readonly maxSamples: number;

  constructor(maxSamples = 120) {
    this.maxSamples = maxSamples;
  }

  public recordSample(
    perf: PerformanceWithMemory = typeof performance !== "undefined"
      ? (performance as PerformanceWithMemory)
      : {},
  ): MemorySample | null {
    if (!perf.memory) {
      return null;
    }

    const sample: MemorySample = {
      usedJsHeapSize: perf.memory.usedJSHeapSize,
      totalJsHeapSize: perf.memory.totalJSHeapSize,
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    };

    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    return sample;
  }

  public addSample(sample: MemorySample): void {
    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  public getSamples(): MemorySample[] {
    return [...this.samples];
  }

  public checkLeakRisk(consecutiveThreshold = 4): MemoryLeakWarning | null {
    if (this.samples.length < consecutiveThreshold) {
      return null;
    }

    const recent = this.samples.slice(-consecutiveThreshold);
    let monotonicIncreases = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      if (prev && curr && curr.usedJsHeapSize > prev.usedJsHeapSize) {
        monotonicIncreases++;
      }
    }

    const isMonotonic = monotonicIncreases === consecutiveThreshold - 1;
    if (!isMonotonic) {
      return null;
    }

    const first = recent[0];
    const last = recent[recent.length - 1];
    if (!first || !last) {
      return null;
    }

    const durationMinutes = Math.max(
      0.1,
      (last.timestamp - first.timestamp) / 60000,
    );
    const growthBytes = last.usedJsHeapSize - first.usedJsHeapSize;
    const growthRateBytesPerMin = Math.round(growthBytes / durationMinutes);

    // Only flag as potential leak if growing at > 500KB per minute
    if (growthRateBytesPerMin < 500 * 1024) {
      return null;
    }

    const growthMb = (growthRateBytesPerMin / (1024 * 1024)).toFixed(2);
    return {
      isLeaking: true,
      growthRateBytesPerMin,
      message: `Potential memory leak: JS heap usage grew monotonically over ${recent.length} samples (~${growthMb} MB/min).`,
    };
  }

  public getReport(
    perf: PerformanceWithMemory = typeof performance !== "undefined"
      ? (performance as PerformanceWithMemory)
      : {},
  ): MemoryReport {
    const supported = Boolean(perf.memory);
    const current =
      this.samples.length > 0
        ? (this.samples[this.samples.length - 1] ?? null)
        : null;
    const leakWarning = this.checkLeakRisk() ?? undefined;

    return {
      supported,
      current,
      samples: this.getSamples(),
      leakWarning,
    };
  }
}
