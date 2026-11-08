/**
 * @paddy-systems/relay-cli-ui
 * Types for reusable Terminal UI component library.
 */

export interface TerminalDimensions {
  columns: number;
  rows: number;
}

export interface DeviceTableRow {
  id: string;
  name: string;
  platform: "ios" | "android" | "web" | "desktop";
  status: "connected" | "reconnecting" | "idle";
  latencyMs: number;
  batteryPercent?: number;
  fps?: number;
}

export interface TerminalLogEntry {
  id: string;
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  tag: string;
  message: string;
}

export type AnsiColorDepth =
  | "truecolor"
  | "256color"
  | "16color"
  | "monochrome";

export interface TuiCommandAction {
  key: string;
  label: string;
  action: () => void;
}
