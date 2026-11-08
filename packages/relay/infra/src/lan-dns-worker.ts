/**
 * @paddy-systems/relay-infra
 * Cloudflare Worker / Edge DNS Resolver for *.lan.paddy.systems
 *
 * Translates IP-encoded subdomains (e.g. 192-168-1-50.lan.paddy.systems)
 * into RFC 1918 private IPv4 A records, while enforcing strict anti-SSRF
 * filtering and handling ACME DNS-01 challenges.
 */

export interface DnsAnswer {
  name: string;
  type: number; // 1 = A
  TTL: number;
  data: string;
}

export interface DnsResponse {
  Status: number; // 0 = NOERROR, 3 = NXDOMAIN
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: DnsAnswer[];
}

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
  if (a === 127) return true; // Loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  return false;
}

export function resolveLanDnsQuery(
  hostname: string,
  apexDomain = "lan.relay.paddy.systems",
): { ip: string | null; status: number } {
  const clean = hostname.toLowerCase().replace(/\.$/, "").trim();
  const suffix = `.${apexDomain.toLowerCase()}`;

  if (!clean.endsWith(suffix)) {
    return { ip: null, status: 3 }; // NXDOMAIN
  }

  const prefix = clean.slice(0, clean.length - suffix.length);
  // Match 4-octet dash pattern: e.g. 192-168-1-50
  const match = /^(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})$/.exec(prefix);
  if (!match) {
    return { ip: null, status: 3 }; // NXDOMAIN
  }

  const candidateIp = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;

  // Strict SSRF & Private IP Guard
  if (!isRfc1918PrivateIp(candidateIp)) {
    return { ip: null, status: 3 }; // NXDOMAIN (refuse to resolve public or cloud metadata IPs)
  }

  return { ip: candidateIp, status: 0 }; // NOERROR
}

/**
 * Cloudflare Worker Fetch Handler
 */
export async function handleDnsWorkerRequest(
  request: Request,
  acmeChallengeTxtRecord?: string,
): Promise<Response> {
  const url = new URL(request.url);

  // 1. ACME DNS-01 Challenge Endpoint for Let's Encrypt automated renewals
  if (
    url.pathname === "/.well-known/acme-challenge" ||
    url.pathname === "/acme-challenge"
  ) {
    if (acmeChallengeTxtRecord) {
      return new Response(acmeChallengeTxtRecord, {
        headers: { "content-type": "text/plain" },
      });
    }
    return new Response("No ACME challenge active", { status: 404 });
  }

  // 2. DNS-over-HTTPS (DoH) / JSON DNS Query API
  const name = url.searchParams.get("name") || url.hostname;
  const { ip, status } = resolveLanDnsQuery(name);

  if (status !== 0 || !ip) {
    const nxdomainResp: DnsResponse = {
      Status: 3,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Question: [{ name, type: 1 }],
    };
    return new Response(JSON.stringify(nxdomainResp), {
      status: 404,
      headers: {
        "content-type": "application/dns-json",
        "cache-control": "no-store",
      },
    });
  }

  const successResp: DnsResponse = {
    Status: 0,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
    Question: [{ name, type: 1 }],
    Answer: [
      {
        name,
        type: 1, // A record
        TTL: 300,
        data: ip,
      },
    ],
  };

  return new Response(JSON.stringify(successResp), {
    status: 200,
    headers: {
      "content-type": "application/dns-json",
      "cache-control": "public, max-age=300",
    },
  });
}

export default {
  async fetch(
    request: Request,
    env?: { ACME_CHALLENGE?: string },
  ): Promise<Response> {
    return handleDnsWorkerRequest(request, env?.ACME_CHALLENGE);
  },
};
