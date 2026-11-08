/**
 * @paddy-systems/relay-extension
 * Browser Extension & DevTools Panel Controller.
 */

export * from "./compat.js";
export * from "./content-script.js";
export * from "./csp-bypass.js";
export * from "./devtools-panel.js";
export * from "./popup.js";
export * from "./service-worker.js";
export * from "./storage-sync.js";
export * from "./types.js";
export * from "./ua-override.js";

import { ContentScriptInjector } from "./content-script.js";
import { CspDevBypassEngine } from "./csp-bypass.js";
import { DevToolsPanelBridge } from "./devtools-panel.js";
import { ExtensionPopupController } from "./popup.js";
import { ServiceWorkerKeepaliveManager } from "./service-worker.js";
import { StorageSyncBridge } from "./storage-sync.js";
import { UserAgentOverrideManager } from "./ua-override.js";

export class ExtensionCoordinator {
  public devtools = new DevToolsPanelBridge();
  public injector = new ContentScriptInjector();
  public popup = new ExtensionPopupController();
  public storage = new StorageSyncBridge();
  public ua = new UserAgentOverrideManager();
  public csp = new CspDevBypassEngine();
  public worker = new ServiceWorkerKeepaliveManager();

  public initialize(): void {
    this.worker.start();
  }

  public shutdown(): void {
    this.worker.stop();
  }
}
