import type {
  ConsoleEvent,
  ConsoleLogLevel,
} from "@paddy-systems/relay-protocol";
import { safeSerialize } from "./redaction.js";

export type ConsoleCallback = (event: ConsoleEvent) => void;

export class ConsoleInterceptor {
  private originalMethods: Partial<
    Record<ConsoleLogLevel, (...args: unknown[]) => void>
  > = {};
  private active = false;

  constructor(private readonly onLog: ConsoleCallback) {}

  public install(): void {
    if (this.active || typeof console === "undefined") return;

    const levels: ConsoleLogLevel[] = ["log", "info", "warn", "error", "debug"];

    for (const level of levels) {
      const orig = console[level];
      if (typeof orig === "function") {
        this.originalMethods[level] = orig.bind(console);
        console[level] = (...args: unknown[]) => {
          try {
            const serializedArgs = args.map((arg) => safeSerialize(arg));
            this.onLog({
              kind: "console",
              level,
              args: serializedArgs,
              timestamp: Date.now(),
            });
          } catch {
            // Never break original application logging
          }
          this.originalMethods[level]?.(...args);
        };
      }
    }

    this.active = true;
  }

  public uninstall(): void {
    if (!this.active || typeof console === "undefined") return;

    for (const [level, orig] of Object.entries(this.originalMethods) as Array<
      [ConsoleLogLevel, (...args: unknown[]) => void]
    >) {
      if (orig) {
        console[level] = orig;
      }
    }

    this.originalMethods = {};
    this.active = false;
  }
}
