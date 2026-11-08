import { describe, expect, it } from "bun:test";
import { TunnelCircuitBreaker } from "../src/circuit-breaker";

describe("TASK-108: Edge Health Probes & Connection Circuit Breakers", () => {
  it("begins in CLOSED state and accepts requests", () => {
    const cb = new TunnelCircuitBreaker({ failureThreshold: 3 });
    expect(cb.isAvailable()).toBe(true);
    expect(cb.getStatus().state).toBe("CLOSED");
  });

  it("trips into OPEN state after consecutive failures exceed threshold", () => {
    const cb = new TunnelCircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 100,
    });

    cb.recordFailure();
    expect(cb.isAvailable()).toBe(true);
    expect(cb.getStatus().consecutiveFailures).toBe(1);

    cb.recordFailure();
    expect(cb.isAvailable()).toBe(true);

    cb.recordFailure(); // 3rd failure trips the breaker
    expect(cb.isAvailable()).toBe(false);
    expect(cb.getStatus().state).toBe("OPEN");
    expect(cb.getStatus().totalTrips).toBe(1);

    // Fast failure response emitted immediately
    const failResp = cb.generateFastFailure("sess-dev-123");
    expect(failResp.statusCode).toBe(502);
    expect(failResp.errorCode).toBe("ERR_HOST_DEV_SERVER_UNRESPONSIVE");
    expect(failResp.html).toContain("502 Bad Gateway");
    expect(failResp.html).toContain("sess-dev-123");
  });

  it("transitions to HALF_OPEN after reset timeout and recovers upon success", async () => {
    const cb = new TunnelCircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 50,
    });

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStatus().state).toBe("OPEN");

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(cb.isAvailable()).toBe(true); // in HALF_OPEN, available for probe
    expect(cb.getStatus().state).toBe("HALF_OPEN");

    // Success in half-open recovers circuit
    cb.recordSuccess();
    expect(cb.getStatus().state).toBe("CLOSED");
    expect(cb.getStatus().consecutiveFailures).toBe(0);
  });
});
