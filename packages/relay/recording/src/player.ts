import type {
  BookmarkMarkerPayload,
  ConsoleEventPayload,
  NetworkEventPayload,
  RecordedEvent,
} from "./types.js";

export type PlaybackState = "idle" | "playing" | "paused" | "ended";

export interface ReplayStateSnapshot {
  currentTimeMs: number;
  durationMs: number;
  playbackState: PlaybackState;
  speed: number;
  currentDomHtml: string;
  activeConsoleLogs: { timestampMs: number; payload: ConsoleEventPayload }[];
  activeNetworkRequests: {
    timestampMs: number;
    payload: NetworkEventPayload;
  }[];
  markers: { timestampMs: number; payload: BookmarkMarkerPayload }[];
}

export class ReplayPlayer {
  private events: RecordedEvent[] = [];
  private currentTime = 0;
  private duration = 0;
  private state: PlaybackState = "idle";
  private playbackSpeed = 1;

  constructor(events: RecordedEvent[] = []) {
    this.loadEvents(events);
  }

  public loadEvents(events: RecordedEvent[]): void {
    // Sort deterministically by timestamp
    this.events = [...events].sort((a, b) => a.timestampMs - b.timestampMs);
    this.currentTime = 0;
    this.duration =
      this.events.length > 0
        ? (this.events[this.events.length - 1]?.timestampMs ?? 0)
        : 0;
    this.state = "paused";
  }

  public setSpeed(speed: number): void {
    if (speed <= 0) throw new Error("Playback speed must be positive");
    this.playbackSpeed = speed;
  }

  public get speed(): number {
    return this.playbackSpeed;
  }

  public seekTo(timestampMs: number): void {
    this.currentTime = Math.max(0, Math.min(timestampMs, this.duration));
    if (this.currentTime >= this.duration) {
      this.state = "ended";
    }
  }

  public play(): void {
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }
    this.state = "playing";
  }

  public pause(): void {
    this.state = "paused";
  }

  public getSnapshot(): ReplayStateSnapshot {
    let latestDom = "";
    const logs: { timestampMs: number; payload: ConsoleEventPayload }[] = [];
    const requests: { timestampMs: number; payload: NetworkEventPayload }[] =
      [];
    const markers: { timestampMs: number; payload: BookmarkMarkerPayload }[] =
      [];

    for (const ev of this.events) {
      if (ev.timestampMs > this.currentTime) break;

      if (ev.type === "dom_snapshot") {
        latestDom = ev.payload.html;
      } else if (ev.type === "console") {
        logs.push({ timestampMs: ev.timestampMs, payload: ev.payload });
      } else if (ev.type === "network") {
        requests.push({ timestampMs: ev.timestampMs, payload: ev.payload });
      } else if (ev.type === "bookmark_marker") {
        markers.push({ timestampMs: ev.timestampMs, payload: ev.payload });
      }
    }

    return {
      currentTimeMs: this.currentTime,
      durationMs: this.duration,
      playbackState: this.state,
      speed: this.playbackSpeed,
      currentDomHtml: latestDom,
      activeConsoleLogs: logs,
      activeNetworkRequests: requests,
      markers,
    };
  }
}
