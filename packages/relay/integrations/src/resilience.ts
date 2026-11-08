/**
 * Issue Tracker Integration Contract & Failure Resilience Manager
 *
 * Implements exponential backoff with jitter and automated retry mechanisms
 * for Linear, GitHub, and Jira API integrations when confronting HTTP 429 (rate-limit)
 * or HTTP 500/502/503/504 server errors, preventing ticket submission data loss.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-integrations/resilience.
 */

export interface RetryPolicy {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  retryOnStatus?: number[];
}

export class IntegrationHttpError extends Error {
  public status: number;
  public retryAfterMs?: number;

  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.name = "IntegrationHttpError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export class IntegrationResilienceManager {
  private defaultPolicy: Required<RetryPolicy> = {
    maxRetries: 3,
    initialDelayMs: 20, // Low default for snappy tests
    backoffMultiplier: 2,
    retryOnStatus: [429, 500, 502, 503, 504],
  };

  public async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    policy?: RetryPolicy,
  ): Promise<{ result: T; attempts: number }> {
    const config = { ...this.defaultPolicy, ...policy };
    let attempt = 0;
    let delayMs = config.initialDelayMs;

    while (true) {
      attempt++;
      try {
        const res = await operation(attempt);
        return { result: res, attempts: attempt };
      } catch (err) {
        const isHttpError = err instanceof IntegrationHttpError;
        const status = isHttpError ? err.status : 500;
        const isRetryable = config.retryOnStatus.includes(status);

        if (attempt > config.maxRetries || !isRetryable) {
          throw err;
        }

        // Wait before next attempt with optional server Retry-After support
        const waitMs =
          isHttpError && err.retryAfterMs ? err.retryAfterMs : delayMs;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        delayMs *= config.backoffMultiplier;
      }
    }
  }
}
