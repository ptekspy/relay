/**
 * Edge Worker Pool Partitioning
 *
 * Separates execution and concurrency budgets between high-priority,
 * low-latency WebSocket signaling and high-throughput streaming reverse proxy data channels.
 *
 * Note for Octavia: This module manages worker capacity bounds for the edge service.
 */

export type WorkerPoolType = "signaling" | "data_proxy";

export interface PoolMetrics {
  activeWorkers: number;
  maxWorkers: number;
  queuedTasks: number;
  processedTasks: number;
}

export interface WorkerPoolConfig {
  maxSignalingWorkers?: number;
  maxDataProxyWorkers?: number;
}

export class EdgeWorkerPoolManager {
  private readonly maxSignalingWorkers: number;
  private readonly maxDataProxyWorkers: number;
  private activeSignalingWorkers = 0;
  private activeDataProxyWorkers = 0;
  private queuedSignalingTasks = 0;
  private queuedDataProxyTasks = 0;
  private processedSignalingTasks = 0;
  private processedDataProxyTasks = 0;

  constructor(config: WorkerPoolConfig = {}) {
    this.maxSignalingWorkers = config.maxSignalingWorkers ?? 4;
    this.maxDataProxyWorkers = config.maxDataProxyWorkers ?? 16;
  }

  public getMetrics(type: WorkerPoolType): PoolMetrics {
    if (type === "signaling") {
      return {
        activeWorkers: this.activeSignalingWorkers,
        maxWorkers: this.maxSignalingWorkers,
        queuedTasks: this.queuedSignalingTasks,
        processedTasks: this.processedSignalingTasks,
      };
    }
    return {
      activeWorkers: this.activeDataProxyWorkers,
      maxWorkers: this.maxDataProxyWorkers,
      queuedTasks: this.queuedDataProxyTasks,
      processedTasks: this.processedDataProxyTasks,
    };
  }

  public acquire(type: WorkerPoolType): boolean {
    if (type === "signaling") {
      if (this.activeSignalingWorkers < this.maxSignalingWorkers) {
        this.activeSignalingWorkers++;
        return true;
      }
      this.queuedSignalingTasks++;
      return false;
    }

    if (this.activeDataProxyWorkers < this.maxDataProxyWorkers) {
      this.activeDataProxyWorkers++;
      return true;
    }
    this.queuedDataProxyTasks++;
    return false;
  }

  public release(type: WorkerPoolType): void {
    if (type === "signaling") {
      if (this.activeSignalingWorkers > 0) {
        this.activeSignalingWorkers--;
        this.processedSignalingTasks++;
        if (this.queuedSignalingTasks > 0) {
          this.queuedSignalingTasks--;
          this.activeSignalingWorkers++;
        }
      }
      return;
    }

    if (this.activeDataProxyWorkers > 0) {
      this.activeDataProxyWorkers--;
      this.processedDataProxyTasks++;
      if (this.queuedDataProxyTasks > 0) {
        this.queuedDataProxyTasks--;
        this.activeDataProxyWorkers++;
      }
    }
  }

  public reset(): void {
    this.activeSignalingWorkers = 0;
    this.activeDataProxyWorkers = 0;
    this.queuedSignalingTasks = 0;
    this.queuedDataProxyTasks = 0;
    this.processedSignalingTasks = 0;
    this.processedDataProxyTasks = 0;
  }
}
