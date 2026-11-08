/**
 * Webpack 5 DevServer Middleware Hook & Plugin
 *
 * Hooks into Webpack 5 devServer configuration (CRA, Next.js legacy, custom Webpack),
 * enabling WebSocket HMR proxying without socket disconnect loops.
 *
 * Note for Octavia: This configures allowedHosts and WDS /ws socket routing for Relay.
 */

export interface WebpackHookOptions {
  relayHost?: string;
  targetPort?: number;
  autoInjectAgent?: boolean;
}

export interface WebpackCompilerHook {
  apply: (compiler: {
    hooks: {
      done: {
        tap: (name: string, callback: () => void) => void;
      };
    };
  }) => void;
}

export interface WebpackDevServerConfig {
  allowedHosts?: string[] | "all" | "auto";
  client?: {
    webSocketURL?: {
      hostname?: string;
      port?: number;
      pathname?: string;
    };
  };
  setupMiddlewares?: (middlewares: unknown[], devServer: unknown) => unknown[];
}

export class RelayWebpackPlugin implements WebpackCompilerHook {
  private readonly options: Required<WebpackHookOptions>;

  constructor(options: WebpackHookOptions = {}) {
    this.options = {
      relayHost: options.relayHost ?? "http://localhost:7331",
      targetPort: options.targetPort ?? 8080,
      autoInjectAgent: options.autoInjectAgent ?? true,
    };
  }

  public apply(compiler: {
    hooks: { done: { tap: (name: string, callback: () => void) => void } };
  }): void {
    compiler.hooks.done.tap("RelayWebpackPlugin", () => {
      // Dev build finished
    });
  }

  public patchDevServerConfig(
    config: WebpackDevServerConfig,
  ): WebpackDevServerConfig {
    const patched = { ...config };

    // Prevent WDS from rejecting tunnel hosts
    patched.allowedHosts = "all";

    // Ensure client WebSocket points to correct socket pathname without breaking on tunnel host
    patched.client = {
      ...(config.client || {}),
      webSocketURL: {
        pathname: "/ws",
        ...(config.client?.webSocketURL || {}),
      },
    };

    return patched;
  }

  public injectAgentHtml(html: string): string {
    if (!this.options.autoInjectAgent) return html;
    const script = `<script type="module" src="${this.options.relayHost}/agent.js"></script>`;
    if (html.includes("</head>")) {
      return html.replace("</head>", `  ${script}\n</head>`);
    }
    return `${script}\n${html}`;
  }
}

export function relayWebpack(options?: WebpackHookOptions): RelayWebpackPlugin {
  return new RelayWebpackPlugin(options);
}
