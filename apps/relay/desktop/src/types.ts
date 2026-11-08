/**
 * @paddy-systems/relay-desktop
 * Types for Native Desktop Receiver Shell and Multi-Window Matrix.
 */

export interface DeviceViewportSpec {
  id: string;
  name: string;
  category: "mobile" | "tablet" | "desktop";
  width: number;
  height: number;
  devicePixelRatio: number;
  userAgent: string;
  hasTouch: boolean;
}

export interface DiscoveredGatewayBeacon {
  host: string;
  port: number;
  sessionId: string;
  devServerUrl: string;
  shortCode: string;
  discoveredAt: number;
}

export interface WindowLayoutState {
  windowId: string;
  type: "main" | "devtools" | "device-frame";
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
  isDetached: boolean;
  focused: boolean;
}

export interface KeyboardShortcutBinding {
  key: string;
  modifiers: Array<"Command" | "Control" | "Alt" | "Shift">;
  action: string;
  description: string;
}

export interface TraySessionStatus {
  activeSessionsCount: number;
  connectedReceiversCount: number;
  latencyMs: number;
  health: "healthy" | "degraded" | "disconnected";
}
