export type TransportType = "local_http" | "ws_tunnel" | "webrtc_p2p";
export type TransportState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export interface RelayTransport {
  readonly transportType: TransportType;
  readonly state: TransportState;
  readonly rttMs: number;

  connect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  onMessage(handler: (data: Uint8Array) => void): void;
  onStateChange(handler: (state: TransportState) => void): void;
  close(): Promise<void>;
}
