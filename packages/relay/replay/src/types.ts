/**
 * @paddy-systems/relay-replay
 * Types and interfaces for deterministic time-travel and replay engine.
 * Note to Sally: Standalone replay engine package, safe to import or link.
 */

import type {
  ConsoleLogLevel,
  RelayTelemetryEvent,
} from "@paddy-systems/relay-protocol";

export interface ReplayEventWrapper {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  receiverId: string;
  event: RelayTelemetryEvent;
}

export type PlaybackState = "idle" | "playing" | "paused" | "ended";

export interface VirtualClockConfig {
  startTime: number;
  endTime: number;
  speed: number; // e.g. 0.25, 0.5, 1, 2, 4, 8
}

export interface ReplayDomNode {
  id: string;
  tagName: string;
  attributes: Record<string, string>;
  children: ReplayDomNode[];
  textContent?: string;
}

export interface DomKeyframe {
  timestamp: number;
  root: ReplayDomNode;
}

export interface NetworkRequestReplayItem {
  id: string;
  url: string;
  method: string;
  status: number;
  startTime: number;
  durationMs: number;
  sizeBytes?: number;
  error?: string;
  state: "pending" | "completed" | "failed";
}

export interface ConsoleReplayItem {
  id: string;
  timestamp: number;
  level: ConsoleLogLevel;
  args: string[];
  stackTrace?: string;
  demangledStack?: string;
}

export interface ReplayStateSnapshot {
  currentTime: number;
  playbackState: PlaybackState;
  dom: ReplayDomNode | null;
  activeRequests: NetworkRequestReplayItem[];
  recentConsoleLogs: ConsoleReplayItem[];
  activeComments?: import("@paddy-systems/relay-recording").SessionComment[];
  commentMarkers?: import("./comments.js").CommentTimelineMarker[];
  progressPercent: number;
}

export interface EventQueryCriteria {
  kinds?: Array<RelayTelemetryEvent["kind"]>;
  minTimestamp?: number;
  maxTimestamp?: number;
  searchQuery?: string;
  consoleLevels?: ConsoleLogLevel[];
  networkStatusCodes?: number[];
}
