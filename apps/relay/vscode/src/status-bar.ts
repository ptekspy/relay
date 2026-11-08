export class RelayStatusBarItem {
  private text = "$(radio-tower) Relay: Off";
  private tooltip = "Click to start Relay session";
  private command = "relay.start";
  private visible = true;

  public update(
    connectedCount: number,
    avgLatencyMs: number,
    port?: number,
  ): void {
    if (connectedCount === 0) {
      if (port) {
        this.text = `$(radio-tower) Relay :${port} (0 devices)`;
        this.tooltip = `Relay active on port ${port}. Waiting for receivers.`;
      } else {
        this.text = "$(radio-tower) Relay: Off";
        this.tooltip = "Click to start Relay session";
      }
    } else {
      this.text = `$(radio-tower) Relay: ${connectedCount} device(s) (${avgLatencyMs}ms)`;
      this.tooltip = `Relay active on port ${port || "auto"}. ${connectedCount} connected receiver(s).`;
    }
  }

  public getText(): string {
    return this.text;
  }

  public getTooltip(): string {
    return this.tooltip;
  }

  public getCommand(): string {
    return this.command;
  }

  public setVisible(val: boolean): void {
    this.visible = val;
  }

  public isVisible(): boolean {
    return this.visible;
  }
}
