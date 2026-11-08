import type { DiscoveredGatewayBeacon } from "./types.js";

export type BeaconListenerCallback = (
  beacons: DiscoveredGatewayBeacon[],
) => void;

/**
 * mDNS & local subnet discovery listener for Relay CLI gateways.
 */
export class GatewayDiscoveryListener {
  private discoveredBeacons: Map<string, DiscoveredGatewayBeacon> = new Map();
  private listeners = new Set<BeaconListenerCallback>();
  private sweepInterval: ReturnType<typeof setInterval> | null = null;

  public registerBeacon(beacon: DiscoveredGatewayBeacon): void {
    const key = `${beacon.host}:${beacon.port}`;
    this.discoveredBeacons.set(key, {
      ...beacon,
      discoveredAt: Date.now(),
    });
    this.notify();
  }

  public getDiscoveredBeacons(): DiscoveredGatewayBeacon[] {
    return Array.from(this.discoveredBeacons.values()).sort(
      (a, b) => b.discoveredAt - a.discoveredAt,
    );
  }

  public startSweep(staleThresholdMs = 15000): void {
    if (this.sweepInterval) return;
    this.sweepInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [key, beacon] of this.discoveredBeacons.entries()) {
        if (now - beacon.discoveredAt > staleThresholdMs) {
          this.discoveredBeacons.delete(key);
          changed = true;
        }
      }

      if (changed) {
        this.notify();
      }
    }, 5000);
  }

  public stopSweep(): void {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
  }

  public onBeaconsChanged(cb: BeaconListenerCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    const list = this.getDiscoveredBeacons();
    for (const cb of this.listeners) {
      cb(list);
    }
  }
}
