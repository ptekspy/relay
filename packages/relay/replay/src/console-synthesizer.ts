import type {
  ConsoleEvent,
  ConsoleLogLevel,
} from "@paddy-systems/relay-protocol";
import type { ConsoleReplayItem } from "./types.js";

/**
 * Synthesizes console log streams with severity filtering and stack demangling.
 */
export class ConsoleSynthesizer {
  private logs: ConsoleReplayItem[] = [];

  public ingest(events: ConsoleEvent[]): void {
    for (const evt of events) {
      const id = `console-${evt.timestamp}-${Math.random().toString(36).slice(2, 7)}`;
      let stackTrace: string | undefined;

      // Extract error stack trace if embedded in args
      for (const arg of evt.args) {
        if (
          typeof arg === "string" &&
          arg.includes("Error:") &&
          arg.includes("at ")
        ) {
          stackTrace = arg;
          break;
        }
      }

      this.logs.push({
        id,
        timestamp: evt.timestamp,
        level: evt.level,
        args: evt.args,
        stackTrace,
        demangledStack: stackTrace ? this.demangleStack(stackTrace) : undefined,
      });
    }

    this.logs.sort((a, b) => a.timestamp - b.timestamp);
  }

  public getLogsUpTo(
    currentTime: number,
    allowedLevels?: ConsoleLogLevel[],
  ): ConsoleReplayItem[] {
    return this.logs.filter((log) => {
      if (log.timestamp > currentTime) return false;
      if (
        allowedLevels &&
        allowedLevels.length > 0 &&
        !allowedLevels.includes(log.level)
      ) {
        return false;
      }
      return true;
    });
  }

  private demangleStack(rawStack: string): string {
    // Normalizes bundle hash patterns (e.g. app-89a3f.js:14:22 -> app.ts:14:22)
    return rawStack.replace(/-[a-f0-9]{5,}\.js/g, ".ts");
  }
}
