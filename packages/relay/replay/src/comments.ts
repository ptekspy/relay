/**
 * Session Comments & In-Context Feedback Manager
 *
 * Tracks spatial and temporal feedback pins tied to specific session timestamps,
 * normalized screen coordinates (x%, y%), and target DOM selectors.
 */

import type { SessionComment } from "@paddy-systems/relay-recording";

export interface CommentTimelineMarker {
  id: string;
  timestampMs: number;
  position: { xPercent: number; yPercent: number };
  authorName: string;
  preview: string;
  resolved: boolean;
  targetSelector?: string;
}

export class SessionCommentsManager {
  private comments: SessionComment[] = [];

  constructor(initialComments: SessionComment[] = []) {
    this.ingest(initialComments);
  }

  public ingest(comments: SessionComment[]): void {
    const existingIds = new Set(this.comments.map((c) => c.id));
    for (const c of comments) {
      if (!existingIds.has(c.id)) {
        this.comments.push({ ...c, resolved: c.resolved ?? false });
        existingIds.add(c.id);
      }
    }
    this.comments.sort((a, b) => a.timestampMs - b.timestampMs);
  }

  public addComment(
    comment: Omit<SessionComment, "id" | "createdAt">,
  ): SessionComment {
    const fullComment: SessionComment = {
      ...comment,
      id: `cmt_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: Date.now(),
      resolved: false,
    };
    this.comments.push(fullComment);
    this.comments.sort((a, b) => a.timestampMs - b.timestampMs);
    return fullComment;
  }

  public getComments(): SessionComment[] {
    return [...this.comments];
  }

  public getCommentById(id: string): SessionComment | undefined {
    return this.comments.find((c) => c.id === id);
  }

  public resolveComment(id: string, resolved = true): boolean {
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) return false;
    comment.resolved = resolved;
    return true;
  }

  /**
   * Archives a comment at a specific point on the timeline.
   * Before this timestamp, the comment remains visible during replay.
   * At and after this timestamp, the comment is hidden.
   */
  public archiveComment(id: string, archivedAtTimestampMs?: number): boolean {
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) return false;
    comment.archived = true;
    comment.archivedAtTimestampMs =
      archivedAtTimestampMs !== undefined ? archivedAtTimestampMs : Date.now();
    return true;
  }

  /**
   * Appends a threaded reply to an existing comment.
   */
  public addReply(
    commentId: string,
    reply: {
      author: { name: string; avatarUrl?: string; isHost?: boolean };
      content: string;
      createdAt?: number;
    },
  ): boolean {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return false;
    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push({
      id: `rpl_${Math.random().toString(36).slice(2, 10)}`,
      commentId,
      author: reply.author,
      content: reply.content,
      createdAt: reply.createdAt ?? Date.now(),
    });
    return true;
  }

  /**
   * Retrieves comments active around a given replay playhead timestamp.
   * By default, a comment remains active for 3 seconds after its timestamp.
   * If a comment was archived at a specific timeline timestamp, it is hidden
   * once the replay playhead reaches that archive point.
   */
  public getActiveCommentsAt(
    timestampMs: number,
    windowMs = 3000,
  ): SessionComment[] {
    return this.comments.filter((c) => {
      // Check if archived at a point prior to or equal to current playhead
      if (c.archived) {
        if (
          c.archivedAtTimestampMs !== null &&
          c.archivedAtTimestampMs !== undefined
        ) {
          if (timestampMs >= c.archivedAtTimestampMs) {
            return false;
          }
        } else {
          return false;
        }
      }

      return (
        timestampMs >= c.timestampMs && timestampMs <= c.timestampMs + windowMs
      );
    });
  }

  /**
   * Generates lightweight markers for rendering along the replay timeline scrubber.
   */
  public getTimelineMarkers(): CommentTimelineMarker[] {
    return this.comments.map((c) => ({
      id: c.id,
      timestampMs: c.timestampMs,
      position: c.position,
      authorName: c.author.name,
      preview:
        c.content.length > 40 ? `${c.content.slice(0, 37)}...` : c.content,
      resolved: c.resolved ?? false,
      targetSelector: c.targetSelector,
    }));
  }
}
