import { RelayProtocolError } from "./errors.js";

export type ConnectionState =
  | "INITIALIZING"
  | "PAIRING"
  | "CONNECTED"
  | "DEGRADED"
  | "DISCONNECTED"
  | "TERMINATED";

export interface StateChangeEvent {
  from: ConnectionState;
  to: ConnectionState;
  timestamp: number;
  reason?: string;
}

export type StateChangeHandler = (event: StateChangeEvent) => void;

const ALLOWED_TRANSITIONS: Record<ConnectionState, readonly ConnectionState[]> =
  {
    INITIALIZING: ["PAIRING", "TERMINATED"],
    PAIRING: ["CONNECTED", "DISCONNECTED", "TERMINATED"],
    CONNECTED: ["DEGRADED", "DISCONNECTED", "TERMINATED"],
    DEGRADED: ["CONNECTED", "DISCONNECTED", "TERMINATED"],
    DISCONNECTED: ["CONNECTED", "PAIRING", "TERMINATED"],
    TERMINATED: [],
  };

export class ConnectionStateMachine {
  private currentState: ConnectionState;
  private readonly listeners: Set<StateChangeHandler> = new Set();
  private readonly history: StateChangeEvent[] = [];

  constructor(initialState: ConnectionState = "INITIALIZING") {
    this.currentState = initialState;
  }

  get state(): ConnectionState {
    return this.currentState;
  }

  get stateHistory(): readonly StateChangeEvent[] {
    return this.history;
  }

  canTransitionTo(next: ConnectionState): boolean {
    const validNextStates = ALLOWED_TRANSITIONS[this.currentState];
    return validNextStates.includes(next);
  }

  transitionTo(next: ConnectionState, reason?: string): StateChangeEvent {
    if (!this.canTransitionTo(next)) {
      throw new RelayProtocolError(
        "ERR_ILLEGAL_STATE_TRANSITION",
        `Illegal connection state transition from ${this.currentState} to ${next}`,
        { currentState: this.currentState, attemptedState: next },
      );
    }

    const event: StateChangeEvent = {
      from: this.currentState,
      to: next,
      timestamp: Date.now(),
      reason,
    };

    this.currentState = next;
    this.history.push(event);

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("State transition listener failed:", err);
      }
    }

    return event;
  }

  onStateChange(listener: StateChangeHandler): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
