import type { SecurityAuditEvent } from "./types.js";

export class CryptographicMerkleAuditVault {
  private events: SecurityAuditEvent[] = [];
  private lastHash = "0".repeat(64);

  private hashString(str: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    return hex.padStart(64, "0");
  }

  public recordEvent(
    event: Omit<SecurityAuditEvent, "previousHash" | "eventHash">,
  ): SecurityAuditEvent {
    const rawContent = `${event.id}:${event.timestamp}:${event.actorId}:${event.action}:${event.targetResource}:${this.lastHash}`;
    const eventHash = this.hashString(rawContent);

    const fullEvent: SecurityAuditEvent = {
      ...event,
      previousHash: this.lastHash,
      eventHash,
    };

    this.events.push(fullEvent);
    this.lastHash = eventHash;
    return fullEvent;
  }

  public verifyChainIntegrity(): boolean {
    let currentExpectedPrev = "0".repeat(64);

    for (const evt of this.events) {
      if (evt.previousHash !== currentExpectedPrev) {
        return false;
      }

      const raw = `${evt.id}:${evt.timestamp}:${evt.actorId}:${evt.action}:${evt.targetResource}:${evt.previousHash}`;
      const recomputed = this.hashString(raw);
      if (evt.eventHash !== recomputed) {
        return false;
      }

      currentExpectedPrev = evt.eventHash;
    }

    return true;
  }

  public getRootHash(): string {
    return this.lastHash;
  }

  public getEventsCount(): number {
    return this.events.length;
  }
}

export const cryptographicMerkleAuditVault =
  new CryptographicMerkleAuditVault();
