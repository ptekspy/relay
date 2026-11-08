/**
 * @paddy-systems/relay-simulation
 * Synthetic Device Farm Simulator & Chaos Harness.
 */

export * from "./console-generator.js";
export * from "./dom-mutations.js";
export * from "./fleet-simulator.js";
export * from "./metric-aggregator.js";
export * from "./network-chaos.js";
export * from "./persona-generator.js";
export * from "./runner.js";
export * from "./stress-generator.js";
export * from "./types.js";
export * from "./user-interactions.js";

import { highFrequencyConsoleGenerator } from "./console-generator.js";
import { syntheticDomGenerator } from "./dom-mutations.js";
import { fleetSimulator } from "./fleet-simulator.js";
import { simulationMetricAggregator } from "./metric-aggregator.js";
import { networkChaosInjector } from "./network-chaos.js";
import { virtualPersonaGenerator } from "./persona-generator.js";
import { simulationRunner } from "./runner.js";
import { stressChaosRunner } from "./stress-generator.js";
import { userInteractionSimulator } from "./user-interactions.js";

export class RelaySimulationCoordinator {
  public persona = virtualPersonaGenerator;
  public dom = syntheticDomGenerator;
  public interaction = userInteractionSimulator;
  public chaos = networkChaosInjector;
  public consoleGen = highFrequencyConsoleGenerator;
  public fleet = fleetSimulator;
  public stress = stressChaosRunner;
  public metrics = simulationMetricAggregator;
  public runner = simulationRunner;
}
