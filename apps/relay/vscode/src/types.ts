/**
 * @paddy-systems/relay-vscode
 * Types for VS Code & Cursor Extension.
 */

export interface ConnectedReceiverItem {
  id: string;
  name: string;
  category: "mobile" | "tablet" | "desktop";
  ipAddress: string;
  latencyMs: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface ActiveSessionDetails {
  sessionId: string;
  localPort: number;
  shortCode: string;
  receivers: ConnectedReceiverItem[];
  startedAt: number;
}

export interface SourceLocationMapping {
  originalFile: string;
  lineNumber: number;
  columnNumber: number;
}

export interface RelayExtensionConfig {
  defaultPort: number;
  autoLaunchOnPortDetect: boolean;
  showStatusBarPill: boolean;
  redactAuthHeaders: boolean;
}
