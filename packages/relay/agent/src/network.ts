import type { NetworkTelemetryEvent } from "@paddy-systems/relay-protocol";

export type NetworkCallback = (event: NetworkTelemetryEvent) => void;

export class NetworkInterceptor {
  private originalFetch: typeof window.fetch | null = null;
  private originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
  private active = false;

  constructor(private readonly onNetwork: NetworkCallback) {}

  public install(): void {
    if (this.active || typeof window === "undefined") return;

    this.installFetch();
    this.installXhr();
    this.active = true;
  }

  private installFetch(): void {
    if (typeof window.fetch !== "function") return;

    this.originalFetch = window.fetch;

    const wrappedFetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const startTime = performance.now();
      const method = (
        init?.method ||
        (typeof input === "object" && "method" in input ? input.method : "GET")
      ).toUpperCase();
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      try {
        const fetchFn = this.originalFetch ?? fetch;
        const response = await fetchFn(input, init);
        const durationMs = Math.round(performance.now() - startTime);

        let sizeBytes: number | undefined;
        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          const parsed = Number.parseInt(contentLength, 10);
          if (!Number.isNaN(parsed)) sizeBytes = parsed;
        }

        this.onNetwork({
          kind: "network",
          method,
          url,
          status: response.status,
          durationMs,
          sizeBytes,
          timestamp: Date.now(),
        });

        return response;
      } catch (err) {
        const durationMs = Math.round(performance.now() - startTime);
        this.onNetwork({
          kind: "network",
          method,
          url,
          status: 0,
          durationMs,
          error: err instanceof Error ? err.message : String(err),
          timestamp: Date.now(),
        });
        throw err;
      }
    };

    window.fetch = Object.assign(
      wrappedFetch,
      this.originalFetch,
    ) as typeof window.fetch;
  }

  private installXhr(): void {
    if (typeof XMLHttpRequest === "undefined") return;

    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest & {
        __relay_method?: string;
        __relay_url?: string;
        __relay_start?: number;
      },
      method: string,
      url: string | URL,
      ...args: unknown[]
    ) {
      this.__relay_method = method.toUpperCase();
      this.__relay_url = typeof url === "string" ? url : url.toString();
      const openFn = self.originalXhrOpen as unknown as (
        this: XMLHttpRequest,
        ...a: unknown[]
      ) => void;
      return openFn.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest & {
        __relay_method?: string;
        __relay_url?: string;
        __relay_start?: number;
      },
      body?: Document | XMLHttpRequestBodyInit | null,
    ) {
      this.__relay_start = performance.now();

      this.addEventListener("loadend", () => {
        const durationMs = Math.round(
          performance.now() - (this.__relay_start ?? performance.now()),
        );
        const contentLength = this.getResponseHeader("content-length");
        let sizeBytes: number | undefined;
        if (contentLength) {
          const parsed = Number.parseInt(contentLength, 10);
          if (!Number.isNaN(parsed)) sizeBytes = parsed;
        }

        self.onNetwork({
          kind: "network",
          method: this.__relay_method ?? "GET",
          url: this.__relay_url ?? "",
          status: this.status,
          durationMs,
          sizeBytes,
          error: this.status === 0 ? "Network Failure" : undefined,
          timestamp: Date.now(),
        });
      });

      if (self.originalXhrSend) {
        return self.originalXhrSend.apply(this, [body]);
      }
    };
  }

  public uninstall(): void {
    if (!this.active || typeof window === "undefined") return;

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    if (this.originalXhrOpen && typeof XMLHttpRequest !== "undefined") {
      XMLHttpRequest.prototype.open = this.originalXhrOpen;
      this.originalXhrOpen = null;
    }

    if (this.originalXhrSend && typeof XMLHttpRequest !== "undefined") {
      XMLHttpRequest.prototype.send = this.originalXhrSend;
      this.originalXhrSend = null;
    }

    this.active = false;
  }
}
