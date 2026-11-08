import type { TerminalDimensions } from "./types.js";

export class TerminalLayoutEngine {
  public calculateLayout(dim: TerminalDimensions): {
    mode: "compact" | "standard" | "widescreen";
    qrWidth: number;
    logLines: number;
    showDeviceTable: boolean;
  } {
    const { columns, rows } = dim;

    if (columns < 80 || rows < 20) {
      return {
        mode: "compact",
        qrWidth: Math.min(20, columns - 10),
        logLines: Math.max(3, rows - 15),
        showDeviceTable: false,
      };
    }

    if (columns >= 120 && rows >= 30) {
      return {
        mode: "widescreen",
        qrWidth: 28,
        logLines: rows - 16,
        showDeviceTable: true,
      };
    }

    return {
      mode: "standard",
      qrWidth: 24,
      logLines: rows - 14,
      showDeviceTable: true,
    };
  }
}

export const terminalLayoutEngine = new TerminalLayoutEngine();
