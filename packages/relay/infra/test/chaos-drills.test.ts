import { describe, expect, it } from "bun:test";
import { ChaosMonkeyRunner } from "../src/chaos-drills.js";

describe("TASK-197: Automated Chaos Monkey Injected Disconnect Drills", () => {
  const runner = new ChaosMonkeyRunner();

  it("recovers from edge proxy instance termination within 2 seconds", async () => {
    let proxyRunning = true;
    let clientConnected = false;

    const result = await runner.runProxyTerminationDrill({
      terminateProxy: () => {
        proxyRunning = false;
        clientConnected = false;
      },
      restartProxy: async () => {
        // Fast standby recovery simulation
        await new Promise((r) => setTimeout(r, 20));
        proxyRunning = true;
      },
      verifyClientReconnected: async () => {
        if (proxyRunning) {
          clientConnected = true;
        }
        return clientConnected;
      },
    });

    expect(result.recoveredSuccessfully).toBe(true);
    expect(result.clientReconnected).toBe(true);
    expect(result.dataCorrupted).toBe(false);
    expect(result.recoveryDurationMs).toBeLessThan(2000); // < 2 seconds
    expect(result.diagnosticNotes).toContain(
      "Simulating sudden edge proxy SIGKILL...",
    );
  });

  it("recovers from primary database crash via replica promotion in < 2 seconds", async () => {
    let primaryOnline = true;
    let currentMaster = "pg-master-az-a";

    const result = await runner.runDbFailoverDrill({
      crashPrimaryDb: () => {
        primaryOnline = false;
      },
      promoteStandbyReplica: async () => {
        await new Promise((r) => setTimeout(r, 15));
        currentMaster = "pg-replica-az-b";
        primaryOnline = true;
        return currentMaster;
      },
      verifyDatabaseWriteable: async () =>
        primaryOnline && currentMaster === "pg-replica-az-b",
    });

    expect(result.recoveredSuccessfully).toBe(true);
    expect(result.recoveryDurationMs).toBeLessThan(2000);
    expect(result.dataCorrupted).toBe(false);
  });

  it("survives 500ms network jitter without data corruption or packet loss", async () => {
    const jitterMs = 500;
    const result = await runner.runNetworkJitterDrill({
      jitterMs,
      sendPacket: async (payload: string) => {
        await new Promise((r) => setTimeout(r, 10)); // simulated latency
        return { received: payload, latencyMs: jitterMs + 10 };
      },
    });

    expect(result.recoveredSuccessfully).toBe(true);
    expect(result.dataCorrupted).toBe(false);
  });
});
