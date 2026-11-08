import type { DevToolsPanelMessage } from "./types.js";

export class DevToolsPanelBridge {
  private isPanelCreated = false;
  private messageHandlers = new Set<(msg: DevToolsPanelMessage) => void>();

  public createPanel(
    title = "Relay",
    iconPath = "icons/icon-16.png",
    pagePath = "panel.html",
  ): boolean {
    this.isPanelCreated = true;
    return true;
  }

  public isCreated(): boolean {
    return this.isPanelCreated;
  }

  public postMessage(msg: DevToolsPanelMessage): void {
    for (const handler of this.messageHandlers) {
      handler(msg);
    }
  }

  public onMessage(handler: (msg: DevToolsPanelMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
}
