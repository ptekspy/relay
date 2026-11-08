import type { TraySessionStatus } from "./types.js";

/**
 * Manages OS system tray icon status, badge text, and tooltips.
 */
export class TrayStatusManager {
  private status: TraySessionStatus = {
    activeSessionsCount: 0,
    connectedReceiversCount: 0,
    latencyMs: 0,
    health: "disconnected",
  };

  public updateStatus(status: Partial<TraySessionStatus>): void {
    Object.assign(this.status, status);
  }

  public getStatus(): TraySessionStatus {
    return { ...this.status };
  }

  public getTrayTooltip(): string {
    if (this.status.health === "disconnected") {
      return "Relay Desktop: Disconnected";
    }
    return `Relay Desktop: ${this.status.connectedReceiversCount} device(s) connected (${this.status.latencyMs}ms)`;
  }

  public getTrayBadge(): string {
    if (this.status.connectedReceiversCount > 0) {
      return `${this.status.connectedReceiversCount}`;
    }
    return "";
  }

  public getHealthIconColor(): "green" | "yellow" | "gray" {
    if (this.status.health === "healthy") return "green";
    if (this.status.health === "degraded") return "yellow";
    return "gray";
  }
}
