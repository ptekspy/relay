/**
 * Manages developer-mode CSP relaxing rules strictly scoped to local dev ports.
 */
export class CspDevBypassEngine {
  private enabled = false;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public shouldRelaxHeaders(origin: string): boolean {
    if (!this.enabled) return false;

    try {
      const url = new URL(origin);
      const host = url.hostname;
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

  public relaxCspHeader(originalCsp: string): string {
    // Allows unsafe-inline, unsafe-eval, and loopback websocket connections
    return originalCsp
      .replace(
        /default-src/i,
        "default-src 'unsafe-inline' 'unsafe-eval' ws: wss:",
      )
      .replace(/script-src/i, "script-src 'unsafe-inline' 'unsafe-eval'");
  }
}
