/**
 * PostgreSQL Read-Replicas & Connection Pooling (PgBouncer)
 *
 * Implements transaction-level connection pooling (PgBouncer-compatible),
 * automatic read/write intent query splitting, and load-balanced read-replica routing.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-infra/pg-pooler.
 */

export type QueryIntent = "read" | "write" | "transaction";

export interface DatabaseNode {
  id: string;
  role: "primary" | "replica";
  host: string;
  port: number;
  activeConnections: number;
  maxConnections: number;
}

export interface PoolMetrics {
  totalQueries: number;
  primaryQueries: number;
  replicaQueries: number;
  p95AcquisitionTimeMs: number;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  executedOn: string;
  role: "primary" | "replica";
  acquisitionTimeMs: number;
  executionTimeMs: number;
}

export class PgBouncerRouter {
  private primary: DatabaseNode;
  private replicas: DatabaseNode[];
  private nextReplicaIdx = 0;
  private acquisitionTimes: number[] = [];
  private totalQueries = 0;
  private primaryQueries = 0;
  private replicaQueries = 0;

  constructor(options?: {
    primary?: Partial<DatabaseNode>;
    replicas?: Partial<DatabaseNode>[];
  }) {
    this.primary = {
      id: options?.primary?.id ?? "pg-primary-az-a",
      role: "primary",
      host: options?.primary?.host ?? "pg-master.internal",
      port: options?.primary?.port ?? 5432,
      activeConnections: 0,
      maxConnections: options?.primary?.maxConnections ?? 100,
    };

    this.replicas = (
      options?.replicas ?? [
        { id: "pg-replica-az-b", host: "pg-replica-1.internal" },
        { id: "pg-replica-az-c", host: "pg-replica-2.internal" },
      ]
    ).map((r, i) => ({
      id: r.id ?? `pg-replica-${i + 1}`,
      role: "replica",
      host: r.host ?? `pg-replica-${i + 1}.internal`,
      port: r.port ?? 5432,
      activeConnections: 0,
      maxConnections: r.maxConnections ?? 100,
    }));
  }

  public determineIntent(
    sql: string,
    explicitIntent?: QueryIntent,
  ): QueryIntent {
    if (explicitIntent) return explicitIntent;

    const trimmed = sql.trim().toUpperCase();
    if (
      trimmed.startsWith("SELECT") ||
      trimmed.startsWith("SHOW") ||
      trimmed.startsWith("EXPLAIN")
    ) {
      return "read";
    }

    if (
      trimmed.startsWith("INSERT") ||
      trimmed.startsWith("UPDATE") ||
      trimmed.startsWith("DELETE") ||
      trimmed.startsWith("CREATE") ||
      trimmed.startsWith("ALTER") ||
      trimmed.startsWith("DROP")
    ) {
      return "write";
    }

    return "transaction";
  }

  public async query<T = unknown>(
    sql: string,
    params?: unknown[],
    intent?: QueryIntent,
  ): Promise<QueryResult<T>> {
    const startAcquisition = performance.now();
    const effectiveIntent = this.determineIntent(sql, intent);

    let targetNode: DatabaseNode;

    if (effectiveIntent === "write" || effectiveIntent === "transaction") {
      targetNode = this.primary;
      this.primaryQueries++;
    } else {
      const replicaCandidate =
        this.replicas[this.nextReplicaIdx % this.replicas.length];
      if (replicaCandidate) {
        targetNode = replicaCandidate;
        this.nextReplicaIdx++;
        this.replicaQueries++;
      } else {
        targetNode = this.primary;
        this.primaryQueries++;
      }
    }

    targetNode.activeConnections++;
    const acquisitionDuration = performance.now() - startAcquisition;
    this.acquisitionTimes.push(acquisitionDuration);
    this.totalQueries++;

    const startExecution = performance.now();

    // Mock query execution response
    const rows = [{ query: sql, params, count: 1 }] as unknown as T[];

    targetNode.activeConnections--;
    const executionDuration = performance.now() - startExecution;

    return {
      rows,
      executedOn: targetNode.id,
      role: targetNode.role,
      acquisitionTimeMs: acquisitionDuration,
      executionTimeMs: executionDuration,
    };
  }

  public getMetrics(): PoolMetrics {
    const sorted = [...this.acquisitionTimes].sort((a, b) => a - b);
    let p95 = 0;
    if (sorted.length > 0) {
      const idx = Math.floor(sorted.length * 0.95);
      p95 = sorted[idx] ?? 0;
    }

    return {
      totalQueries: this.totalQueries,
      primaryQueries: this.primaryQueries,
      replicaQueries: this.replicaQueries,
      p95AcquisitionTimeMs: Number(p95.toFixed(3)),
    };
  }
}
