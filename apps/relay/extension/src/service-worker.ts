export class ServiceWorkerKeepaliveManager {
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private isAlive = false;

  public start(): void {
    this.isAlive = true;
    if (this.keepaliveTimer) return;

    // Ping every 25 seconds to stay awake under MV3 service worker policies
    this.keepaliveTimer = setInterval(() => {
      this.ping();
    }, 25000);
  }

  public stop(): void {
    this.isAlive = false;
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  public ping(): { status: "alive"; timestamp: number } {
    return {
      status: "alive",
      timestamp: Date.now(),
    };
  }

  public getIsAlive(): boolean {
    return this.isAlive;
  }
}
