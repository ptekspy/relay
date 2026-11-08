import type { DeviceTableRow } from "./types.js";

/**
 * Formats responsive terminal tables with status badges, latency indicators, and mini sparklines.
 */
export class TerminalDeviceTable {
  public renderTable(rows: DeviceTableRow[]): string {
    if (rows.length === 0) {
      return "  No devices connected. Scan QR code or enter code to pair.";
    }

    const header =
      "  DEVICE                  PLATFORM   STATUS         LATENCY   BATTERY   FPS ";
    const divider =
      "  -------------------------------------------------------------------------";

    const lines = rows.map((r) => {
      const namePadded = r.name.padEnd(23, " ").slice(0, 23);
      const platPadded = r.platform.toUpperCase().padEnd(10, " ");
      const statusStr =
        r.status === "connected" ? "● Connected " : "○ Idle      ";
      const latencyStr = `${r.latencyMs}ms`.padStart(6, " ");
      const batteryStr =
        r.batteryPercent !== undefined
          ? `${r.batteryPercent}%`.padStart(7, " ")
          : "   --  ";
      const fpsStr =
        r.fps !== undefined ? `${r.fps}`.padStart(5, " ") : "  -- ";

      return `  ${namePadded} ${platPadded} ${statusStr} ${latencyStr}  ${batteryStr}  ${fpsStr}`;
    });

    return [header, divider, ...lines].join("\n");
  }

  public renderSparkline(values: number[]): string {
    const ticks = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
    if (values.length === 0) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((v) => {
        const idx = Math.min(
          ticks.length - 1,
          Math.floor(((v - min) / range) * (ticks.length - 1)),
        );
        return ticks[idx];
      })
      .join("");
  }
}

export const terminalDeviceTable = new TerminalDeviceTable();
