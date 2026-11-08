/**
 * Python ASGI / WSGI & HTTP Server Relay Adapter
 *
 * Provides proxy header normalization, port detection from Python logs
 * (e.g. Uvicorn, Gunicorn, standard library http.server), and process coordination.
 *
 * Note for Octavia: This enables Relay to proxy Python web servers without requiring pip dependencies.
 */

export interface RelayPythonOptions {
  relayHost?: string;
}

export class PythonServerAdapter {
  private readonly relayHost: string;

  constructor(options: RelayPythonOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
  }

  public normalizeHeaders(
    incomingHeaders: Record<string, string | string[] | undefined>,
  ): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (typeof value === "string") {
        normalized[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        normalized[key.toLowerCase()] = value.join(", ");
      }
    }

    if (!normalized["x-forwarded-host"]) {
      normalized["x-forwarded-host"] = this.relayHost;
    }
    if (!normalized["x-forwarded-proto"]) {
      normalized["x-forwarded-proto"] = "http";
    }
    return normalized;
  }

  public parsePortFromLogs(logOutput: string): number | null {
    // Matches: "Uvicorn running on http://127.0.0.1:8000", "Serving HTTP on 127.0.0.1 port 8000", ":8000"
    const match =
      logOutput.match(/(?:port\s+|:)(\d{4,5})/i) ||
      logOutput.match(/https?:\/\/[^:]+:(\d{4,5})/i);

    if (match?.[1]) {
      const port = Number.parseInt(match[1], 10);
      return Number.isNaN(port) ? null : port;
    }
    return null;
  }
}
