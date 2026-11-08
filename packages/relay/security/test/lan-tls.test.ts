import { describe, expect, test } from "bun:test";
import {
  type DnsLookupFn,
  ipToLanDomain,
  LanTlsBundleManager,
  lanDomainToIp,
  probeDnsRebinding,
} from "../src/lan-tls.js";

describe("LanTls & DNS Architecture", () => {
  test("encodes IPv4 addresses to *.lan.relay.paddy.systems subdomains", () => {
    expect(ipToLanDomain("192.168.1.50")).toBe(
      "192-168-1-50.lan.relay.paddy.systems",
    );
    expect(ipToLanDomain("10.0.4.12")).toBe(
      "10-0-4-12.lan.relay.paddy.systems",
    );
    expect(ipToLanDomain("127.0.0.1")).toBe(
      "127-0-0-1.lan.relay.paddy.systems",
    );
  });

  test("decodes valid RFC 1918 subdomains to IP addresses", () => {
    expect(lanDomainToIp("192-168-1-50.lan.relay.paddy.systems")).toBe(
      "192.168.1.50",
    );
    expect(lanDomainToIp("10-0-4-12.lan.relay.paddy.systems")).toBe(
      "10.0.4.12",
    );
    expect(lanDomainToIp("172-20-1-1.lan.relay.paddy.systems")).toBe(
      "172.20.1.1",
    );
    expect(lanDomainToIp("127-0-0-1.lan.relay.paddy.systems")).toBe(
      "127.0.0.1",
    );
  });

  test("rejects public IPs and non-RFC 1918 addresses to prevent SSRF and rebinding abuse", () => {
    // Public IPs
    expect(lanDomainToIp("8-8-8-8.lan.relay.paddy.systems")).toBeNull();
    expect(lanDomainToIp("1-1-1-1.lan.relay.paddy.systems")).toBeNull();

    // AWS / Cloud Metadata IP
    expect(lanDomainToIp("169-254-169-254.lan.relay.paddy.systems")).toBeNull();

    // Non-domain or foreign apex
    expect(lanDomainToIp("192-168-1-1.evil.com")).toBeNull();
    expect(lanDomainToIp("not-an-ip.lan.relay.paddy.systems")).toBeNull();
  });

  test("detects router DNS rebinding protection via DNS probe", async () => {
    // Simulated successful resolution
    const mockSuccessLookup: DnsLookupFn = async () => ({
      address: "192.168.1.50",
      family: 4,
    });
    const successResult = await probeDnsRebinding(
      "192-168-1-50.lan.relay.paddy.systems",
      "192.168.1.50",
      mockSuccessLookup,
    );
    expect(successResult.rebindingBlocked).toBe(false);

    // Simulated DNS rebinding block (NXDOMAIN / ENOTFOUND)
    const mockBlockedLookup: DnsLookupFn = async () => {
      const err = new Error("getaddrinfo ENOTFOUND") as NodeJS.ErrnoException;
      err.code = "ENOTFOUND";
      throw err;
    };
    const blockedResult = await probeDnsRebinding(
      "192-168-1-50.lan.relay.paddy.systems",
      "192.168.1.50",
      mockBlockedLookup,
    );
    expect(blockedResult.rebindingBlocked).toBe(true);
    expect(blockedResult.message).toContain("Fallback to Relay tunnel");
  });

  test("provisions high-entropy dev fallback keypair when no cached cert exists", async () => {
    const manager = new LanTlsBundleManager(
      "lan.relay.paddy.systems",
      "/tmp/non-existent-certs",
    );
    const bundle = await manager.getOrProvisionBundle("192.168.1.50");
    expect(
      bundle.cert.includes("-----BEGIN CERTIFICATE-----") ||
        bundle.cert.includes("-----BEGIN PUBLIC KEY-----"),
    ).toBe(true);
    expect(bundle.key).toContain("-----BEGIN PRIVATE KEY-----");
    expect(bundle.domain).toBe("192-168-1-50.lan.relay.paddy.systems");
    expect(bundle.isTrustedWildcard).toBe(false);
  });
});
