import { describe, expect, it } from "bun:test";
import { ConnectionStateMachine } from "../src/state-machine.js";

describe("ConnectionStateMachine", () => {
  it("transitions through standard connection lifecycle", () => {
    const fsm = new ConnectionStateMachine();
    expect(fsm.state).toBe("INITIALIZING");

    fsm.transitionTo("PAIRING");
    expect(fsm.state).toBe("PAIRING");

    fsm.transitionTo("CONNECTED");
    expect(fsm.state).toBe("CONNECTED");

    fsm.transitionTo("DEGRADED");
    expect(fsm.state).toBe("DEGRADED");

    fsm.transitionTo("CONNECTED");
    expect(fsm.state).toBe("CONNECTED");

    fsm.transitionTo("TERMINATED");
    expect(fsm.state).toBe("TERMINATED");
  });

  it("rejects illegal state transitions", () => {
    const fsm = new ConnectionStateMachine();
    expect(() => fsm.transitionTo("CONNECTED")).toThrow(
      /Illegal connection state transition/,
    );
  });

  it("notifies registered change listeners", () => {
    const fsm = new ConnectionStateMachine();
    const transitions: string[] = [];

    const unsubscribe = fsm.onStateChange((event) => {
      transitions.push(`${event.from}->${event.to}`);
    });

    fsm.transitionTo("PAIRING");
    fsm.transitionTo("CONNECTED");
    unsubscribe();
    fsm.transitionTo("DISCONNECTED");

    expect(transitions).toEqual([
      "INITIALIZING->PAIRING",
      "PAIRING->CONNECTED",
    ]);
  });
});
