import type { RecordedEvent } from "./types.js";

export class SessionExporter {
  public generateGitHubIssueMarkdown(
    sessionId: string,
    timestampMs: number,
    events: RecordedEvent[],
  ): string {
    const errorLogs: string[] = [];
    const failedRequests: string[] = [];

    for (const e of events) {
      if (e.timestampMs > timestampMs) continue;
      if (e.type === "console" && e.payload.level === "error") {
        errorLogs.push(`[${e.timestampMs}ms] ${e.payload.args.join(" ")}`);
      } else if (e.type === "network" && e.payload.status >= 400) {
        failedRequests.push(
          `[${e.timestampMs}ms] ${e.payload.method} ${e.payload.url} -> HTTP ${e.payload.status}`,
        );
      }
    }

    return [
      `### Relay Session Bug Report (${sessionId})`,
      "",
      `**Replay Timestamp**: [Jump to ${timestampMs}ms](https://relay.cloud/replay/${sessionId}?t=${timestampMs})`,
      "",
      "#### Console Errors",
      errorLogs.length > 0
        ? `\`\`\`\n${errorLogs.join("\n")}\n\`\`\``
        : "_No console errors recorded._",
      "",
      "#### Failed Network Requests",
      failedRequests.length > 0
        ? `\`\`\`\n${failedRequests.join("\n")}\n\`\`\``
        : "_No failed network requests._",
      "",
      "> Generated automatically by Paddy Systems Relay Recording Engine",
    ].join("\n");
  }

  public exportHarJson(sessionId: string, events: RecordedEvent[]): string {
    const entries = [];

    for (const e of events) {
      if (e.type !== "network") continue;
      const p = e.payload;
      entries.push({
        startedDateTime: new Date(
          Date.now() - (100000 - e.timestampMs),
        ).toISOString(),
        time: p.durationMs,
        request: {
          method: p.method,
          url: p.url,
          httpVersion: "HTTP/1.1",
          headers: Object.entries(p.requestHeaders ?? {}).map(
            ([name, value]) => ({ name, value }),
          ),
          queryString: [],
          bodySize: p.requestBody ? p.requestBody.length : 0,
        },
        response: {
          status: p.status,
          statusText: p.status === 200 ? "OK" : "Error",
          httpVersion: "HTTP/1.1",
          headers: Object.entries(p.responseHeaders ?? {}).map(
            ([name, value]) => ({ name, value }),
          ),
          content: {
            size: p.responseBody ? p.responseBody.length : 0,
            mimeType: "application/json",
            text: p.responseBody ?? "",
          },
          bodySize: p.responseBody ? p.responseBody.length : 0,
        },
      });
    }

    return JSON.stringify(
      {
        log: {
          version: "1.2",
          creator: { name: "Paddy Systems Relay", version: "1.0.0" },
          comment: `Session: ${sessionId}`,
          entries,
        },
      },
      null,
      2,
    );
  }
}
