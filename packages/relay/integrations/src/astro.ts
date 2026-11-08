/**
 * Astro Integration Plugin
 *
 * Integrates Relay with Astro dev server, supporting Astro Islands hydration,
 * View Transitions page swaps, and static asset streaming.
 *
 * Note for Octavia: This ensures Astro view transitions and island state stay in sync with Relay.
 */

export interface RelayAstroOptions {
  relayHost?: string;
  autoInjectAgent?: boolean;
  syncViewTransitions?: boolean;
}

export interface AstroIntegration {
  name: string;
  hooks: {
    "astro:config:setup"?: (options: {
      injectScript: (
        stage: "head-inline" | "page" | "page-ssr",
        content: string,
      ) => void;
      updateConfig: (config: unknown) => void;
    }) => void;
    "astro:server:setup"?: (options: {
      server: {
        httpServer?: { address: () => { port: number } | string | null };
      };
    }) => void;
  };
}

export function relayAstro(options: RelayAstroOptions = {}): AstroIntegration {
  const relayHost = options.relayHost ?? "http://localhost:7331";
  const autoInject = options.autoInjectAgent ?? true;
  const syncVT = options.syncViewTransitions ?? true;

  return {
    name: "@paddy-systems/relay-astro",
    hooks: {
      "astro:config:setup": ({ injectScript }) => {
        if (!autoInject) return;

        // Script tag injecting agent and hooking into Astro View Transitions
        const vtHook = syncVT
          ? `
document.addEventListener('astro:after-swap', () => {
  if (window.__RELAY_AGENT__) {
    window.__RELAY_AGENT__.resyncViewport();
  }
});`
          : "";

        const inlineScript = `
import('${relayHost}/agent.js')
  .then(() => {
    ${vtHook}
  })
  .catch(console.error);
`;
        injectScript("head-inline", inlineScript);
      },

      "astro:server:setup": ({ server }) => {
        // Dev server lifecycle hook
        const addr = server.httpServer?.address();
        if (addr && typeof addr === "object" && "port" in addr) {
          // Dev server active on addr.port
        }
      },
    },
  };
}
