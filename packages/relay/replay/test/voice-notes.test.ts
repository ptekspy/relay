import { describe, expect, it } from "bun:test";
import { VoiceNoteTimelineManager } from "../src/voice-notes.js";

describe("TASK-178: Audio Commentary & Voice Note Attachment in Replays", () => {
  it("adds and orders voice notes chronologically along the timeline", () => {
    const manager = new VoiceNoteTimelineManager();

    manager.addVoiceNote({
      author: "Sally",
      startTimelineMs: 25000,
      durationMs: 5000,
      audioUrl: "https://r2.relay.paddy.systems/audio/note2.webm",
      mimeType: "audio/webm",
      transcription:
        "Notice how the modal backdrop doesn't capture clicks here.",
    });

    manager.addVoiceNote({
      author: "Octavia",
      startTimelineMs: 5000,
      durationMs: 8000,
      audioUrl: "https://r2.relay.paddy.systems/audio/note1.webm",
      mimeType: "audio/webm",
      transcription: "Initial render looks crisp on mobile viewport.",
    });

    const notes = manager.getAllNotes();
    expect(notes.length).toBe(2);
    // Verified chronological sorting
    expect(notes[0]?.author).toBe("Octavia");
    expect(notes[0]?.startTimelineMs).toBe(5000);
    expect(notes[1]?.author).toBe("Sally");
    expect(notes[1]?.startTimelineMs).toBe(25000);
  });

  it("finds active note matching current scrubber playhead position", () => {
    const manager = new VoiceNoteTimelineManager();

    manager.addVoiceNote({
      author: "QA Tester",
      startTimelineMs: 10000,
      durationMs: 4000, // 10000 to 14000
      audioUrl: "data:audio/wav;base64,UklGRi...",
      mimeType: "audio/wav",
    });

    expect(manager.getActiveNoteAt(9999)).toBeNull();
    expect(manager.getActiveNoteAt(10000)?.author).toBe("QA Tester");
    expect(manager.getActiveNoteAt(12500)?.author).toBe("QA Tester");
    expect(manager.getActiveNoteAt(14000)?.author).toBe("QA Tester");
    expect(manager.getActiveNoteAt(14001)).toBeNull();
  });

  it("serializes and deserializes timeline voice tracks without data loss", () => {
    const manager = new VoiceNoteTimelineManager();
    manager.addVoiceNote({
      author: "Dev",
      startTimelineMs: 3000,
      durationMs: 2000,
      audioUrl: "https://relay.paddy.systems/audio/test.webm",
      mimeType: "audio/webm",
    });

    const json = manager.serialize();
    const manager2 = new VoiceNoteTimelineManager();
    manager2.deserialize(json);

    expect(manager2.getAllNotes().length).toBe(1);
    expect(manager2.getAllNotes()[0]?.author).toBe("Dev");
    expect(manager2.getAllNotes()[0]?.durationMs).toBe(2000);
  });
});
