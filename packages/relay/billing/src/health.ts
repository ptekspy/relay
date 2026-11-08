export interface HealthCheckResult {
  status: "UP" | "DOWN";
  version: string;
  uptimeSeconds: number;
  checks: {
    memory: "PASS" | "WARN" | "FAIL";
    database: "PASS" | "FAIL";
    redis: "PASS" | "FAIL";
  };
}

export class EdgeHealthService {
  private readonly startTime = Date.now();
  private dbConnected = true;
  private redisConnected = true;

  public setDbStatus(connected: boolean): void {
    this.dbConnected = connected;
  }

  public setRedisStatus(connected: boolean): void {
    this.redisConnected = connected;
  }

  public checkLiveness(): boolean {
    // Process is alive and answering HTTP requests
    return true;
  }

  public checkReadiness(): HealthCheckResult {
    const memUsage = process.memoryUsage();
    const heapUsedMb = memUsage.heapUsed / 1024 / 1024;
    const memoryStatus: "PASS" | "WARN" | "FAIL" =
      heapUsedMb > 1024 ? "FAIL" : heapUsedMb > 512 ? "WARN" : "PASS";

    const isHealthy =
      this.dbConnected && this.redisConnected && memoryStatus !== "FAIL";

    return {
      status: isHealthy ? "UP" : "DOWN",
      version: "1.0.0",
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        memory: memoryStatus,
        database: this.dbConnected ? "PASS" : "FAIL",
        redis: this.redisConnected ? "PASS" : "FAIL",
      },
    };
  }
}
