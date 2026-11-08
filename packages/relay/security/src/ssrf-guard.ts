export class SsrfTargetValidator {
  private static readonly BLOCKED_METADATA_IPS = [
    "169.254.169.254", // AWS/GCP/Azure link-local metadata
    "fd00:ec2::254", // AWS IPv6 metadata
    "0.0.0.0",
    "255.255.255.255",
  ];

  public isIpAllowedForTunnelRouting(
    ipOrHost: string,
    allowLoopback = true,
  ): boolean {
    const clean = ipOrHost.trim().toLowerCase();

    if (SsrfTargetValidator.BLOCKED_METADATA_IPS.includes(clean)) {
      return false;
    }

    // Loopback checks
    if (clean === "127.0.0.1" || clean === "localhost" || clean === "::1") {
      return allowLoopback;
    }

    // IPv4 RFC1918 private subnets
    const parts = clean.split(".").map(Number);
    if (
      parts.length === 4 &&
      parts.every((p) => !Number.isNaN(p) && p >= 0 && p <= 255)
    ) {
      const [b0, b1] = parts;
      if (b0 === 10) return false; // 10.0.0.0/8
      if (b0 === 172 && b1 !== undefined && b1 >= 16 && b1 <= 31) return false; // 172.16.0.0/12
      if (b0 === 192 && b1 === 168) return false; // 192.168.0.0/16
      if (b0 === 169 && b1 === 254) return false; // Link-local
    }

    return true;
  }
}

export const ssrfTargetValidator = new SsrfTargetValidator();
