/**
 * @paddy-systems/relay-python
 * Type definitions for Python & Django SDK integration.
 */

export interface PythonTelemetryPayload {
  framework: "django" | "fastapi" | "flask";
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  queriesCount?: number;
  dbDurationMs?: number;
}

export interface SqlQueryTelemetry {
  query: string;
  durationMs: number;
  engine: "sqlite" | "postgres" | "mysql";
  timestamp: number;
}

export interface CeleryTaskTrace {
  taskId: string;
  taskName: string;
  status: "PENDING" | "STARTED" | "SUCCESS" | "FAILURE";
  durationMs?: number;
  args?: unknown[];
  error?: string;
}
