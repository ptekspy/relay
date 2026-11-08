/**
 * Remote Clipboard Synchronization Protocol
 *
 * Facilitates pushing copied strings, passwords, and URLs from desktop host
 * directly to the mobile receiver's clipboard buffer.
 *
 * Note for Octavia: This handles browser clipboard security permissions with staged UI fallback.
 */

export interface ClipboardPayload {
  text: string;
  format?: "text/plain" | "text/html";
  timestamp: number;
}

export interface ClipboardSyncResult {
  success: boolean;
  staged: boolean;
  textLength: number;
  format: string;
  error?: string;
}

export interface ReceiverClipboardEnvironment {
  clipboard?: {
    writeText: (text: string) => Promise<void>;
    readText?: () => Promise<string>;
  };
  document?: {
    execCommand?: (command: string) => boolean;
    createElement?: (tagName: string) => unknown;
    body?: {
      appendChild?: (child: unknown) => void;
      removeChild?: (child: unknown) => void;
    };
  };
}

export class ClipboardSyncManager {
  private static readonly MAX_TEXT_LENGTH = 1_000_000; // 1MB text limit
  private stagedBuffer: ClipboardPayload | null = null;

  public getStagedBuffer(): ClipboardPayload | null {
    return this.stagedBuffer ? { ...this.stagedBuffer } : null;
  }

  public clearStagedBuffer(): void {
    this.stagedBuffer = null;
  }

  public async pushToReceiver(
    payload: ClipboardPayload,
    env: ReceiverClipboardEnvironment = typeof window !== "undefined"
      ? (window as unknown as ReceiverClipboardEnvironment)
      : {},
  ): Promise<ClipboardSyncResult> {
    if (!payload || typeof payload.text !== "string") {
      return {
        success: false,
        staged: false,
        textLength: 0,
        format: "text/plain",
        error: "Invalid clipboard payload: text must be a string",
      };
    }

    if (payload.text.length > ClipboardSyncManager.MAX_TEXT_LENGTH) {
      return {
        success: false,
        staged: false,
        textLength: payload.text.length,
        format: payload.format || "text/plain",
        error: `Payload exceeds max text length of ${ClipboardSyncManager.MAX_TEXT_LENGTH} characters`,
      };
    }

    const format = payload.format || "text/plain";

    // Attempt direct navigator.clipboard API
    if (env.clipboard && typeof env.clipboard.writeText === "function") {
      try {
        await env.clipboard.writeText(payload.text);
        return {
          success: true,
          staged: false,
          textLength: payload.text.length,
          format,
        };
      } catch {
        // Fall through to staged buffer when browser blocks background clipboard access
      }
    }

    // Stage in memory buffer for user-triggered copy on the mobile HUD
    this.stagedBuffer = {
      text: payload.text,
      format,
      timestamp: Date.now(),
    };

    return {
      success: true,
      staged: true,
      textLength: payload.text.length,
      format,
    };
  }
}
