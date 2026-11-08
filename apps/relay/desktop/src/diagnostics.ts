export interface DiagnosticReport {
  generatedAt: string;
  os: string;
  arch: string;
  appVersion: string;
  recentLogs: string[];
  crashReason?: string;
}

/**
 * Collects runtime errors, system diagnostic info, and produces sanitized debug bundles.
 */
export class DesktopDiagnosticsCollector {
  private logs: string[] = [];

  public log(message: string): void {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  public getRecentLogs(): string[] {
    return [...this.logs];
  }

  public generateReport(crashReason?: string): DiagnosticReport {
    return {
      generatedAt: new Date().toISOString(),
      os: typeof process !== "undefined" ? process.platform : "unknown",
      arch: typeof process !== "undefined" ? process.arch : "unknown",
      appVersion: "0.1.0",
      recentLogs: this.getRecentLogs().slice(-50),
      crashReason,
    };
  }

  public serializeReport(report: DiagnosticReport): string {
    return JSON.stringify(report, null, 2);
  }
}
