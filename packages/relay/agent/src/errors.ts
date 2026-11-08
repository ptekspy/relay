import type { ConsoleEvent } from "@paddy-systems/relay-protocol";
import { safeSerialize } from "./redaction.js";

export type ErrorCallback = (event: ConsoleEvent) => void;

export class ErrorInterceptor {
  private active = false;
  private onErrorHandler: ((event: ErrorEvent) => void) | null = null;
  private onRejectionHandler: ((event: PromiseRejectionEvent) => void) | null =
    null;

  constructor(private readonly onError: ErrorCallback) {}

  public install(): void {
    if (this.active || typeof window === "undefined") return;

    this.onErrorHandler = (event: ErrorEvent) => {
      try {
        const errorMsg = event.error
          ? safeSerialize(event.error)
          : event.message;
        const sourceLoc = event.filename
          ? ` at ${event.filename}:${event.lineno}:${event.colno}`
          : "";
        this.onError({
          kind: "console",
          level: "error",
          args: [`Uncaught ${errorMsg}${sourceLoc}`],
          timestamp: Date.now(),
        });
      } catch {
        // Safe failover
      }
    };

    this.onRejectionHandler = (event: PromiseRejectionEvent) => {
      try {
        const reason = safeSerialize(event.reason);
        this.onError({
          kind: "console",
          level: "error",
          args: [`Unhandled Promise Rejection: ${reason}`],
          timestamp: Date.now(),
        });
      } catch {
        // Safe failover
      }
    };

    window.addEventListener("error", this.onErrorHandler);
    window.addEventListener("unhandledrejection", this.onRejectionHandler);
    this.active = true;
  }

  public uninstall(): void {
    if (!this.active || typeof window === "undefined") return;

    if (this.onErrorHandler) {
      window.removeEventListener("error", this.onErrorHandler);
      this.onErrorHandler = null;
    }

    if (this.onRejectionHandler) {
      window.removeEventListener("unhandledrejection", this.onRejectionHandler);
      this.onRejectionHandler = null;
    }

    this.active = false;
  }
}
