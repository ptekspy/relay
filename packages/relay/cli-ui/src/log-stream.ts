import type { TerminalLogEntry } from "./types.js";

export class TerminalLogStream {
  private logs: TerminalLogEntry[] = [];
  private maxCapacity = 200;

  constructor(maxCapacity = 200) {
    this.maxCapacity = maxCapacity;
  }

  public append(log: TerminalLogEntry): void {
    this.logs.push(log);
    if (this.logs.length > this.maxCapacity) {
      this.logs.shift();
    }
  }

  public renderWindow(
    maxLines = 10,
    filterLevel?: TerminalLogEntry["level"],
  ): string {
    const filtered = filterLevel
      ? this.logs.filter((l) => l.level === filterLevel)
      : this.logs;

    const slice = filtered.slice(-maxLines);
    if (slice.length === 0) {
      return "  [No recent logs]";
    }

    return slice
      .map((l) => {
        const time = new Date(l.timestamp).toISOString().slice(11, 19);
        const levelBadge = `[${l.level.toUpperCase()}]`.padEnd(7, " ");
        return `  ${time} ${levelBadge} [${l.tag}] ${l.message}`;
      })
      .join("\n");
  }

  public getCount(): number {
    return this.logs.length;
  }
}
