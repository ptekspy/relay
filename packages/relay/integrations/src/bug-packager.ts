import crypto from "node:crypto";

/**
 * Comprehensive Bug Metadata Packager
 *
 * Packs device model, OS, viewport, DPR, user agent, network type, battery level,
 * recent console errors, and failed network calls into standardized `relay-bug-report.json`.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-integrations/bug-packager.
 */

export interface BugReportDevice {
  model: string;
  os: string;
  viewport: { width: number; height: number };
  dpr: number;
  userAgent: string;
  networkType?: "wifi" | "4g" | "5g" | "ethernet" | "offline";
  battery?: { level: number; charging: boolean };
}

export interface BugReportLog {
  level: "error" | "warn" | "info";
  message: string;
  timestamp: number;
}

export interface BugReportNetworkCall {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  error?: string;
}

export interface RelayBugReportSchema {
  schemaVersion: "1.0.0";
  reportId: string;
  sessionId: string;
  timestamp: number;
  summary: string;
  description: string;
  device: BugReportDevice;
  consoleLogs: BugReportLog[];
  networkCalls: BugReportNetworkCall[];
  replayUrl?: string;
}

export function createBugReport(
  input: Omit<RelayBugReportSchema, "schemaVersion" | "reportId" | "timestamp">,
): RelayBugReportSchema {
  return {
    schemaVersion: "1.0.0",
    reportId: `bug_${crypto.randomBytes(8).toString("hex")}`,
    timestamp: Date.now(),
    ...input,
  };
}

export function serializeBugReport(report: RelayBugReportSchema): string {
  return JSON.stringify(report, null, 2);
}

export function validateBugReport(jsonString: string): {
  valid: boolean;
  report?: RelayBugReportSchema;
  errors?: string[];
} {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(jsonString) as Partial<RelayBugReportSchema>;

    if (parsed.schemaVersion !== "1.0.0") {
      errors.push("Invalid schemaVersion: expected 1.0.0");
    }
    if (!parsed.reportId || typeof parsed.reportId !== "string") {
      errors.push("Missing or invalid reportId");
    }
    if (!parsed.sessionId || typeof parsed.sessionId !== "string") {
      errors.push("Missing or invalid sessionId");
    }
    if (!parsed.device || typeof parsed.device !== "object") {
      errors.push("Missing or invalid device metadata");
    } else {
      if (!parsed.device.model) errors.push("Missing device.model");
      if (!parsed.device.os) errors.push("Missing device.os");
      if (!parsed.device.viewport?.width || !parsed.device.viewport?.height) {
        errors.push("Missing device.viewport dimensions");
      }
    }
    if (!Array.isArray(parsed.consoleLogs)) {
      errors.push("Missing or invalid consoleLogs array");
    }
    if (!Array.isArray(parsed.networkCalls)) {
      errors.push("Missing or invalid networkCalls array");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, report: parsed as RelayBugReportSchema };
  } catch (err) {
    return {
      valid: false,
      errors: [`JSON parse error: ${(err as Error).message}`],
    };
  }
}
