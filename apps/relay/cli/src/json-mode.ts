export interface CliJsonEvent {
  event:
    | "session_created"
    | "port_ready"
    | "receiver_connected"
    | "receiver_disconnected"
    | "error";
  timestamp: string;
  data: Record<string, unknown>;
}

export class JsonEventLogger {
  private enabled: boolean;

  constructor(enabled = false) {
    this.enabled = enabled;
  }

  public log(
    event: CliJsonEvent["event"],
    data: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const payload: CliJsonEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }

  public isJsonMode(): boolean {
    return this.enabled;
  }
}
