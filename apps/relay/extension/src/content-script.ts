/**
 * Content script detecting local dev servers and managing toast pairing prompts.
 */
export class ContentScriptInjector {
  public isDevServerUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      return (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local") ||
        /^192\.168\.\d+\.\d+$/.test(host)
      );
    } catch {
      return false;
    }
  }

  public generatePairingBannerHtml(
    shortCode: string,
    gatewayPort = 7331,
  ): string {
    return `
      <div id="relay-toast-banner" style="
        position: fixed; bottom: 16px; right: 16px; z-index: 999999;
        background: #18181b; color: #fff; border: 1px solid #27272a;
        padding: 12px 16px; border-radius: 8px; font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 12px;
      ">
        <span>⚡ <strong>Relay Ready:</strong> Code <code>${shortCode}</code></span>
        <button id="relay-pair-now" style="
          background: #3b82f6; color: white; border: none; padding: 6px 12px;
          border-radius: 4px; cursor: pointer; font-weight: 500;
        ">Pair Device</button>
      </div>
    `;
  }
}
