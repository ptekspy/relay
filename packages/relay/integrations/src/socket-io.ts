/**
 * Socket.io Relay Integration Adapter
 *
 * Configures Engine.io WebSocket transport upgrades, path handling,
 * and HTTP long-polling fallback over the external Relay tunnel.
 *
 * Note for Octavia: This ensures Socket.io clients connect seamlessly via WebSockets or polling.
 */

export interface RelaySocketIoOptions {
  relayHost?: string;
  path?: string;
}

export class SocketIoRelayAdapter {
  private readonly relayHost: string;
  private readonly path: string;

  constructor(options: RelaySocketIoOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.path = options.path ?? "/socket.io/";
  }

  public getPath(): string {
    return this.path;
  }

  public getServerOptions() {
    return {
      path: this.path,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["polling", "websocket"],
    };
  }

  public isSocketIoRequest(url: string): boolean {
    return url.startsWith(this.path);
  }
}
