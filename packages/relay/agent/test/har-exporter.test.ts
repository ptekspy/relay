import { describe, expect, it } from "bun:test";
import type { NetworkTelemetryEvent } from "@paddy-systems/relay-protocol";
import { HarExporter } from "../src/har-exporter.js";

describe("TASK-145: Network Payload HAR 1.2 Exporter", () => {
  it("formats network events into valid HAR 1.2 JSON structure", () => {
    const events: NetworkTelemetryEvent[] = [
      {
        kind: "network",
        method: "GET",
        url: "https://api.example.com/v1/users?page=2&limit=50",
        status: 200,
        durationMs: 145,
        sizeBytes: 4096,
        timestamp: 1726200000000,
      },
      {
        kind: "network",
        method: "POST",
        url: "https://api.example.com/v1/analytics",
        status: 204,
        durationMs: 50,
        timestamp: 1726200001000,
      },
      {
        kind: "network",
        method: "GET",
        url: "https://api.example.com/v1/missing",
        status: 404,
        durationMs: 32,
        timestamp: 1726200002000,
      },
    ];

    const har = HarExporter.exportHar(events);

    expect(har.log.version).toBe("1.2");
    expect(har.log.creator.name).toBe("Paddy Systems Relay");
    expect(har.log.entries.length).toBe(3);

    const first = har.log.entries[0];
    expect(first?.request.method).toBe("GET");
    expect(first?.request.url).toBe(
      "https://api.example.com/v1/users?page=2&limit=50",
    );
    expect(first?.request.queryString).toEqual([
      { name: "page", value: "2" },
      { name: "limit", value: "50" },
    ]);
    expect(first?.response.status).toBe(200);
    expect(first?.response.statusText).toBe("OK");
    expect(first?.response.content.size).toBe(4096);
    expect(first?.timings.wait).toBe(145);

    const second = har.log.entries[1];
    expect(second?.response.status).toBe(204);
    expect(second?.response.statusText).toBe("No Content");

    const third = har.log.entries[2];
    expect(third?.response.status).toBe(404);
    expect(third?.response.statusText).toBe("Not Found");

    // Ensure valid JSON export
    const jsonStr = HarExporter.exportHarJson(events);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.log.version).toBe("1.2");
  });
});
