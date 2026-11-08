import type { ActiveSessionDetails } from "./types.js";

/**
 * Formats live mobile receiver telemetry and recent errors into structured prompt context for Cursor IDE AI.
 */
export class CursorAgentContextProvider {
  public formatPromptContext(
    session: ActiveSessionDetails | null,
    recentErrors: Array<{ message: string; stack?: string }> = [],
  ): string {
    if (!session) {
      return "<!-- Relay Context: No active mobile receiver session -->";
    }

    const receiversList = session.receivers
      .map(
        (r) =>
          `- ${r.name} (${r.category}, latency: ${r.latencyMs}ms, battery: ${r.batteryLevel ? Math.round(r.batteryLevel * 100) + "%" : "N/A"})`,
      )
      .join("\n");

    const errorsList =
      recentErrors.length > 0
        ? recentErrors
            .map((e) => `[Mobile Error] ${e.message}\n${e.stack || ""}`)
            .join("\n---\n")
        : "None (zero active receiver errors)";

    return `
<relay_session_context>
Active Port: ${session.localPort}
Session Code: ${session.shortCode}
Connected Physical Devices:
${receiversList || "- No devices paired"}

Recent Mobile Runtime Errors:
${errorsList}
</relay_session_context>
`.trim();
  }
}
