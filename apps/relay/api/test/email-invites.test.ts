import { describe, expect, it } from "bun:test";
import { EmailInviteService } from "../src/auth/email-invites.js";

describe("TASK-161: Email Invitation Delivery Service (Resend / AWS SES)", () => {
  it("renders branded responsive HTML invitation email", () => {
    const expiresAt = Date.now() + 3600 * 1000;
    const html = EmailInviteService.renderHtmlTemplate({
      recipientEmail: "octavia@paddy.systems",
      inviterName: "Sally Smith",
      sessionName: "p-s-core/main-branch-preview",
      joinUrl: "https://relay.paddy.systems/join/tok-9988",
      expiresAt,
    });

    expect(html).toContain("Sally Smith");
    expect(html).toContain("p-s-core/main-branch-preview");
    expect(html).toContain("https://relay.paddy.systems/join/tok-9988");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("viewport");
  });

  it("dispatches invitation email in under 5 seconds", async () => {
    const service = new EmailInviteService();
    const startTime = performance.now();

    const result = await service.sendInvite({
      recipientEmail: "dev@company.com",
      inviterName: "Alice",
      sessionName: "frontend-v2",
      joinUrl: "https://relay.paddy.systems/join/tok-123",
      expiresAt: Date.now() + 7200 * 1000,
    });

    const elapsedMs = performance.now() - startTime;

    expect(result.status).toBe("sent");
    expect(result.recipient).toBe("dev@company.com");
    expect(result.messageId.startsWith("msg_")).toBe(true);
    expect(elapsedMs).toBeLessThan(5000); // Delivered in < 5 seconds
  });
});
