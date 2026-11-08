import type { DomMutationEvent } from "@paddy-systems/relay-protocol";
import { DomReconstructor } from "./dom-reconstructor.js";
import type { DomKeyframe, ReplayDomNode } from "./types.js";

/**
 * Generates periodic keyframes to enable instant backward and forward seeking.
 */
export class CheckpointManager {
  private keyframeIntervalMs: number;
  private keyframes: DomKeyframe[] = [];

  constructor(keyframeIntervalMs = 5000) {
    this.keyframeIntervalMs = keyframeIntervalMs;
  }

  public generateKeyframes(
    mutations: Array<{ timestamp: number; event: DomMutationEvent }>,
    initialRoot?: ReplayDomNode,
  ): void {
    if (mutations.length === 0) return;

    this.keyframes = [];
    const reconstructor = new DomReconstructor(initialRoot);
    const firstTime = mutations[0]!.timestamp;
    const lastTime = mutations[mutations.length - 1]!.timestamp;

    let nextKeyframeTime = firstTime + this.keyframeIntervalMs;
    let mutationIdx = 0;

    // Initial keyframe at start
    this.keyframes.push({
      timestamp: firstTime,
      root: reconstructor.getRoot(),
    });

    while (nextKeyframeTime <= lastTime && mutationIdx < mutations.length) {
      while (
        mutationIdx < mutations.length &&
        mutations[mutationIdx]!.timestamp <= nextKeyframeTime
      ) {
        reconstructor.applyMutation(mutations[mutationIdx]!.event);
        mutationIdx++;
      }

      this.keyframes.push({
        timestamp: nextKeyframeTime,
        root: reconstructor.getRoot(),
      });

      nextKeyframeTime += this.keyframeIntervalMs;
    }
  }

  public getNearestKeyframe(timestamp: number): DomKeyframe | null {
    if (this.keyframes.length === 0) return null;

    let best: DomKeyframe | null = null;
    for (const kf of this.keyframes) {
      if (kf.timestamp <= timestamp) {
        best = kf;
      } else {
        break;
      }
    }

    return best || this.keyframes[0] || null;
  }

  public getKeyframes(): readonly DomKeyframe[] {
    return this.keyframes;
  }
}
