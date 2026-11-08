import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { RelayGateway } from "../../../apps/relay/cli/src/gateway.js";
import { RELAY_COOKIE_NAME } from "../../../apps/relay/cli/src/gateway.js";
import {
  createMockDevServer,
  type MockTargetServer,
  spawnTestGateway,
} from "./harness";

describe("Journey 09: Target Server Outage / Crash Fallback (502 Target Unavailable)", () => {
  let targetServer: MockTargetServer;
  let gateway: RelayGateway;
  const sessionToken = "session-crash-recovery-token";

  beforeEach(async () => {
    targetServer = await createMockDevServer();
    gateway = await spawnTestGateway(targetServer.port, sessionToken);
  });

  afterEach(async () => {
    await gateway.close();
  });

  it("serves an actionable 502 Bad Gateway page when target dev server crashes mid-session", async () => {
    const gatewayUrl = `http://127.0.0.1:${gateway.port}`;

    // 1. Initial healthy state check
    const healthyRes = await fetch(gatewayUrl, {
      headers: {
        cookie: `${RELAY_COOKIE_NAME}=${sessionToken}`,
      },
    });
    expect(healthyRes.status).toBe(200);

    // 2. Simulate dev server crash / abrupt shutdown
    await targetServer.close();

    // 3. Request gateway again with active session
    const crashRes = await fetch(gatewayUrl, {
      headers: {
        cookie: `${RELAY_COOKIE_NAME}=${sessionToken}`,
      },
    });

    // 4. Verify 502 Bad Gateway response with custom fallback page
    expect(crashRes.status).toBe(502);
    expect(crashRes.headers.get("content-type")).toContain("text/html");
    expect(crashRes.headers.get("cache-control")).toBe("no-store");

    const htmlBody = await crashRes.text();
    expect(htmlBody).toContain("Relay Target Unavailable");
    expect(htmlBody).toContain("Service Unavailable");
    expect(htmlBody).toContain(
      `port <code>${targetServer.port}</code> is not responding`,
    );
  });
});
