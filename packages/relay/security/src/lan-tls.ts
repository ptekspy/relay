import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DnsProbeResult, LanTlsBundle } from "./types.js";

export const DEFAULT_LAN_APEX_DOMAIN = "lan.relay.paddy.systems";

/**
 * Checks if an IPv4 address belongs to RFC 1918 private ranges or loopback.
 */
export function isRfc1918PrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)
  ) {
    return false;
  }

  const [a, b] = parts;
  if (a === undefined || b === undefined) return false;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

/**
 * Encodes an IPv4 address into a wildcard LAN subdomain.
 * e.g. "192.168.1.50" -> "192-168-1-50.lan.paddy.systems"
 */
export function ipToLanDomain(
  ip: string,
  apexDomain = DEFAULT_LAN_APEX_DOMAIN,
): string {
  const sanitizedIp = ip.trim().replace(/\./g, "-");
  return `${sanitizedIp}.${apexDomain}`;
}

/**
 * Decodes an encoded wildcard LAN domain into an IP address.
 * Strictly enforces that only RFC 1918 private IPs are permitted.
 */
export function lanDomainToIp(
  domain: string,
  apexDomain = DEFAULT_LAN_APEX_DOMAIN,
): string | null {
  const clean = domain.toLowerCase().trim();
  const suffix = `.${apexDomain.toLowerCase()}`;
  if (!clean.endsWith(suffix)) {
    return null;
  }

  const prefix = clean.slice(0, clean.length - suffix.length);
  const candidateIp = prefix.replace(/-/g, ".");

  if (!isRfc1918PrivateIp(candidateIp)) {
    // Rejects public IPs or AWS metadata addresses (SSRF defense)
    return null;
  }

  return candidateIp;
}

export type DnsLookupFn = (
  hostname: string,
  options?: { family?: number },
) => Promise<{ address: string; family: number }>;

/**
 * Probes the local network environment for DNS Rebinding Protection.
 */
export async function probeDnsRebinding(
  domain: string,
  expectedIp: string,
  dnsLookup: DnsLookupFn = (h, opts) => lookup(h, opts ?? { family: 4 }),
): Promise<DnsProbeResult> {
  try {
    const result = await dnsLookup(domain, { family: 4 });
    const resolvedIp = result.address;

    if (resolvedIp === expectedIp) {
      return {
        domain,
        resolvedIp,
        expectedIp,
        rebindingBlocked: false,
        message: "DNS wildcard resolved successfully on local network.",
      };
    }

    return {
      domain,
      resolvedIp,
      expectedIp,
      rebindingBlocked: true,
      message: `DNS query returned ${resolvedIp} instead of expected ${expectedIp}. Router DNS rebinding may be altering responses.`,
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return {
      domain,
      expectedIp,
      rebindingBlocked: true,
      message: `Router blocked public DNS resolution for local IP (${err.code ?? err.message}). Fallback to Relay tunnel recommended.`,
    };
  }
}

/**
 * Manages local wildcard TLS certificate retrieval, caching, and fallback.
 */
export class LanTlsBundleManager {
  private readonly certDir: string;
  private readonly apexDomain: string;

  constructor(apexDomain = DEFAULT_LAN_APEX_DOMAIN, customDir?: string) {
    this.apexDomain = apexDomain;
    this.certDir = customDir || path.join(os.homedir(), ".relay", "certs");
  }

  /**
   * Retrieves an existing cached wildcard certificate or provisions a local fallback.
   */
  public async getOrProvisionBundle(lanIp: string): Promise<LanTlsBundle> {
    const certPath = path.join(this.certDir, `${this.apexDomain}.crt`);
    const keyPath = path.join(this.certDir, `${this.apexDomain}.key`);

    // 1. Check for provisioned Let's Encrypt wildcard bundle
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      try {
        const cert = fs.readFileSync(certPath, "utf-8");
        const key = fs.readFileSync(keyPath, "utf-8");
        return {
          cert,
          key,
          isTrustedWildcard: true,
          domain: `*.${this.apexDomain}`,
        };
      } catch {
        // Fall through to dev generation
      }
    }

    // 2. Check environment variables
    if (process.env.RELAY_LAN_TLS_CERT && process.env.RELAY_LAN_TLS_KEY) {
      return {
        cert: process.env.RELAY_LAN_TLS_CERT,
        key: process.env.RELAY_LAN_TLS_KEY,
        isTrustedWildcard: true,
        domain: `*.${this.apexDomain}`,
      };
    }

    // 3. Fallback: generate high-entropy dev certificate pair
    const devBundle = this.generateDevFallbackKeyPair();
    return {
      cert: devBundle.cert,
      key: devBundle.key,
      isTrustedWildcard: false,
      domain: ipToLanDomain(lanIp, this.apexDomain),
    };
  }

  public saveWildcardBundle(cert: string, key: string): void {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(this.certDir, `${this.apexDomain}.crt`),
      cert,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(this.certDir, `${this.apexDomain}.key`),
      key,
      "utf-8",
    );
  }

  private generateDevFallbackKeyPair(): { cert: string; key: string } {
    try {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "relay-lan-tls-"));
      const keyPath = path.join(tempDir, "key.pem");
      const certPath = path.join(tempDir, "cert.pem");

      const proc = spawnSync(
        "openssl",
        [
          "req",
          "-x509",
          "-newkey",
          "rsa:2048",
          "-nodes",
          "-keyout",
          keyPath,
          "-out",
          certPath,
          "-days",
          "365",
          "-subj",
          `/CN=*.${this.apexDomain}`,
          "-addext",
          `subjectAltName=DNS:*.${this.apexDomain},DNS:${this.apexDomain},IP:127.0.0.1`,
        ],
        { stdio: "ignore" },
      );

      if (
        proc.status === 0 &&
        fs.existsSync(keyPath) &&
        fs.existsSync(certPath)
      ) {
        const key = fs.readFileSync(keyPath, "utf-8");
        const cert = fs.readFileSync(certPath, "utf-8");
        fs.rmSync(tempDir, { recursive: true, force: true });
        return { key, cert };
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Fall through to node:crypto fallback
    }

    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    return {
      key: privateKey,
      cert: publicKey,
    };
  }
}

export const lanTlsBundleManager = new LanTlsBundleManager();
