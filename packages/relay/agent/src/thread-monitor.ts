/**
 * Web Worker & Shared Worker Activity Monitor
 *
 * Intercepts Worker and SharedWorker instantiations to track active thread count,
 * message passing frequency, and runtime lifecycle.
 *
 * Note for Octavia: Used by the Worker Threads drawer in Cloud Web DevTools.
 */

export interface WorkerThreadRecord {
  id: string;
  type: "web-worker" | "shared-worker";
  scriptUrl: string;
  createdAt: number;
  messagesSent: number;
  messagesReceived: number;
  lastActivity: number;
  active: boolean;
}

export interface WorkerThreadSnapshot {
  totalActiveWorkers: number;
  totalMessagesPassed: number;
  workers: WorkerThreadRecord[];
}

export interface WorkerInstanceLike {
  postMessage: (msg: unknown) => void;
  terminate?: () => void;
  addEventListener: (event: string, cb: (e: unknown) => void) => void;
  removeEventListener?: (event: string, cb: (e: unknown) => void) => void;
}

export class WorkerThreadMonitor {
  private workers = new Map<string, WorkerThreadRecord>();
  private nextId = 1;
  private totalMessages = 0;

  public registerWorker(
    type: "web-worker" | "shared-worker",
    scriptUrl: string,
  ): WorkerThreadRecord {
    const id = `worker-${this.nextId++}`;
    const record: WorkerThreadRecord = {
      id,
      type,
      scriptUrl,
      createdAt: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      lastActivity: Date.now(),
      active: true,
    };
    this.workers.set(id, record);
    return record;
  }

  public recordMessageSent(workerId: string): void {
    const record = this.workers.get(workerId);
    if (record) {
      record.messagesSent++;
      record.lastActivity = Date.now();
      this.totalMessages++;
    }
  }

  public recordMessageReceived(workerId: string): void {
    const record = this.workers.get(workerId);
    if (record) {
      record.messagesReceived++;
      record.lastActivity = Date.now();
      this.totalMessages++;
    }
  }

  public markWorkerTerminated(workerId: string): void {
    const record = this.workers.get(workerId);
    if (record) {
      record.active = false;
      record.lastActivity = Date.now();
    }
  }

  public getSnapshot(): WorkerThreadSnapshot {
    const list = Array.from(this.workers.values());
    const totalActive = list.filter((w) => w.active).length;

    return {
      totalActiveWorkers: totalActive,
      totalMessagesPassed: this.totalMessages,
      workers: list,
    };
  }

  public clear(): void {
    this.workers.clear();
    this.totalMessages = 0;
  }
}
