export class TerminalHistogramRenderer {
  public renderHistogram(
    buckets: Array<{ label: string; count: number }>,
    maxBarWidth = 30,
  ): string {
    if (buckets.length === 0) return "  [No latency metrics]";

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    const lines = buckets.map((b) => {
      const barLength = Math.round((b.count / maxCount) * maxBarWidth);
      const bar = "█".repeat(barLength).padEnd(maxBarWidth, " ");
      return `  ${b.label.padEnd(10, " ")} | ${bar} (${b.count})`;
    });

    return lines.join("\n");
  }
}

export const terminalHistogramRenderer = new TerminalHistogramRenderer();
