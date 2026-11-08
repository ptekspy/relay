export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  correlationId: string;
  message: string;
  context?: Record<string, unknown>;
}

export class StructuredLogger {
  private readonly correlationId: string;

  constructor(correlationId = "corr_default") {
    this.correlationId = correlationId;
  }

  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): LogEntry {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      message,
      context: sanitizedContext,
    };
    return entry;
  }

  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (
        lower.includes("password") ||
        lower.includes("secret") ||
        lower.includes("token") ||
        lower.includes("auth") ||
        lower.includes("cookie")
      ) {
        clean[key] = "[REDACTED]";
      } else if (
        typeof val === "object" &&
        val !== null &&
        !Array.isArray(val)
      ) {
        clean[key] = this.sanitize(val as Record<string, unknown>);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }
}
