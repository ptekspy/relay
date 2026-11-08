/**
 * Matrix Testing Runner across Connected Android, iOS & Browser Receivers
 *
 * Broadcasts test executions across all connected mobile and browser receivers
 * in parallel and aggregates test results into a unified summary table.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/matrix-runner.
 */

export interface MatrixDeviceTarget {
  id: string;
  name: string;
  platform: "android" | "ios" | "browser";
  osVersion?: string;
}

export interface MatrixDeviceExecutionResult {
  deviceId: string;
  deviceName: string;
  platform: "android" | "ios" | "browser";
  passed: boolean;
  durationMs: number;
  error?: string;
  logs?: string[];
}

export interface MatrixSummary {
  total: number;
  passed: number;
  failed: number;
  totalDurationMs: number;
  results: MatrixDeviceExecutionResult[];
}

export class MatrixTestRunner {
  public concurrency = 5;

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
  }

  public async runMatrix(
    devices: MatrixDeviceTarget[],
    executor: (device: MatrixDeviceTarget) => Promise<{
      passed: boolean;
      error?: string;
      logs?: string[];
    }>,
  ): Promise<MatrixSummary> {
    const startTime = Date.now();

    const results: MatrixDeviceExecutionResult[] = await Promise.all(
      devices.map(async (dev) => {
        const itemStart = Date.now();
        try {
          const res = await executor(dev);
          return {
            deviceId: dev.id,
            deviceName: dev.name,
            platform: dev.platform,
            passed: res.passed,
            durationMs: Date.now() - itemStart,
            error: res.error,
            logs: res.logs,
          };
        } catch (err) {
          return {
            deviceId: dev.id,
            deviceName: dev.name,
            platform: dev.platform,
            passed: false,
            durationMs: Date.now() - itemStart,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      total: devices.length,
      passed: passedCount,
      failed: failedCount,
      totalDurationMs: Date.now() - startTime,
      results,
    };
  }

  public renderSummaryTable(summary: MatrixSummary): string {
    const lines: string[] = [
      "┌──────────────────────────────┬────────────┬──────────┬──────────────┐",
      "│ Device Target                │ Platform   │ Status   │ Duration     │",
      "├──────────────────────────────┼────────────┼──────────┼──────────────┤",
    ];

    for (const r of summary.results) {
      const name = r.deviceName.padEnd(28).slice(0, 28);
      const plat = r.platform.padEnd(10).slice(0, 10);
      const status = (r.passed ? "✓ PASS" : "✗ FAIL").padEnd(8);
      const dur = `${r.durationMs}ms`.padStart(12);
      lines.push(`│ ${name} │ ${plat} │ ${status} │ ${dur} │`);
    }

    lines.push(
      "└──────────────────────────────┴────────────┴──────────┴──────────────┘",
      `Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed} | Execution Time: ${summary.totalDurationMs}ms`,
    );

    return lines.join("\n");
  }
}
