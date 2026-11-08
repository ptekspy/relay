/**
 * @paddy-systems/relay-extension
 * Types for Browser Extension and Chrome DevTools Panel Integration.
 */

export interface ExtensionSessionState {
  isDevServerDetected: boolean;
  activePort?: number;
  sessionId?: string;
  shortCode?: string;
  connectedReceiversCount: number;
  qrDataUrl?: string;
}

export interface DevToolsPanelMessage {
  type: "inspect_element" | "eval_script" | "sync_cookies" | "reload_device";
  payload: Record<string, unknown>;
}

export interface UserAgentOverrideRule {
  id: number;
  name: string;
  userAgent: string;
  platform: string;
  enabled: boolean;
}

export interface StorageItemSnapshot {
  key: string;
  value: string;
  area: "localStorage" | "sessionStorage" | "cookie";
}
