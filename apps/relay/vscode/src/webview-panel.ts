export class RelayWebviewManager {
  private isVisible = false;

  public show(): void {
    this.isVisible = true;
  }

  public hide(): void {
    this.isVisible = false;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public renderWebviewHtml(shortCode: string, pairingUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      max-width: 360px;
    }
    .code {
      font-size: 2rem;
      letter-spacing: 0.25rem;
      font-weight: 700;
      color: var(--vscode-textLink-foreground);
      margin: 1rem 0;
    }
    .qr-box {
      width: 200px;
      height: 200px;
      background: white;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Scan to Pair Receiver</h2>
    <div class="qr-box">
      <!-- SVG QR placeholder -->
      <span style="color: black; font-weight: 600;">[QR CODE]</span>
    </div>
    <div class="code">${shortCode}</div>
    <p>Point phone camera at screen or enter code at <code>${pairingUrl}</code></p>
  </div>
</body>
</html>`;
  }
}
