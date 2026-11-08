import { describe, expect, it } from "bun:test";
import {
  CYPRESS_VIEWPORT_PRESETS,
  CypressRelayPlugin,
} from "../src/cypress-plugin.js";

describe("TASK-183: Cypress Relay Plugin for Cross-Device Testing", () => {
  it("configures Cypress runner with mobile viewport preset and Relay baseUrl", () => {
    const rawConfig = {
      specPattern: "cypress/e2e/**/*.cy.ts",
      env: { FOO: "bar" },
    };

    const configured = CypressRelayPlugin.configure(rawConfig, {
      tunnelUrl: "https://my-app.relay.paddy.systems",
      viewportPreset: "pixel-7",
      interceptNetwork: true,
      throttleKbps: 512,
    });

    expect(configured.baseUrl).toBe("https://my-app.relay.paddy.systems");
    expect(configured.viewportWidth).toBe(
      CYPRESS_VIEWPORT_PRESETS["pixel-7"].viewportWidth,
    );
    expect(configured.viewportHeight).toBe(
      CYPRESS_VIEWPORT_PRESETS["pixel-7"].viewportHeight,
    );
    expect(configured.userAgent).toContain("Android 13; Pixel 7");

    const env = configured.env as Record<string, unknown>;
    expect(env.FOO).toBe("bar");
    expect(env.RELAY_TUNNEL_URL).toBe("https://my-app.relay.paddy.systems");
    expect(env.RELAY_THROTTLE_KBPS).toBe(512);
  });

  it("proxies relative request URLs to Relay tunnel with simulated latency", () => {
    const tunnelUrl = "https://checkout.relay.paddy.systems";

    const relativeReq = CypressRelayPlugin.interceptRequest(
      tunnelUrl,
      "/api/cart",
      { throttleKbps: 256 },
    );
    expect(relativeReq.proxiedUrl).toBe(
      "https://checkout.relay.paddy.systems/api/cart",
    );
    expect(relativeReq.simulatedLatencyMs).toBeGreaterThan(10);

    const absoluteReq = CypressRelayPlugin.interceptRequest(
      tunnelUrl,
      "https://external-auth.paddy.systems/oauth/token",
    );
    expect(absoluteReq.proxiedUrl).toBe(
      "https://external-auth.paddy.systems/oauth/token",
    );
    expect(absoluteReq.simulatedLatencyMs).toBe(5);
  });
});
