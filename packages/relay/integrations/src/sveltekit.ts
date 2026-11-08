/**
 * SvelteKit Dev Middleware & Vite Plugin
 *
 * Handles Vite dev server configuration, SSR streaming chunks, and HMR
 * event forwarding for SvelteKit applications paired with Relay.
 *
 * Note for Octavia: This plugin hooks into Vite's dev server middleware and HMR bus.
 */

export interface RelaySvelteKitOptions {
  targetPort?: number;
  relayPort?: number;
  relayHost?: string;
  injectAgent?: boolean;
}

export interface HmrUpdateEvent {
  type: "js-update" | "css-update" | "full-reload";
  path: string;
  timestamp: number;
  latencyMs?: number;
}

export interface VitePluginHook {
  name: string;
  enforce?: "pre" | "post";
  configureServer: (server: unknown) => void;
  transformIndexHtml?: (html: string) => string;
}

export class SvelteKitRelayBridge {
  private readonly options: Required<RelaySvelteKitOptions>;
  private readonly listeners = new Set<(event: HmrUpdateEvent) => void>();

  constructor(options: RelaySvelteKitOptions = {}) {
    this.options = {
      targetPort: options.targetPort ?? 5173,
      relayPort: options.relayPort ?? 7331,
      relayHost: options.relayHost ?? "http://localhost:7331",
      injectAgent: options.injectAgent ?? true,
    };
  }

  public getOptions(): Required<RelaySvelteKitOptions> {
    return this.options;
  }

  public onHmrUpdate(listener: (event: HmrUpdateEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notifyHmrUpdate(
    update: Omit<HmrUpdateEvent, "timestamp">,
    sentAt = Date.now(),
  ): HmrUpdateEvent {
    const event: HmrUpdateEvent = {
      ...update,
      timestamp: sentAt,
      latencyMs: Date.now() - sentAt,
    };

    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  public createVitePlugin(): VitePluginHook {
    return {
      name: "relay-sveltekit",
      configureServer: (server: unknown) => {
        // Detect port from Vite server config if present
        if (
          typeof server === "object" &&
          server !== null &&
          "config" in server
        ) {
          const cfg = (server as { config: { server?: { port?: number } } })
            .config;
          if (cfg.server?.port) {
            this.options.targetPort = cfg.server.port;
          }
        }
      },
      transformIndexHtml: (html: string) => {
        if (!this.options.injectAgent) return html;
        const script = `<script type="module" src="${this.options.relayHost}/agent.js"></script>`;
        if (html.includes("</head>")) {
          return html.replace("</head>", `  ${script}\n</head>`);
        }
        return `${script}\n${html}`;
      },
    };
  }
}

export function relaySvelteKit(
  options?: RelaySvelteKitOptions,
): VitePluginHook {
  const bridge = new SvelteKitRelayBridge(options);
  return bridge.createVitePlugin();
}
