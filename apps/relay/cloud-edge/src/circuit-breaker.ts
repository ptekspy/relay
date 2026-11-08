/**
 * Edge Health Probes & Circuit Breaker Engine
 *
 * Monitors host CLI gateway connection responsiveness and prevents cascading
 * gateway timeouts (60s) by tripping into fail-fast 502 Bad Gateway responses.
 *
 * Note for Octavia: This circuit breaker safeguards edge worker threads from hung connections.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  probeTimeoutMs?: number;
}

export interface CircuitStatus {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalTrips: number;
}

export interface FastFailureResponse {
  statusCode: 502;
  errorCode: "ERR_HOST_DEV_SERVER_UNRESPONSIVE";
  retryAfterSeconds: number;
  message: string;
  html: string;
}

export class TunnelCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalTrips = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly probeTimeoutMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 5000;
    this.probeTimeoutMs = options.probeTimeoutMs ?? 1000;
  }

  public getStatus(): CircuitStatus {
    this.checkHalfOpenTransition();
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalTrips: this.totalTrips,
    };
  }

  public isAvailable(): boolean {
    this.checkHalfOpenTransition();
    return this.state !== "OPEN";
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
    }
  }

  public recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (
      this.state === "CLOSED" &&
      this.consecutiveFailures >= this.failureThreshold
    ) {
      this.state = "OPEN";
      this.totalTrips++;
    } else if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.totalTrips++;
    }
  }

  public trip(): void {
    this.state = "OPEN";
    this.lastFailureTime = Date.now();
    this.totalTrips++;
  }

  public reset(): void {
    this.state = "CLOSED";
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
  }

  public generateFastFailure(sessionId = "default"): FastFailureResponse {
    const retryAfter = Math.ceil(this.resetTimeoutMs / 1000);
    return {
      statusCode: 502,
      errorCode: "ERR_HOST_DEV_SERVER_UNRESPONSIVE",
      retryAfterSeconds: retryAfter,
      message: `Host dev server for session "${sessionId}" is unresponsive. Check that your local dev server and Relay CLI are active.`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>502 — Host Dev Server Unresponsive</title>
  <style>
    body { font-family: monospace; background: #0c0a09; color: #f5f5f4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .box { background: #1c1917; border: 1px solid #44403c; border-radius: 8px; padding: 24px; max-width: 500px; }
    h1 { color: #f87171; font-size: 18px; margin: 0 0 12px 0; }
    p { font-size: 14px; color: #a8a29e; line-height: 1.5; }
    code { background: #292524; color: #fbbf24; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>502 Bad Gateway: Host Unresponsive</h1>
    <p>The Relay edge tunnel could not reach your local machine's dev server for session <code>${sessionId}</code>.</p>
    <p>Please check that your application (e.g. <code>npm run dev</code>) is running and reachable by Relay CLI.</p>
  </div>
</body>
</html>`,
    };
  }

  private checkHalfOpenTransition(): void {
    if (this.state === "OPEN" && this.lastFailureTime !== null) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
      }
    }
  }
}
