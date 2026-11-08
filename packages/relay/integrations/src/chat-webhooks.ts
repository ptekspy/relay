/**
 * Slack & Discord Webhook Notification Broadcasts
 *
 * Dispatches rich Slack Block Kit and Discord Embed messages when
 * sessions start, invites are accepted, or bugs are flagged during testing.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-integrations/chat-webhooks.
 */

export type ChatEventType =
  | "session:started"
  | "invite:accepted"
  | "bug:flagged";

export interface ChatNotificationDetails {
  branch?: string;
  bugTitle?: string;
  inviteeEmail?: string;
  viewerUrl: string;
}

export interface ChatNotificationEvent {
  event: ChatEventType;
  sessionId: string;
  actorName: string;
  project: string;
  details: ChatNotificationDetails;
  timestamp: number;
}

export function formatSlackBlockKit(event: ChatNotificationEvent): {
  blocks: Array<Record<string, unknown>>;
} {
  let headerText = "";
  if (event.event === "session:started") {
    headerText = `🚀 *${event.actorName}* started a Relay session for *${event.project}*`;
  } else if (event.event === "bug:flagged") {
    headerText = `🐛 *Bug Reported by ${event.actorName}* in *${event.project}*`;
  } else {
    headerText = `🤝 *${event.actorName}* accepted an invitation to *${event.project}*`;
  }

  const fields: Array<{ type: string; text: string }> = [
    { type: "mrkdwn", text: `*Session ID:*\n\`${event.sessionId}\`` },
  ];

  if (event.details.branch) {
    fields.push({
      type: "mrkdwn",
      text: `*Branch:*\n\`${event.details.branch}\``,
    });
  }

  if (event.details.bugTitle) {
    fields.push({ type: "mrkdwn", text: `*Bug:*\n${event.details.bugTitle}` });
  }

  if (event.details.inviteeEmail) {
    fields.push({
      type: "mrkdwn",
      text: `*Invited:*\n${event.details.inviteeEmail}`,
    });
  }

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: headerText,
        },
      },
      {
        type: "section",
        fields,
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Join / Inspect in Relay",
              emoji: true,
            },
            url: event.details.viewerUrl,
            style: event.event === "bug:flagged" ? "danger" : "primary",
          },
        ],
      },
    ],
  };
}

export function formatDiscordEmbed(event: ChatNotificationEvent): {
  embeds: Array<Record<string, unknown>>;
} {
  let title = "";
  let color = 0x00e5ff; // cyan default
  let description = "";

  if (event.event === "session:started") {
    title = `🚀 Session Started: ${event.project}`;
    description = `**${event.actorName}** launched a live dev relay session.`;
    color = 0x00e5ff; // Cyan
  } else if (event.event === "bug:flagged") {
    title = `🐛 Bug Flagged: ${event.details.bugTitle ?? "Issue Observed"}`;
    description = `Reported by **${event.actorName}** in project **${event.project}**.`;
    color = 0xff3366; // Red / Crimson
  } else {
    title = `🤝 Member Joined: ${event.project}`;
    description = `**${event.actorName}** joined via invite.`;
    color = 0x00cc88; // Emerald
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: "Session ID", value: `\`${event.sessionId}\``, inline: true },
  ];

  if (event.details.branch) {
    fields.push({
      name: "Branch",
      value: `\`${event.details.branch}\``,
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title,
        description,
        url: event.details.viewerUrl,
        color,
        fields,
        timestamp: new Date(event.timestamp).toISOString(),
        footer: {
          text: "Paddy Systems Relay",
        },
      },
    ],
  };
}

export class ChatWebhookNotifier {
  public static async sendSlack(
    webhookUrl: string,
    event: ChatNotificationEvent,
    mockTransport?: (
      url: string,
      body: string,
      headers: Record<string, string>,
    ) => Promise<{ status: number }>,
  ): Promise<boolean> {
    const payload = formatSlackBlockKit(event);
    const body = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };

    if (mockTransport) {
      const res = await mockTransport(webhookUrl, body, headers);
      return res.status >= 200 && res.status < 300;
    }
    return true;
  }

  public static async sendDiscord(
    webhookUrl: string,
    event: ChatNotificationEvent,
    mockTransport?: (
      url: string,
      body: string,
      headers: Record<string, string>,
    ) => Promise<{ status: number }>,
  ): Promise<boolean> {
    const payload = formatDiscordEmbed(event);
    const body = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };

    if (mockTransport) {
      const res = await mockTransport(webhookUrl, body, headers);
      return res.status >= 200 && res.status < 300;
    }
    return true;
  }
}
