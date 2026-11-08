import type { SessionId } from "@paddy-systems/relay-protocol";

export type SignalingMessageType = "offer" | "answer" | "ice_candidate";

export interface SignalingMessage {
  id: string;
  sessionId: SessionId;
  from: string;
  to: string;
  type: SignalingMessageType;
  payload: string; // Serialized SDP or ICE candidate string
  timestamp: number;
}

export class WebRtcSignalingHub {
  // sessionId -> recipientId -> messages[]
  private messageQueues = new Map<string, SignalingMessage[]>();

  public postMessage(
    message: Omit<SignalingMessage, "id" | "timestamp">,
  ): SignalingMessage {
    const fullMessage: SignalingMessage = {
      ...message,
      id: `sig_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };

    const key = `${message.sessionId}:${message.to}`;
    const queue = this.messageQueues.get(key) ?? [];
    queue.push(fullMessage);
    // Retain only last 50 messages per recipient
    if (queue.length > 50) {
      queue.shift();
    }
    this.messageQueues.set(key, queue);

    return fullMessage;
  }

  public consumeMessages(
    sessionId: SessionId,
    recipientId: string,
  ): SignalingMessage[] {
    const key = `${sessionId}:${recipientId}`;
    const messages = this.messageQueues.get(key) ?? [];
    this.messageQueues.delete(key);
    return messages;
  }

  public clearSession(sessionId: SessionId): void {
    for (const key of Array.from(this.messageQueues.keys())) {
      if (key.startsWith(`${sessionId}:`)) {
        this.messageQueues.delete(key);
      }
    }
  }
}

export const defaultSignalingHub = new WebRtcSignalingHub();
