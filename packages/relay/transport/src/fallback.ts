import type { RelayTransport, TransportState, TransportType } from "./types.js";

export class DynamicTransportFallback implements RelayTransport {
  private activeTransport: RelayTransport | null = null;
  private _state: TransportState = "idle";
  private messageHandlers = new Set<(data: Uint8Array) => void>();
  private stateHandlers = new Set<(state: TransportState) => void>();

  constructor(private readonly candidates: RelayTransport[]) {
    if (candidates.length === 0) {
      throw new Error("Must provide at least one candidate transport");
    }
  }

  public get transportType(): TransportType {
    return (
      this.activeTransport?.transportType ??
      this.candidates[0]?.transportType ??
      "webrtc_p2p"
    );
  }

  public get state(): TransportState {
    return this._state;
  }

  public get rttMs(): number {
    return this.activeTransport?.rttMs ?? 0;
  }

  public async connect(timeoutMsPerCandidate = 3000): Promise<void> {
    this._state = "connecting";
    for (const candidate of this.candidates) {
      try {
        const connectPromise = candidate.connect();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout")),
            timeoutMsPerCandidate,
          ),
        );

        await Promise.race([connectPromise, timeoutPromise]);

        this.activeTransport = candidate;
        this._state = candidate.state;
        candidate.onMessage((data) => {
          for (const handler of this.messageHandlers) handler(data);
        });
        candidate.onStateChange((state) => {
          this._state = state;
          for (const handler of this.stateHandlers) handler(state);
        });
        return;
      } catch {
        // Fall back to next candidate
        await candidate.close().catch(() => {});
      }
    }

    this._state = "closed";
    throw new Error("All transport candidates failed to connect");
  }

  public async send(data: Uint8Array): Promise<void> {
    if (!this.activeTransport) {
      throw new Error("No active transport connected");
    }
    return this.activeTransport.send(data);
  }

  public onMessage(handler: (data: Uint8Array) => void): void {
    this.messageHandlers.add(handler);
  }

  public onStateChange(handler: (state: TransportState) => void): void {
    this.stateHandlers.add(handler);
  }

  public async close(): Promise<void> {
    this._state = "closed";
    await this.activeTransport?.close();
    this.activeTransport = null;
    this.messageHandlers.clear();
    this.stateHandlers.clear();
  }
}
