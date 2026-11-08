/**
 * @paddy-systems/relay-simulation
 * Types for synthetic device farm simulator and chaos testing harness.
 */

export interface VirtualDevicePersona {
  id: string;
  name: string;
  os: "iOS" | "Android" | "iPadOS" | "macOS" | "Windows";
  osVersion: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  batteryLevel: number;
  networkType: "wifi" | "4g" | "5g" | "flaky-3g";
}

export type ChaosProfileName = "subway" | "crowded-wifi" | "elevator" | "none";

export interface ChaosProfile {
  name: ChaosProfileName;
  packetLossRate: number; // 0.0 to 1.0
  minLatencyMs: number;
  maxLatencyMs: number;
  dropRate: number;
}

export interface DomMutationPayload {
  type: "attributes" | "childList" | "characterData";
  targetSelector: string;
  attributeName?: string;
  oldValue?: string;
  newValue?: string;
  addedNodesCount?: number;
  removedNodesCount?: number;
  textContent?: string;
}

export interface SimulationBenchmarkMetrics {
  totalEmittedEvents: number;
  totalDeliveredEvents: number;
  droppedEvents: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputEventsPerSec: number;
}
