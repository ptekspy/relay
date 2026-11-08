export type RelayErrorCode =
  | "ERR_AUTH_EXPIRED"
  | "ERR_AUTH_INVALID"
  | "ERR_PORT_BLOCKED"
  | "ERR_RATE_LIMITED"
  | "ERR_VERSION_MISMATCH"
  | "ERR_TUNNEL_TIMEOUT"
  | "ERR_FRAME_CORRUPT"
  | "ERR_FRAME_TOO_LARGE"
  | "ERR_ILLEGAL_STATE_TRANSITION"
  | "ERR_CAPABILITY_UNSUPPORTED"
  | "ERR_CHANNEL_CLOSED";

export interface RelayErrorPayload {
  code: RelayErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export class RelayProtocolError extends Error {
  readonly code: RelayErrorCode;
  readonly details?: Record<string, unknown>;
  readonly timestamp: number;

  constructor(
    code: RelayErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RelayProtocolError";
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, RelayProtocolError.prototype);
  }

  toJSON(): RelayErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  static fromJSON(payload: RelayErrorPayload): RelayProtocolError {
    return new RelayProtocolError(
      payload.code,
      payload.message,
      payload.details,
    );
  }
}
