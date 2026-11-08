import { fleetSimulator } from "./fleet-simulator.js";
import { simulationMetricAggregator } from "./metric-aggregator.js";
import { networkChaosInjector } from "./network-chaos.js";
import type { ChaosProfileName } from "./types.js";

export interface SimulationCliOptions {
  receivers: number;
  durationSec: number;
  chaos: ChaosProfileName;
}

export class SimulationRunner {
  public runSimulation(options: SimulationCliOptions): {
    connectedReceivers: number;
    profile: string;
    summary: string;
  } {
    networkChaosInjector.setProfile(options.chaos);
    fleetSimulator.spawnFleet(options.receivers);

    // Simulate sending batches of events through the fleet
    const eventCount = options.receivers * 10;
    for (let i = 0; i < eventCount; i++) {
      const isDropped = networkChaosInjector.shouldDropPacket();
      const latency = networkChaosInjector.calculateSimulatedLatency();
      simulationMetricAggregator.recordEvent(latency, !isDropped);
    }

    fleetSimulator.broadcastMessage(10);

    return {
      connectedReceivers: fleetSimulator.getConnectedCount(),
      profile: networkChaosInjector.getProfile().name,
      summary: simulationMetricAggregator.renderMarkdownSummary(),
    };
  }
}

export const simulationRunner = new SimulationRunner();
