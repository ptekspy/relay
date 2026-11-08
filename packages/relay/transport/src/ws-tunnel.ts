import type { RelayTransport, TransportState, TransportType } from "./types.js";

export interface WebSocketTunnelOptions {
  url: string;
  authToken?: string;
  pingIntervalMs?: number;
}

export class WebSocketTunnelTransport implements RelayTransport {
  public readonly transportType: TransportType = "ws_tunnel";
  private _state: TransportState = "idle";
  private _rttMs = 0;
  private messageHandlers = new Set<(data: Uint8Array) => void>();
  private stateHandlers = new Set<(state: TransportState) => void>();

  constructor(public readonly options: WebSocketTunnelOptions) {}

  public get state(): TransportState {
    return this._state;
  }

  public get rttMs(): number {
    return this._rttMs;
  }

  public async connect(): Promise<void> {
    this.setState("connecting");
    // Connect logic / simulation
    this.setState("connected");
  }

  public async send(_data: Uint8Array): Promise<void> {
    if (this._state !== "connected") {
      throw new Error(
        `Cannot send data when transport state is ${this._state}`,
      );
    }
    // In production, sends over active WebSocket.
  }

  public receiveIncoming(data: Uint8Array): void {
    for (const handler of this.messageHandlers) {
      handler(data);
    }
  }

  public onMessage(handler: (data: Uint8Array) => void): void {
    this.messageHandlers.add(handler);
  }

  public onStateChange(handler: (state: TransportState) => void): void {
    this.stateHandlers.add(handler);
  }

  public async close(): Promise<void> {
    this.setState("closed");
    this.messageHandlers.clear();
    this.stateHandlers.clear();
  }

  public setRtt(rtt: number): void {
    this._rttMs = rtt;
  }

  private setState(newState: TransportState): void {
    this._state = newState;
    for (const handler of this.stateHandlers) {
      handler(newState);
    }
  }
}
