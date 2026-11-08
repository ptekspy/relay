/**
 * Performance Budget Assertion Engine (TTFB, LCP, CLS per Device)
 *
 * Evaluates real mobile telemetry against strict Core Web Vitals thresholds,
 * generating actionable diagnostic guidance and exit code indications for CI/CD.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/perf-budget.
 */

export interface DevicePerformanceMetrics {
  deviceId: string;
  deviceName: string;
  platform: "android" | "ios" | "browser";
  ttfbMs: number;
  fcpMs: number;
  lcpMs: number;
  cls: number;
  inpMs?: number;
}

export interface PerformanceBudgetThresholds {
  maxTtfbMs?: number; // e.g. 800ms
  maxFcpMs?: number; // e.g. 1800ms
  maxLcpMs?: number; // e.g. 2500ms
  maxCls?: number; // e.g. 0.1
  maxInpMs?: number; // e.g. 200ms
}

export interface BudgetViolation {
  metric: "TTFB" | "FCP" | "LCP" | "CLS" | "INP";
  actual: number;
  threshold: number;
  diagnosticAdvice: string;
}

export interface DeviceBudgetResult {
  deviceId: string;
  deviceName: string;
  platform: "android" | "ios" | "browser";
  passed: boolean;
  violations: BudgetViolation[];
}

export class PerformanceBudgetEngine {
  public defaultThresholds: Required<PerformanceBudgetThresholds> = {
    maxTtfbMs: 800,
    maxFcpMs: 1800,
    maxLcpMs: 2500,
    maxCls: 0.1,
    maxInpMs: 200,
  };

  public evaluateDevice(
    metrics: DevicePerformanceMetrics,
    thresholds?: PerformanceBudgetThresholds,
  ): DeviceBudgetResult {
    const limits = { ...this.defaultThresholds, ...thresholds };
    const violations: BudgetViolation[] = [];

    // TTFB Check
    if (metrics.ttfbMs > limits.maxTtfbMs) {
      violations.push({
        metric: "TTFB",
        actual: metrics.ttfbMs,
        threshold: limits.maxTtfbMs,
        diagnosticAdvice: `Server response took ${metrics.ttfbMs}ms (> ${limits.maxTtfbMs}ms). Check database queries, reverse proxy caches, or edge routing.`,
      });
    }

    // FCP Check
    if (metrics.fcpMs > limits.maxFcpMs) {
      violations.push({
        metric: "FCP",
        actual: metrics.fcpMs,
        threshold: limits.maxFcpMs,
        diagnosticAdvice: `First Contentful Paint was ${metrics.fcpMs}ms (> ${limits.maxFcpMs}ms). Minimize render-blocking CSS/JS and font loading delays.`,
      });
    }

    // LCP Check
    if (metrics.lcpMs > limits.maxLcpMs) {
      violations.push({
        metric: "LCP",
        actual: metrics.lcpMs,
        threshold: limits.maxLcpMs,
        diagnosticAdvice: `Largest Contentful Paint was ${metrics.lcpMs}ms (> ${limits.maxLcpMs}ms). Optimize hero images (WebP/AVIF), preload key assets, or eliminate client hydration bottlenecks.`,
      });
    }

    // CLS Check
    if (metrics.cls > limits.maxCls) {
      violations.push({
        metric: "CLS",
        actual: metrics.cls,
        threshold: limits.maxCls,
        diagnosticAdvice: `Cumulative Layout Shift was ${metrics.cls} (> ${limits.maxCls}). Specify explicit width/height on images and reserve space for dynamic ads/banners.`,
      });
    }

    // INP Check
    if (metrics.inpMs !== undefined && metrics.inpMs > limits.maxInpMs) {
      violations.push({
        metric: "INP",
        actual: metrics.inpMs,
        threshold: limits.maxInpMs,
        diagnosticAdvice: `Interaction to Next Paint was ${metrics.inpMs}ms (> ${limits.maxInpMs}ms). Break up long JavaScript main-thread tasks using scheduler.yield() or Web Workers.`,
      });
    }

    return {
      deviceId: metrics.deviceId,
      deviceName: metrics.deviceName,
      platform: metrics.platform,
      passed: violations.length === 0,
      violations,
    };
  }

  public evaluateFleet(
    fleet: DevicePerformanceMetrics[],
    thresholds?: PerformanceBudgetThresholds,
  ): {
    passed: boolean;
    results: DeviceBudgetResult[];
    summaryMessage: string;
  } {
    const results = fleet.map((d) => this.evaluateDevice(d, thresholds));
    const failedDevices = results.filter((r) => !r.passed);
    const passed = failedDevices.length === 0;

    let summaryMessage = "";
    if (passed) {
      summaryMessage = `✓ All ${fleet.length} connected devices satisfied Core Web Vitals performance budgets.`;
    } else {
      const summaryLines: string[] = [
        `✗ Performance budget breached on ${failedDevices.length} device(s):`,
      ];
      for (const dev of failedDevices) {
        summaryLines.push(`  - [${dev.deviceName}] (${dev.platform}):`);
        for (const v of dev.violations) {
          summaryLines.push(
            `      ${v.metric}: ${v.actual} (budget <= ${v.threshold}) - ${v.diagnosticAdvice}`,
          );
        }
      }
      summaryMessage = summaryLines.join("\n");
    }

    return { passed, results, summaryMessage };
  }
}
