/**
 * @paddy-systems/relay-desktop
 * Native Desktop Receiver Shell & Multi-Window Matrix.
 */

export * from "./cert-manager.js";
export * from "./diagnostics.js";
export * from "./discovery.js";
export * from "./dpi-scaler.js";
export * from "./shortcuts.js";
export * from "./tray-manager.js";
export * from "./types.js";
export * from "./viewport-matrix.js";
export * from "./window-manager.js";

import { LocalCertificateTrustManager } from "./cert-manager.js";
import { DesktopDiagnosticsCollector } from "./diagnostics.js";
import { GatewayDiscoveryListener } from "./discovery.js";
import { DpiDisplayScaler } from "./dpi-scaler.js";
import { KeyboardShortcutManager } from "./shortcuts.js";
import { TrayStatusManager } from "./tray-manager.js";
import { ViewportMatrixManager } from "./viewport-matrix.js";
import { WindowLayoutManager } from "./window-manager.js";

/**
 * Cohesive controller for Desktop Application Shell.
 */
export class DesktopAppController {
  public viewports = new ViewportMatrixManager();
  public discovery = new GatewayDiscoveryListener();
  public windowManager = new WindowLayoutManager();
  public shortcuts = new KeyboardShortcutManager();
  public scaler = new DpiDisplayScaler();
  public tray = new TrayStatusManager();
  public certs = new LocalCertificateTrustManager();
  public diagnostics = new DesktopDiagnosticsCollector();

  constructor() {
    this.diagnostics.log("Relay Desktop Application Shell initialized");
  }

  public shutdown(): void {
    this.discovery.stopSweep();
    this.diagnostics.log("Relay Desktop Application Shell shutdown completed");
  }
}
