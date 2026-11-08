import { virtualPersonaGenerator } from "./persona-generator.js";
import type { VirtualDevicePersona } from "./types.js";

export interface SimulatedReceiverConnection {
  persona: VirtualDevicePersona;
  isConnected: boolean;
  receivedCount: number;
  emittedCount: number;
  lastPingTime: number;
}

export class FleetSimulator {
  private receivers = new Map<string, SimulatedReceiverConnection>();

  public spawnFleet(count: number): void {
    this.receivers.clear();
    const personas = virtualPersonaGenerator.generateFleet(count);
    const now = Date.now();

    for (const p of personas) {
      this.receivers.set(p.id, {
        persona: p,
        isConnected: true,
        receivedCount: 0,
        emittedCount: 0,
        lastPingTime: now,
      });
    }
  }

  public getConnectedCount(): number {
    let count = 0;
    for (const rec of this.receivers.values()) {
      if (rec.isConnected) count++;
    }
    return count;
  }

  public broadcastMessage(messageSize = 1): void {
    for (const rec of this.receivers.values()) {
      if (rec.isConnected) {
        rec.receivedCount += messageSize;
      }
    }
  }

  public getReceiver(id: string): SimulatedReceiverConnection | undefined {
    return this.receivers.get(id);
  }

  public disconnect(id: string): void {
    const rec = this.receivers.get(id);
    if (rec) rec.isConnected = false;
  }

  public reconnect(id: string): void {
    const rec = this.receivers.get(id);
    if (rec) rec.isConnected = true;
  }
}

export const fleetSimulator = new FleetSimulator();
