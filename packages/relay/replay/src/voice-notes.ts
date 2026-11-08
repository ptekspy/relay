/**
 * Audio Commentary & Voice Note Attachment in Replays
 *
 * Synchronizes voice notes and audio commentary with the replay timeline scrubber,
 * enabling developers and QA testers to record verbal explanations linked to exact playhead timestamps.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-replay/voice-notes.
 */

export interface VoiceNoteTrack {
  id: string;
  author: string;
  startTimelineMs: number;
  durationMs: number;
  audioUrl: string; // Blob URL, R2 URL, or base64 data URI
  mimeType: "audio/webm" | "audio/mp4" | "audio/wav";
  transcription?: string;
  createdAt: number;
}

export class VoiceNoteTimelineManager {
  private notes: VoiceNoteTrack[] = [];

  public addVoiceNote(
    note: Omit<VoiceNoteTrack, "id" | "createdAt">,
  ): VoiceNoteTrack {
    const fullNote: VoiceNoteTrack = {
      ...note,
      id: `vn_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: Date.now(),
    };
    this.notes.push(fullNote);
    this.notes.sort((a, b) => a.startTimelineMs - b.startTimelineMs);
    return fullNote;
  }

  public removeVoiceNote(id: string): boolean {
    const initialLen = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    return this.notes.length < initialLen;
  }

  public getAllNotes(): VoiceNoteTrack[] {
    return [...this.notes];
  }

  public getActiveNoteAt(timelineMs: number): VoiceNoteTrack | null {
    for (const note of this.notes) {
      if (
        timelineMs >= note.startTimelineMs &&
        timelineMs <= note.startTimelineMs + note.durationMs
      ) {
        return note;
      }
    }
    return null;
  }

  public getNotesInRange(startMs: number, endMs: number): VoiceNoteTrack[] {
    return this.notes.filter((note) => {
      const noteEnd = note.startTimelineMs + note.durationMs;
      return note.startTimelineMs <= endMs && noteEnd >= startMs;
    });
  }

  public serialize(): string {
    return JSON.stringify(this.notes);
  }

  public deserialize(json: string): void {
    try {
      const parsed = JSON.parse(json) as VoiceNoteTrack[];
      if (Array.isArray(parsed)) {
        this.notes = parsed;
        this.notes.sort((a, b) => a.startTimelineMs - b.startTimelineMs);
      }
    } catch {
      // Ignore malformed JSON
    }
  }
}
