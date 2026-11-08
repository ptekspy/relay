import { SensitiveDataRedactor } from "./redactor.js";
import type {
  BookmarkMarkerPayload,
  ConsoleEventPayload,
  DomMutationPayload,
  NetworkEventPayload,
  RecordedEvent,
} from "./types.js";

export class EventSerializer {
  private readonly redactor: SensitiveDataRedactor;
  private readonly startTimeMs: number;

  constructor(
    startTimeMs = Date.now(),
    redactor = new SensitiveDataRedactor(),
  ) {
    this.startTimeMs = startTimeMs;
    this.redactor = redactor;
  }

  public get elapsedMs(): number {
    return Math.max(0, Date.now() - this.startTimeMs);
  }

  public serializeDomSnapshot(html: string, url: string): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "dom_snapshot",
      payload: {
        html: this.redactor.redactDomHtml(html),
        url,
      },
    };
  }

  public serializeDomMutation(mutation: DomMutationPayload): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "dom_mutation",
      payload: {
        ...mutation,
        newValue: mutation.newValue
          ? this.redactor.redactText(mutation.newValue)
          : undefined,
      },
    };
  }

  public serializeConsole(
    level: ConsoleEventPayload["level"],
    args: string[],
  ): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "console",
      payload: {
        level,
        args: args.map((a) => this.redactor.redactText(a)),
      },
    };
  }

  public serializeNetwork(req: NetworkEventPayload): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "network",
      payload: {
        url: req.url,
        method: req.method,
        status: req.status,
        durationMs: req.durationMs,
        requestHeaders: req.requestHeaders
          ? this.redactor.redactHeaders(req.requestHeaders)
          : undefined,
        responseHeaders: req.responseHeaders
          ? this.redactor.redactHeaders(req.responseHeaders)
          : undefined,
        requestBody: req.requestBody
          ? this.redactor.redactText(req.requestBody)
          : undefined,
        responseBody: req.responseBody
          ? this.redactor.redactText(req.responseBody)
          : undefined,
      },
    };
  }

  public serializeViewport(
    width: number,
    height: number,
    dpr = 1,
  ): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "viewport",
      payload: { width, height, dpr },
    };
  }

  public serializeBookmark(marker: BookmarkMarkerPayload): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "bookmark_marker",
      payload: {
        label: marker.label,
        category: marker.category,
        note: marker.note ? this.redactor.redactText(marker.note) : undefined,
      },
    };
  }

  public serializeUserInteraction(
    interaction: import("./types.js").UserInteractionPayload,
  ): RecordedEvent {
    return {
      timestampMs: this.elapsedMs,
      type: "user_interaction",
      payload: {
        ...interaction,
        value: interaction.value
          ? this.redactor.redactText(interaction.value)
          : undefined,
      },
    };
  }

  public serializeComment(
    comment: import("./types.js").SessionComment,
  ): RecordedEvent {
    return {
      timestampMs: comment.timestampMs,
      type: "session_comment",
      payload: {
        ...comment,
        content: this.redactor.redactText(comment.content),
      },
    };
  }
}
