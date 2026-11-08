export type RecordingEventType =
  | "dom_snapshot"
  | "dom_mutation"
  | "console"
  | "network"
  | "viewport"
  | "bookmark_marker"
  | "user_interaction"
  | "session_comment";

export interface BaseRecordedEvent<TType extends RecordingEventType, TPayload> {
  timestampMs: number;
  type: TType;
  payload: TPayload;
}

export interface DomSnapshotPayload {
  html: string;
  url: string;
}

export interface DomMutationPayload {
  targetSelector: string;
  mutationType: "childList" | "attributes" | "characterData";
  attributeName?: string;
  newValue?: string;
}

export interface ConsoleEventPayload {
  level: "log" | "info" | "warn" | "error";
  args: string[];
}

export interface NetworkEventPayload {
  url: string;
  method: string;
  status: number;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

export interface ViewportPayload {
  width: number;
  height: number;
  dpr: number;
}

export interface BookmarkMarkerPayload {
  label: string;
  category: "error" | "user_note" | "network_failure";
  note?: string;
}

export interface UserInteractionPayload {
  action: "click" | "tap" | "input" | "scroll";
  x: number;
  y: number;
  xPercent: number;
  yPercent: number;
  targetSelector?: string;
  value?: string;
}

export interface CommentReply {
  id: string;
  commentId: string;
  author: {
    name: string;
    avatarUrl?: string;
    isHost?: boolean;
  };
  content: string;
  createdAt: number;
}

export interface SessionComment {
  id: string;
  sessionId: string;
  timestampMs: number;
  position: {
    xPercent: number;
    yPercent: number;
  };
  targetSelector?: string;
  routeUrl?: string;
  viewport?: ViewportPayload;
  author: {
    name: string;
    avatarUrl?: string;
    isHost?: boolean;
  };
  content: string;
  replies?: CommentReply[];
  resolved?: boolean;
  archived?: boolean;
  archivedAtTimestampMs?: number | null;
  createdAt: number;
}

export type RecordedEvent =
  | BaseRecordedEvent<"dom_snapshot", DomSnapshotPayload>
  | BaseRecordedEvent<"dom_mutation", DomMutationPayload>
  | BaseRecordedEvent<"console", ConsoleEventPayload>
  | BaseRecordedEvent<"network", NetworkEventPayload>
  | BaseRecordedEvent<"viewport", ViewportPayload>
  | BaseRecordedEvent<"bookmark_marker", BookmarkMarkerPayload>
  | BaseRecordedEvent<"user_interaction", UserInteractionPayload>
  | BaseRecordedEvent<"session_comment", SessionComment>;

export interface RecordingMetadata {
  sessionId: string;
  startedAt: number;
  durationMs: number;
  eventCount: number;
  viewport: ViewportPayload;
}
