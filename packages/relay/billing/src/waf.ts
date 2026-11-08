const SQLI_REGEX =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b|--|\/\*)/i;
const PATH_TRAVERSAL_REGEX = /(?:\.\.\/|\.\.\\)/;
const SCRIPT_INJECTION_REGEX =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

export interface WafDecision {
  allowed: boolean;
  reason?: string;
  blockCategory?:
    | "SQL_INJECTION"
    | "PATH_TRAVERSAL"
    | "XSS"
    | "RATE_LIMIT_BURST";
}

export class EdgeWafFilter {
  private ipRequestCounts = new Map<
    string,
    { count: number; windowStart: number }
  >();
  private readonly maxBurstPerWindow: number;
  private readonly windowMs: number;

  constructor(maxBurstPerWindow = 100, windowMs = 10_000) {
    this.maxBurstPerWindow = maxBurstPerWindow;
    this.windowMs = windowMs;
  }

  public inspectRequest(ip: string, path: string, body?: string): WafDecision {
    // 1. Path traversal check
    if (PATH_TRAVERSAL_REGEX.test(path)) {
      return {
        allowed: false,
        reason: "Path traversal pattern detected",
        blockCategory: "PATH_TRAVERSAL",
      };
    }

    // 2. SQL injection check on path & body
    if (SQLI_REGEX.test(path) || (body && SQLI_REGEX.test(body))) {
      return {
        allowed: false,
        reason: "SQL injection signature detected",
        blockCategory: "SQL_INJECTION",
      };
    }

    // 3. XSS check
    if (body && SCRIPT_INJECTION_REGEX.test(body)) {
      return {
        allowed: false,
        reason: "Cross-site scripting payload detected",
        blockCategory: "XSS",
      };
    }

    // 4. Rate limit burst check
    const now = Date.now();
    const rate = this.ipRequestCounts.get(ip) ?? { count: 0, windowStart: now };

    if (now - rate.windowStart > this.windowMs) {
      rate.count = 1;
      rate.windowStart = now;
    } else {
      rate.count += 1;
      if (rate.count > this.maxBurstPerWindow) {
        this.ipRequestCounts.set(ip, rate);
        return {
          allowed: false,
          reason: "Burst rate limit exceeded",
          blockCategory: "RATE_LIMIT_BURST",
        };
      }
    }
    this.ipRequestCounts.set(ip, rate);

    return { allowed: true };
  }
}
