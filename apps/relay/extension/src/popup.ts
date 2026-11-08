import type { ExtensionSessionState } from "./types.js";

/**
 * Controller for extension browser action popup modal.
 */
export class ExtensionPopupController {
  private state: ExtensionSessionState = {
    isDevServerDetected: false,
    connectedReceiversCount: 0,
  };

  public updateSession(state: Partial<ExtensionSessionState>): void {
    Object.assign(this.state, state);
  }

  public getState(): ExtensionSessionState {
    return { ...this.state };
  }

  public renderPopupHtml(): string {
    const { isDevServerDetected, shortCode, connectedReceiversCount } =
      this.state;

    if (!isDevServerDetected) {
      return `
        <div class="popup-empty">
          <p>No active local development server detected on this tab.</p>
        </div>
      `;
    }

    return `
      <div class="popup-active">
        <h3>⚡ Relay Companion</h3>
        <p>Short Code: <strong>${shortCode || "N/A"}</strong></p>
        <p>Connected Devices: <strong>${connectedReceiversCount}</strong></p>
        <div id="qr-container"></div>
      </div>
    `;
  }
}
