import type { FleetSimulator } from "./fleet-simulator.js";

export class StressChaosRunner {
  public simulateCrashFlurry(
    fleet: FleetSimulator,
    crashRatio = 0.5,
  ): { crashed: number; reconnected: number } {
    const total = fleet.getConnectedCount();
    const toCrash = Math.floor(total * crashRatio);
    let crashed = 0;

    for (let i = 1; i <= toCrash; i++) {
      const id = `sim-device-${i}`;
      fleet.disconnect(id);
      crashed++;
    }

    // Reconnect half of them immediately
    let reconnected = 0;
    for (let i = 1; i <= Math.floor(toCrash / 2); i++) {
      const id = `sim-device-${i}`;
      fleet.reconnect(id);
      reconnected++;
    }

    return { crashed, reconnected };
  }
}

export const stressChaosRunner = new StressChaosRunner();
