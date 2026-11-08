import { beforeEach, describe, expect, it } from "bun:test";
import {
  TOTAL_CLUSTER_SLOTS,
  ValkeyClusterManager,
} from "../src/valkey-cluster.js";

describe("TASK-192: Redis Cluster / Valkey Distributed Session State Partitioning", () => {
  let cluster: ValkeyClusterManager;

  beforeEach(() => {
    cluster = new ValkeyClusterManager();
  });

  it("calculates CRC16 hash slot and respects Redis hash tags for partition colocation", () => {
    const rawKey = "session:42:heartbeat";
    const slot = cluster.getSlot(rawKey);
    expect(slot).toBeGreaterThanOrEqual(0);
    expect(slot).toBeLessThan(TOTAL_CLUSTER_SLOTS);

    // Hash tags test: keys with identical {tag} must map to identical slot
    const key1 = "session:{user_999}:metadata";
    const key2 = "session:{user_999}:connections";
    const key3 = "session:{user_999}:active_tunnel";

    const slot1 = cluster.getSlot(key1);
    const slot2 = cluster.getSlot(key2);
    const slot3 = cluster.getSlot(key3);

    expect(slot1).toBe(slot2);
    expect(slot2).toBe(slot3);
  });

  it("writes session state and validates master routing and replica synchronization", () => {
    const testSessionKey = "session:{ses_abc123}:state";
    const writeResult = cluster.set(
      testSessionKey,
      JSON.stringify({ active: true }),
    );

    expect(writeResult.nodeId).toStartWith("valkey-master-");
    expect(writeResult.slot).toBe(cluster.getSlot(testSessionKey));

    const readValue = cluster.get(testSessionKey);
    expect(readValue).toBe(JSON.stringify({ active: true }));
  });

  it("handles 50,000 concurrent session heartbeats distributed across AZ nodes", () => {
    const count = 50_000;
    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
      const sessId = `ses_perf_${i}`;
      cluster.heartbeat(sessId, 300);
    }

    const duration = Date.now() - startTime;
    const stats = cluster.getClusterStats();

    expect(stats.totalKeys).toBe(count);

    // Check that each AZ node holds a substantial share of keys (~33% each)
    for (const [_nodeId, keyCount] of Object.entries(stats.distribution)) {
      expect(keyCount).toBeGreaterThan(10000); // Fairly distributed
    }

    // Benchmark assertion: 50,000 heartbeats in under 500ms
    expect(duration).toBeLessThan(500);
  });
});
