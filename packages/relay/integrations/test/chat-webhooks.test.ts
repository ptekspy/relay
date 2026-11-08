import { describe, expect, it } from "bun:test";
import {
  type ChatNotificationEvent,
  ChatWebhookNotifier,
  formatDiscordEmbed,
  formatSlackBlockKit,
} from "../src/chat-webhooks.js";

describe("TASK-176: Slack & Discord Webhook Notification Broadcasts", () => {
  const sampleEvent: ChatNotificationEvent = {
    event: "session:started",
    sessionId: "sess_xyz_456",
    actorName: "Octavia",
    project: "relay-cloud",
    details: {
      branch: "feat/screen-stream",
      viewerUrl: "https://relay.paddy.systems/view/sess_xyz_456",
    },
    timestamp: 1720000000000,
  };

  it("formats Slack Block Kit with interactive action button", () => {
    const slackPayload = formatSlackBlockKit(sampleEvent);
    expect(slackPayload.blocks.length).toBe(3);

    const section = slackPayload.blocks[0] as { text: { text: string } };
    expect(section.text.text).toContain("Octavia");
    expect(section.text.text).toContain("relay-cloud");

    const actions = slackPayload.blocks[2] as {
      elements: Array<{ url: string; text: { text: string } }>;
    };
    expect(actions.elements[0]?.url).toBe(
      "https://relay.paddy.systems/view/sess_xyz_456",
    );
    expect(actions.elements[0]?.text.text).toBe("Join / Inspect in Relay");
  });

  it("formats Discord Embed with cyan color and branch metadata", () => {
    const discordPayload = formatDiscordEmbed(sampleEvent);
    expect(discordPayload.embeds.length).toBe(1);

    const embed = discordPayload.embeds[0] as {
      title: string;
      color: number;
      fields: Array<{ name: string; value: string }>;
    };
    expect(embed.title).toContain("Session Started");
    expect(embed.color).toBe(0x00e5ff); // Cyan
    expect(
      embed.fields.some((f) => f.value.includes("feat/screen-stream")),
    ).toBe(true);
  });

  it("dispatches webhooks to external endpoints via ChatWebhookNotifier", async () => {
    let sentSlackBody = "";
    const slackSuccess = await ChatWebhookNotifier.sendSlack(
      "https://hooks.slack.com/services/T00/B00/X00",
      sampleEvent,
      async (_url, body) => {
        sentSlackBody = body;
        return { status: 200 };
      },
    );
    expect(slackSuccess).toBe(true);
    expect(sentSlackBody).toContain("sess_xyz_456");

    let sentDiscordBody = "";
    const discordSuccess = await ChatWebhookNotifier.sendDiscord(
      "https://discord.com/api/webhooks/123/abc",
      {
        ...sampleEvent,
        event: "bug:flagged",
        details: {
          bugTitle: "Broken flexbox on foldables",
          viewerUrl: "https://relay.paddy.systems/view/sess_xyz_456",
        },
      },
      async (_url, body) => {
        sentDiscordBody = body;
        return { status: 204 };
      },
    );
    expect(discordSuccess).toBe(true);
    expect(sentDiscordBody).toContain("Broken flexbox on foldables");
  });
});
