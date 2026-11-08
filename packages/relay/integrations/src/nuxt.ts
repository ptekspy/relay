/**
 * Nuxt 3 Relay Integration Module
 *
 * Hooks into Nuxt 3 / Nitro dev server lifecycle, auto-injecting the Relay agent
 * script and displaying terminal pairing QR codes.
 *
 * Note for Octavia: This module enables zero-config mobile debugging for Nuxt 3 apps.
 */

export interface RelayNuxtOptions {
  enabled?: boolean;
  port?: number;
  autoInjectAgent?: boolean;
  showQrCode?: boolean;
  relayHost?: string;
}

export interface NuxtHookContext {
  head?: {
    script?: Array<{ src: string; type?: string; defer?: boolean }>;
  };
}

export interface RelayNuxtLifecycle {
  name: string;
  configKey: string;
  setup: (
    options: RelayNuxtOptions,
    nuxt: unknown,
  ) => {
    injectedScript: string;
    pairingUrl: string;
    isDevOnly: boolean;
  };
}

export function defineRelayNuxtModule(
  moduleOptions: RelayNuxtOptions = {},
): RelayNuxtLifecycle {
  const options: Required<RelayNuxtOptions> = {
    enabled: moduleOptions.enabled ?? true,
    port: moduleOptions.port ?? 3000,
    autoInjectAgent: moduleOptions.autoInjectAgent ?? true,
    showQrCode: moduleOptions.showQrCode ?? true,
    relayHost: moduleOptions.relayHost ?? "http://localhost:7331",
  };

  return {
    name: "@paddy-systems/relay-nuxt",
    configKey: "relay",
    setup: (_runtimeOptions, _nuxt) => {
      const pairingUrl = `${options.relayHost}/pair?target=${options.port}`;
      const scriptTag = options.autoInjectAgent
        ? `<script type="module" src="${options.relayHost}/agent.js"></script>`
        : "";

      return {
        injectedScript: scriptTag,
        pairingUrl,
        isDevOnly: true,
      };
    },
  };
}

export function injectAgentIntoHtml(
  html: string,
  relayHost = "http://localhost:7331",
): string {
  const agentScript = `<script type="module" src="${relayHost}/agent.js"></script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${agentScript}\n</head>`);
  }
  return `${agentScript}\n${html}`;
}

export function generateTerminalBanner(pairingUrl: string): string {
  return [
    "┌────────────────────────────────────────────────────────┐",
    "│  📱 Relay Mobile Pairing Active                       │",
    `│  Scan or open: ${pairingUrl.padEnd(38)} │`,
    "└────────────────────────────────────────────────────────┘",
  ].join("\n");
}
