/**
 * Cypress Relay Plugin for Cross-Device Testing
 *
 * Configures Cypress test runner to proxy requests through Relay tunnels,
 * emulating physical device user agents, viewports, and network interception.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/cypress.
 */

export interface CypressRelayConfig {
  tunnelUrl: string;
  viewportPreset?: "iphone-x" | "iphone-14" | "pixel-7" | "ipad-2";
  interceptNetwork?: boolean;
  throttleKbps?: number;
}

export interface CypressViewportDimensions {
  viewportWidth: number;
  viewportHeight: number;
  userAgent: string;
}

export const CYPRESS_VIEWPORT_PRESETS: Record<
  NonNullable<CypressRelayConfig["viewportPreset"]>,
  CypressViewportDimensions
> = {
  "iphone-x": {
    viewportWidth: 375,
    viewportHeight: 812,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  },
  "iphone-14": {
    viewportWidth: 390,
    viewportHeight: 844,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  },
  "pixel-7": {
    viewportWidth: 412,
    viewportHeight: 915,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  },
  "ipad-2": {
    viewportWidth: 768,
    viewportHeight: 1024,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  },
};

export class CypressRelayPlugin {
  public defaultPreset: NonNullable<CypressRelayConfig["viewportPreset"]>;

  constructor(
    defaultPreset: NonNullable<
      CypressRelayConfig["viewportPreset"]
    > = "iphone-14",
  ) {
    this.defaultPreset = defaultPreset;
  }

  public configure(
    baseConfig: Record<string, unknown>,
    relayConfig: CypressRelayConfig,
  ): Record<string, unknown> {
    return CypressRelayPlugin.configure(baseConfig, {
      viewportPreset: this.defaultPreset,
      ...relayConfig,
    });
  }

  public static configure(
    baseConfig: Record<string, unknown>,
    relayConfig: CypressRelayConfig,
  ): Record<string, unknown> {
    const preset = relayConfig.viewportPreset ?? "iphone-14";
    const dimensions = CYPRESS_VIEWPORT_PRESETS[preset];

    return {
      ...baseConfig,
      baseUrl: relayConfig.tunnelUrl,
      viewportWidth: dimensions.viewportWidth,
      viewportHeight: dimensions.viewportHeight,
      userAgent: dimensions.userAgent,
      env: {
        ...(typeof baseConfig.env === "object" && baseConfig.env !== null
          ? baseConfig.env
          : {}),
        RELAY_TUNNEL_URL: relayConfig.tunnelUrl,
        RELAY_INTERCEPT_NETWORK: relayConfig.interceptNetwork ?? true,
        RELAY_THROTTLE_KBPS: relayConfig.throttleKbps ?? 0,
      },
    };
  }

  public static interceptRequest(
    tunnelUrl: string,
    reqUrl: string,
    options?: { throttleKbps?: number },
  ): { proxiedUrl: string; simulatedLatencyMs: number } {
    const isRelative =
      !reqUrl.startsWith("http://") && !reqUrl.startsWith("https://");
    const proxiedUrl = isRelative
      ? `${tunnelUrl.replace(/\/$/, "")}/${reqUrl.replace(/^\//, "")}`
      : reqUrl;

    const simulatedLatencyMs =
      options?.throttleKbps && options.throttleKbps > 0
        ? Math.round((1024 / options.throttleKbps) * 50)
        : 5;

    return { proxiedUrl, simulatedLatencyMs };
  }
}
