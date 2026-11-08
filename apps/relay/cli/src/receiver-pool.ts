import type { Socket } from "node:net";
import type { RelayReceiverMetadata } from "@paddy-systems/relay-protocol";

export interface ConnectedReceiver extends RelayReceiverMetadata {
  socket?: Socket;
}

export class ReceiverConnectionPool {
  private readonly maxReceivers: number;
  private readonly receivers: Map<string, ConnectedReceiver> = new Map();
  private readonly onPoolChange?: () => void;

  constructor(options?: { maxReceivers?: number; onPoolChange?: () => void }) {
    this.maxReceivers = options?.maxReceivers ?? 10;
    this.onPoolChange = options?.onPoolChange;
  }

  get count(): number {
    return this.receivers.size;
  }

  getAll(): ConnectedReceiver[] {
    return Array.from(this.receivers.values());
  }

  get(id: string): ConnectedReceiver | undefined {
    return this.receivers.get(id);
  }

  register(receiver: ConnectedReceiver): boolean {
    if (
      this.receivers.size >= this.maxReceivers &&
      !this.receivers.has(receiver.id)
    ) {
      return false;
    }

    this.receivers.set(receiver.id, receiver);
    this.onPoolChange?.();
    return true;
  }

  touch(id: string): void {
    const existing = this.receivers.get(id);
    if (existing) {
      existing.lastActiveAt = Date.now();
    }
  }

  remove(id: string): boolean {
    const existing = this.receivers.get(id);
    if (!existing) return false;

    if (existing.socket && !existing.socket.destroyed) {
      existing.socket.destroy();
    }

    this.receivers.delete(id);
    this.onPoolChange?.();
    return true;
  }

  cleanupStale(staleTimeoutMs = 60000): number {
    const cutoff = Date.now() - staleTimeoutMs;
    let removed = 0;

    for (const [id, receiver] of this.receivers.entries()) {
      if (receiver.lastActiveAt < cutoff) {
        if (receiver.socket && !receiver.socket.destroyed) {
          receiver.socket.destroy();
        }
        this.receivers.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.onPoolChange?.();
    }

    return removed;
  }
}
