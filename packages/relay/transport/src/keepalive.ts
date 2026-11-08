export interface ReconnectionConfig {
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitterRatio?: number;
  maxAttempts?: number;
}

export class ReconnectionBackoff {
  private attempt = 0;
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly factor: number;
  private readonly jitterRatio: number;
  private readonly maxAttempts: number;

  constructor(config: ReconnectionConfig = {}) {
    this.initialDelay = config.initialDelayMs ?? 1000;
    this.maxDelay = config.maxDelayMs ?? 30000;
    this.factor = config.factor ?? 2;
    this.jitterRatio = config.jitterRatio ?? 0.2;
    this.maxAttempts = config.maxAttempts ?? 10;
  }

  public get currentAttempt(): number {
    return this.attempt;
  }

  public nextDelayMs(): number | null {
    if (this.attempt >= this.maxAttempts) {
      return null; // Exceeded maximum reconnection attempts
    }

    const baseDelay = Math.min(
      this.initialDelay * this.factor ** this.attempt,
      this.maxDelay,
    );
    this.attempt++;

    // Add jitter
    const jitter = baseDelay * this.jitterRatio * (Math.random() * 2 - 1);
    return Math.max(100, Math.round(baseDelay + jitter));
  }

  public reset(): void {
    this.attempt = 0;
  }
}
