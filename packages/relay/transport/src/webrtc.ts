import type { RelayTransport, TransportState, TransportType } from "./types.js";

export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface WebRtcTransportOptions {
  iceServers?: IceServerConfig[];
  connectionTimeoutMs?: number;
}

export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  {
    urls: ["turn:relay.paddy-systems.com:3478"],
    username: "guest",
    credential: "relay_guest_password",
  },
];

export class WebRtcDataTransport implements RelayTransport {
  public readonly transportType: TransportType = "webrtc_p2p";
  private _state: TransportState = "idle";
  private _rttMs = 0;
  private messageHandlers = new Set<(data: Uint8Array) => void>();
  private stateHandlers = new Set<(state: TransportState) => void>();
  public readonly iceServers: IceServerConfig[];

  constructor(options: WebRtcTransportOptions = {}) {
    this.iceServers = options.iceServers ?? DEFAULT_ICE_SERVERS;
  }

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
      throw new Error(`Cannot send data when WebRTC state is ${this._state}`);
    }
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
