import { describe, expect, it } from "bun:test";
import { EdgeReconnectBuffer } from "../src/reconnect-buffer";

describe("TASK-109: Edge Request Buffer & Zero-Downtime Host Reconnection", () => {
  it("resolves immediately when host is connected", async () => {
    const buffer = new EdgeReconnectBuffer();
    buffer.handleHostConnected("conn-initial-1");

    const connId = await buffer.enqueueRequest(
      "req-1",
      1,
      "GET",
      "/api/user",
      {},
    );
    expect(connId).toBe("conn-initial-1");
  });

  it("buffers incoming requests during host disconnect and resolves them on reconnect", async () => {
    const buffer = new EdgeReconnectBuffer({ graceWindowMs: 200 });
    buffer.handleHostConnected("conn-1");

    // Host drops connection
    buffer.handleHostDisconnected();
    expect(buffer.getConnectionState()).toBe("DISCONNECTED_GRACE");

    // 2 incoming requests arrive while disconnected
    const p1 = buffer.enqueueRequest("req-1", 1, "GET", "/status", {});
    const p2 = buffer.enqueueRequest("req-2", 2, "POST", "/submit", {});

    expect(buffer.getBufferedCount()).toBe(2);

    // Host reconnects after 30ms with new connection ID
    await new Promise((resolve) => setTimeout(resolve, 30));
    buffer.handleHostConnected("conn-2-reconnected");

    const [conn1, conn2] = await Promise.all([p1, p2]);
    expect(conn1).toBe("conn-2-reconnected");
    expect(conn2).toBe("conn-2-reconnected");
    expect(buffer.getBufferedCount()).toBe(0);
    expect(buffer.getConnectionState()).toBe("CONNECTED");
  });

  it("times out requests with 504 error if host fails to reconnect within grace window", async () => {
    const buffer = new EdgeReconnectBuffer({ graceWindowMs: 60 });
    buffer.handleHostConnected("conn-initial");
    buffer.handleHostDisconnected();

    let errorCaught: Error | null = null;
    const reqPromise = buffer.enqueueRequest(
      "req-timeout",
      1,
      "GET",
      "/data",
      {},
    );

    try {
      await reqPromise;
    } catch (err) {
      errorCaught = err as Error;
    }

    expect(errorCaught).not.toBeNull();
    expect(errorCaught?.message).toContain("504 Gateway Timeout");
    expect(buffer.getConnectionState()).toBe("EXPIRED");
  });
});
