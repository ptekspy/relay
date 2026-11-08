import { describe, expect, it } from "bun:test";
import {
  ClipboardSyncManager,
  type ReceiverClipboardEnvironment,
} from "../src/clipboard-sync.js";

describe("TASK-136: Remote Clipboard Synchronization Protocol", () => {
  it("pushes text directly via clipboard.writeText when permitted", async () => {
    let written = "";
    const env: ReceiverClipboardEnvironment = {
      clipboard: {
        writeText: async (t: string) => {
          written = t;
        },
      },
    };

    const manager = new ClipboardSyncManager();
    const result = await manager.pushToReceiver(
      { text: "https://relay.zone/test", timestamp: Date.now() },
      env,
    );

    expect(result.success).toBe(true);
    expect(result.staged).toBe(false);
    expect(written).toBe("https://relay.zone/test");
  });

  it("falls back to staged buffer when clipboard writeText is blocked by browser security", async () => {
    const env: ReceiverClipboardEnvironment = {
      clipboard: {
        writeText: async () => {
          throw new Error("NotAllowedError: Document is not focused.");
        },
      },
    };

    const manager = new ClipboardSyncManager();
    const result = await manager.pushToReceiver(
      { text: "secret_api_key_12345", timestamp: Date.now() },
      env,
    );

    expect(result.success).toBe(true);
    expect(result.staged).toBe(true);

    const staged = manager.getStagedBuffer();
    expect(staged).not.toBeNull();
    expect(staged?.text).toBe("secret_api_key_12345");

    manager.clearStagedBuffer();
    expect(manager.getStagedBuffer()).toBeNull();
  });

  it("rejects invalid payloads and enforces maximum character limits", async () => {
    const manager = new ClipboardSyncManager();

    // Invalid payload
    const invalidResult = await manager.pushToReceiver(
      {} as unknown as { text: string; timestamp: number },
    );
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain("text must be a string");

    // Exceeding 1MB
    const hugeText = "a".repeat(1_000_001);
    const hugeResult = await manager.pushToReceiver({
      text: hugeText,
      timestamp: Date.now(),
    });
    expect(hugeResult.success).toBe(false);
    expect(hugeResult.error).toContain("exceeds max text length");
  });
});
