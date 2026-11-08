import { describe, expect, it } from "bun:test";
import { PgBouncerRouter } from "../src/pg-pooler.js";

describe("TASK-193: PostgreSQL Read-Replicas & Connection Pooling (PgBouncer)", () => {
  it("splits queries based on SQL intent and routes reads to replicas and writes to primary", async () => {
    const pooler = new PgBouncerRouter();

    // Read query
    const readRes = await pooler.query(
      "SELECT * FROM relay_sessions WHERE id = $1",
      ["ses_123"],
    );
    expect(readRes.role).toBe("replica");
    expect(readRes.executedOn).toStartWith("pg-replica-");

    // Write query
    const writeRes = await pooler.query(
      "INSERT INTO relay_sessions (id, status) VALUES ($1, $2)",
      ["ses_123", "active"],
    );
    expect(writeRes.role).toBe("primary");
    expect(writeRes.executedOn).toBe("pg-primary-az-a");
  });

  it("distributes read traffic across multiple read-replicas in round-robin fashion", async () => {
    const pooler = new PgBouncerRouter();

    const executedReplicas: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await pooler.query("SELECT count(*) FROM audit_logs");
      executedReplicas.push(res.executedOn);
    }

    expect(executedReplicas).toEqual([
      "pg-replica-az-b",
      "pg-replica-az-c",
      "pg-replica-az-b",
      "pg-replica-az-c",
    ]);
  });

  it("sustains 5,000 queries with p95 connection acquisition latency < 2ms", async () => {
    const pooler = new PgBouncerRouter();
    const queryCount = 5000;

    const queries: Promise<unknown>[] = [];
    const startTime = performance.now();

    for (let i = 0; i < queryCount; i++) {
      const isRead = i % 5 !== 0; // 80% read, 20% write
      const sql = isRead
        ? "SELECT id, last_heartbeat FROM relay_sessions WHERE id = $1"
        : "UPDATE relay_sessions SET last_heartbeat = NOW() WHERE id = $1";
      queries.push(pooler.query(sql, [`ses_${i}`]));
    }

    await Promise.all(queries);
    const duration = performance.now() - startTime;
    const metrics = pooler.getMetrics();

    expect(metrics.totalQueries).toBe(queryCount);
    expect(metrics.primaryQueries).toBe(1000);
    expect(metrics.replicaQueries).toBe(4000);

    // Criteria: p95 acquisition time < 2ms
    expect(metrics.p95AcquisitionTimeMs).toBeLessThan(2.0);

    // Overall throughput: 5,000 queries completed within 1000ms
    expect(duration).toBeLessThan(1000);
  });
});
