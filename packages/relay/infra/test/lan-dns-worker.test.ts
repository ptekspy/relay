import { describe, expect, test } from "bun:test";
import {
  handleDnsWorkerRequest,
  isRfc1918PrivateIp,
  resolveLanDnsQuery,
} from "../src/lan-dns-worker.js";

describe("Cloudflare Worker LAN DNS Resolver", () => {
  test("correctly validates RFC 1918 IPv4 ranges", () => {
    expect(isRfc1918PrivateIp("192.168.1.1")).toBe(true);
    expect(isRfc1918PrivateIp("10.0.0.1")).toBe(true);
    expect(isRfc1918PrivateIp("172.16.0.5")).toBe(true);
    expect(isRfc1918PrivateIp("172.31.255.254")).toBe(true);
    expect(isRfc1918PrivateIp("127.0.0.1")).toBe(true);

    // Non-private IPs
    expect(isRfc1918PrivateIp("8.8.8.8")).toBe(false);
    expect(isRfc1918PrivateIp("1.1.1.1")).toBe(false);
    expect(isRfc1918PrivateIp("172.32.0.1")).toBe(false);
    expect(isRfc1918PrivateIp("169.254.169.254")).toBe(false);
  });

  test("resolves private IP subdomain queries with status 0 (NOERROR)", () => {
    const res = resolveLanDnsQuery("192-168-1-212.lan.relay.paddy.systems");
    expect(res.status).toBe(0);
    expect(res.ip).toBe("192.168.1.212");
  });

  test("rejects public IP subdomains with status 3 (NXDOMAIN)", () => {
    const res = resolveLanDnsQuery("8-8-8-8.lan.relay.paddy.systems");
    expect(res.status).toBe(3);
    expect(res.ip).toBeNull();
  });

  test("handles worker request for DNS over HTTPS query", async () => {
    const req = new Request(
      "https://dns.paddy.systems/dns-query?name=192-168-1-50.lan.relay.paddy.systems",
    );
    const resp = await handleDnsWorkerRequest(req);
    expect(resp.status).toBe(200);

    const data = await resp.json();
    expect(data.Status).toBe(0);
    expect(data.Answer).toHaveLength(1);
    expect(data.Answer[0].data).toBe("192.168.1.50");
  });

  test("handles worker request for ACME DNS-01 challenge", async () => {
    const req = new Request(
      "https://dns.paddy.systems/.well-known/acme-challenge",
    );
    const resp = await handleDnsWorkerRequest(
      req,
      "mock_acme_token_auth_signature",
    );
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toBe("mock_acme_token_auth_signature");
  });
});
