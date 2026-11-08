import { describe, expect, test } from "bun:test";
import {
  fleetSimulator,
  highFrequencyConsoleGenerator,
  networkChaosInjector,
  RelaySimulationCoordinator,
  simulationMetricAggregator,
  simulationRunner,
  stressChaosRunner,
  syntheticDomGenerator,
  userInteractionSimulator,
  virtualPersonaGenerator,
} from "../src/index.js";

describe("Relay Synthetic Device Farm Simulator & Chaos Tests", () => {
  test("persona generator generates diverse device profiles", () => {
    const fleet = virtualPersonaGenerator.generateFleet(5);
    expect(fleet.length).toBe(5);

    const p0 = fleet[0]!;
    expect(p0.name).toBe("iPhone 15 Pro");
    expect(p0.viewport.width).toBe(393);
    expect(p0.batteryLevel).toBeGreaterThan(0);
  });

  test("synthetic DOM generator emits valid mutation batches", () => {
    const mutations = syntheticDomGenerator.generateBatch(6);
    expect(mutations.length).toBe(6);
    expect(["attributes", "childList", "characterData"]).toContain(
      mutations[0]!.type,
    );
    expect(mutations[0]!.targetSelector).toContain("#app");
  });

  test("user interaction simulator produces touch and scroll vectors", () => {
    const taps = userInteractionSimulator.generateTouchTap(150, 300);
    expect(taps.length).toBe(2);
    expect(taps[0]!.type).toBe("touchstart");
    expect(taps[1]!.type).toBe("touchend");

    const scroll = userInteractionSimulator.generateScrollTrajectory(5, 0, 20);
    expect(scroll.length).toBe(5);
    expect(scroll[4]!.y).toBe(80);
  });

  test("network chaos injector simulates profiles", () => {
    networkChaosInjector.setProfile("subway");
    const subway = networkChaosInjector.getProfile();
    expect(subway.packetLossRate).toBe(0.15);
    expect(subway.minLatencyMs).toBe(150);

    const lat = networkChaosInjector.calculateSimulatedLatency(0.5);
    expect(lat).toBeGreaterThanOrEqual(150);
    expect(lat).toBeLessThanOrEqual(1200);

    // Deterministic drop check
    expect(networkChaosInjector.shouldDropPacket(0.1)).toBe(true);
    expect(networkChaosInjector.shouldDropPacket(0.2)).toBe(false);
  });

  test("console generator handles circular objects and bursts", () => {
    const circular = highFrequencyConsoleGenerator.createCircularObject();
    expect(circular.self).toBe(circular);

    const burst = highFrequencyConsoleGenerator.generateBurst(20);
    expect(burst.length).toBe(20);
    const errors = burst.filter((b) => b.level === "error");
    expect(errors.length).toBeGreaterThan(0);
  });

  test("fleet simulator manages concurrent receivers and broadcasts", () => {
    fleetSimulator.spawnFleet(25);
    expect(fleetSimulator.getConnectedCount()).toBe(25);

    fleetSimulator.broadcastMessage(5);
    const r1 = fleetSimulator.getReceiver("sim-device-1");
    expect(r1?.receivedCount).toBe(5);

    fleetSimulator.disconnect("sim-device-1");
    expect(fleetSimulator.getConnectedCount()).toBe(24);

    fleetSimulator.reconnect("sim-device-1");
    expect(fleetSimulator.getConnectedCount()).toBe(25);
  });

  test("stress chaos runner handles kill/reconnect flurries", () => {
    fleetSimulator.spawnFleet(20);
    const res = stressChaosRunner.simulateCrashFlurry(fleetSimulator, 0.5);
    expect(res.crashed).toBe(10);
    expect(res.reconnected).toBe(5);
    expect(fleetSimulator.getConnectedCount()).toBe(15);
  });

  test("metric aggregator computes percentiles and markdown table", () => {
    simulationMetricAggregator.recordEvent(10, true);
    simulationMetricAggregator.recordEvent(20, true);
    simulationMetricAggregator.recordEvent(30, true);
    simulationMetricAggregator.recordEvent(100, true);
    simulationMetricAggregator.recordEvent(0, false); // dropped

    const m = simulationMetricAggregator.computeMetrics();
    expect(m.droppedEvents).toBe(1);
    expect(m.totalDeliveredEvents).toBe(4);
    expect(m.p50LatencyMs).toBeGreaterThanOrEqual(20);

    const table = simulationMetricAggregator.renderMarkdownSummary();
    expect(table).toContain("| **Total Emitted** |");
    expect(table).toContain("| **p50 Latency** |");
  });

  test("simulation runner executes end-to-end run", () => {
    const result = simulationRunner.runSimulation({
      receivers: 10,
      durationSec: 1,
      chaos: "crowded-wifi",
    });

    expect(result.connectedReceivers).toBe(10);
    expect(result.profile).toBe("crowded-wifi");
    expect(result.summary).toContain("| **Throughput** |");
  });

  test("RelaySimulationCoordinator facade", () => {
    const coord = new RelaySimulationCoordinator();
    expect(coord.persona).toBeDefined();
    expect(coord.dom).toBeDefined();
    expect(coord.chaos).toBeDefined();
    expect(coord.fleet).toBeDefined();
  });
});
