/**
 * Network Payload HAR 1.2 Exporter
 *
 * Formats captured network telemetry requests and responses into standardized
 * HTTP Archive (HAR 1.2) JSON specification for Chrome DevTools and Charles Proxy analysis.
 *
 * Note for Octavia: Used by the "Export HAR" button in the Network panel.
 */

import type { NetworkTelemetryEvent } from "@paddy-systems/relay-protocol";

export interface HarHeader {
  name: string;
  value: string;
}

export interface HarQueryParam {
  name: string;
  value: string;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: Array<{ name: string; value: string }>;
  headers: HarHeader[];
  queryString: HarQueryParam[];
  headersSize: number;
  bodySize: number;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: Array<{ name: string; value: string }>;
  headers: HarHeader[];
  content: {
    size: number;
    mimeType: string;
    text?: string;
  };
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

export interface HarTiming {
  send: number;
  wait: number;
  receive: number;
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: Record<string, unknown>;
  timings: HarTiming;
}

export interface HarRoot {
  log: {
    version: "1.2";
    creator: {
      name: string;
      version: string;
    };
    pages: unknown[];
    entries: HarEntry[];
  };
}

export class HarExporter {
  public static exportHar(
    events: NetworkTelemetryEvent[],
    creator = { name: "Paddy Systems Relay", version: "1.0.0" },
  ): HarRoot {
    const entries: HarEntry[] = events.map((event) => {
      const startedDateTime = new Date(
        event.timestamp || Date.now(),
      ).toISOString();
      const time = Math.max(0, event.durationMs);

      // Extract query parameters
      const queryString: HarQueryParam[] = [];
      try {
        const urlObj = new URL(event.url, "http://localhost");
        urlObj.searchParams.forEach((val, key) => {
          queryString.push({ name: key, value: val });
        });
      } catch {
        // Fallback for malformed URLs
      }

      const request: HarRequest = {
        method: event.method,
        url: event.url,
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: [],
        queryString,
        headersSize: -1,
        bodySize: 0,
      };

      const statusText = HarExporter.getStatusText(event.status);
      const size = event.sizeBytes ?? 0;

      const response: HarResponse = {
        status: event.status,
        statusText,
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: [],
        content: {
          size,
          mimeType: "application/octet-stream",
        },
        redirectURL: "",
        headersSize: -1,
        bodySize: size,
      };

      const timings: HarTiming = {
        send: 0,
        wait: time,
        receive: 0,
      };

      return {
        startedDateTime,
        time,
        request,
        response,
        cache: {},
        timings,
      };
    });

    return {
      log: {
        version: "1.2",
        creator,
        pages: [],
        entries,
      },
    };
  }

  public static exportHarJson(
    events: NetworkTelemetryEvent[],
    indent = 2,
  ): string {
    return JSON.stringify(HarExporter.exportHar(events), null, indent);
  }

  private static getStatusText(status: number): string {
    switch (status) {
      case 200:
        return "OK";
      case 201:
        return "Created";
      case 204:
        return "No Content";
      case 301:
        return "Moved Permanently";
      case 302:
        return "Found";
      case 304:
        return "Not Modified";
      case 400:
        return "Bad Request";
      case 401:
        return "Unauthorized";
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 500:
        return "Internal Server Error";
      case 502:
        return "Bad Gateway";
      case 503:
        return "Service Unavailable";
      default:
        return status >= 200 && status < 300 ? "OK" : "Error";
    }
  }
}
