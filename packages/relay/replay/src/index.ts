/**
 * @paddy-systems/relay-replay
 * Deterministic Replay and Time-Travel Debugging Engine.
 */

export * from "./bundle.js";
export * from "./checkpoint.js";
export * from "./clock.js";
export * from "./comments.js";
export * from "./console-synthesizer.js";
export * from "./dom-reconstructor.js";
export * from "./network-waterfall.js";
export * from "./query.js";
export * from "./snippet-generator.js";
export * from "./timeline.js";
export * from "./types.js";
export * from "./voice-notes.js";

import type {
  ConsoleEvent,
  DomMutationEvent,
  NetworkTelemetryEvent,
} from "@paddy-systems/relay-protocol";
import type { SessionComment } from "@paddy-systems/relay-recording";
import { CheckpointManager } from "./checkpoint.js";
import { VirtualClock } from "./clock.js";
import { SessionCommentsManager } from "./comments.js";
import { ConsoleSynthesizer } from "./console-synthesizer.js";
import { DomReconstructor } from "./dom-reconstructor.js";
import { NetworkWaterfallSynchronizer } from "./network-waterfall.js";
import { ReplayQueryEngine } from "./query.js";
import { ReplayTimeline } from "./timeline.js";
import type { ReplayEventWrapper, ReplayStateSnapshot } from "./types.js";

/**
 * Unified Replay Engine coordinating timeline, clock, DOM reconstruction,
 * network waterfall, and console logs.
 */
export class ReplayEngine {
  private timeline = new ReplayTimeline();
  private clock: VirtualClock;
  private domReconstructor = new DomReconstructor();
  private networkSynchronizer = new NetworkWaterfallSynchronizer();
  private consoleSynthesizer = new ConsoleSynthesizer();
  private queryEngine = new ReplayQueryEngine();
  private checkpointManager = new CheckpointManager();
  private commentsManager = new SessionCommentsManager();

  constructor(
    events: ReplayEventWrapper[] = [],
    comments: SessionComment[] = [],
  ) {
    if (comments.length > 0) {
      this.commentsManager.ingest(comments);
    }
    if (events.length > 0) {
      this.timeline.ingest(events);
    }
    const startTime = this.timeline.getStartTime();
    const endTime = this.timeline.getEndTime();
    this.clock = new VirtualClock(startTime, endTime);
    this.queryEngine.setEvents(events);

    this.rebuildSubsystems();
  }

  public loadEvents(events: ReplayEventWrapper[]): void {
    this.timeline.ingest(events);
    const startTime = this.timeline.getStartTime();
    const endTime = this.timeline.getEndTime();
    this.clock.destroy();
    this.clock = new VirtualClock(startTime, endTime);
    this.queryEngine.setEvents(
      this.timeline.getEvents() as ReplayEventWrapper[],
    );

    this.rebuildSubsystems();
  }

  private rebuildSubsystems(): void {
    const allEvents = this.timeline.getEvents();

    const networkEvents: NetworkTelemetryEvent[] = [];
    const consoleEvents: ConsoleEvent[] = [];
    const domMutations: Array<{ timestamp: number; event: DomMutationEvent }> =
      [];

    for (const item of allEvents) {
      if (item.event.kind === "network") {
        networkEvents.push(item.event);
      } else if (item.event.kind === "console") {
        consoleEvents.push(item.event);
      } else if (item.event.kind === "dom_mutation") {
        domMutations.push({ timestamp: item.timestamp, event: item.event });
      }
    }

    this.networkSynchronizer.ingest(networkEvents);
    this.consoleSynthesizer.ingest(consoleEvents);
    this.checkpointManager.generateKeyframes(domMutations);
  }

  public getSnapshot(): ReplayStateSnapshot {
    const currentTime = this.clock.getCurrentTime();
    const playbackState = this.clock.getState();
    const progressPercent = this.clock.getProgressPercent();

    // Fast DOM reconstruction using keyframes
    const keyframe = this.checkpointManager.getNearestKeyframe(currentTime);
    const reconstructor = new DomReconstructor(
      keyframe ? keyframe.root : undefined,
    );
    const minTime = keyframe ? keyframe.timestamp : 0;

    const relevantMutations = this.timeline
      .getEventsInRange(minTime + 1, currentTime)
      .filter((e) => e.event.kind === "dom_mutation")
      .map((e) => e.event as DomMutationEvent);

    reconstructor.applyMutations(relevantMutations);

    const activeRequests =
      this.networkSynchronizer.getWaterfallStateAt(currentTime);
    const recentConsoleLogs = this.consoleSynthesizer.getLogsUpTo(currentTime);
    const activeComments =
      this.commentsManager.getActiveCommentsAt(currentTime);
    const commentMarkers = this.commentsManager.getTimelineMarkers();

    return {
      currentTime,
      playbackState,
      dom: reconstructor.getRoot(),
      activeRequests,
      recentConsoleLogs,
      activeComments,
      commentMarkers,
      progressPercent,
    };
  }

  public getCommentsManager(): SessionCommentsManager {
    return this.commentsManager;
  }

  public addComment(
    comment: Omit<SessionComment, "id" | "createdAt">,
  ): SessionComment {
    return this.commentsManager.addComment(comment);
  }

  public loadComments(comments: SessionComment[]): void {
    this.commentsManager.ingest(comments);
  }

  public play(): void {
    this.clock.play();
  }

  public pause(): void {
    this.clock.pause();
  }

  public seek(timestamp: number): void {
    this.clock.seek(timestamp);
  }

  public setSpeed(speed: number): void {
    this.clock.setSpeed(speed);
  }

  public getClock(): VirtualClock {
    return this.clock;
  }

  public getQueryEngine(): ReplayQueryEngine {
    return this.queryEngine;
  }

  public destroy(): void {
    this.clock.destroy();
  }
}
