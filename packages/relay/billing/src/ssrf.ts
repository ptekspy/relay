import { isIP } from "node:net";

export interface SsrfValidationResult {
  allowed: boolean;
  reason?: string;
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "instance-data",
  "169.254.169.254",
]);

export function validateRemoteTarget(hostOrUrl: string): SsrfValidationResult {
  let hostname = hostOrUrl;

  try {
    if (hostOrUrl.includes("://")) {
      const url = new URL(hostOrUrl);
      hostname = url.hostname;
    }
  } catch {
    return { allowed: false, reason: "Malformed URL target" };
  }

  hostname = hostname.toLowerCase().trim();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return {
      allowed: false,
      reason: `Direct access to '${hostname}' is forbidden for SSRF security.`,
    };
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    if (isPrivateIPv4(hostname)) {
      return {
        allowed: false,
        reason: `Private/internal IPv4 address '${hostname}' is rejected.`,
      };
    }
  } else if (ipVersion === 6) {
    if (isPrivateIPv6(hostname)) {
      return {
        allowed: false,
        reason: `Private/internal IPv6 address '${hostname}' is rejected.`,
      };
    }
  }

  return { allowed: true };
}

export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return true;

  const [a = 0, b = 0] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link Local / Cloud Metadata)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  return false;
}

export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // ::1 loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  // fe80::/10 link-local
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  )
    return true;
  // fc00::/7 unique local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  return false;
}
