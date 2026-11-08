import { networkInterfaces } from "node:os";

export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  family: "IPv4" | "IPv6";
  isInternal: boolean;
  isVirtual: boolean;
  priority: number;
}

const VIRTUAL_PREFIXES = [
  "docker",
  "veth",
  "br-",
  "virbr",
  "cni",
  "flannel",
  "tailscale",
  "wg",
  "tun",
  "tap",
];

export function discoverNetworkInterfaces(): NetworkInterfaceInfo[] {
  const nets = networkInterfaces();
  const results: NetworkInterfaceInfo[] = [];

  for (const [name, netList] of Object.entries(nets)) {
    if (!netList) continue;

    const lowerName = name.toLowerCase();
    const isVirtual = VIRTUAL_PREFIXES.some((prefix) =>
      lowerName.startsWith(prefix),
    );

    for (const net of netList) {
      if (net.family !== "IPv4") continue; // Prioritize IPv4 for local mobile pairing

      let priority = 10;
      if (net.internal) {
        priority = 0;
      } else if (isVirtual) {
        priority = 20;
      } else if (
        lowerName.startsWith("wl") ||
        lowerName.startsWith("en") ||
        lowerName.startsWith("eth")
      ) {
        priority = 100; // Physical Wi-Fi or Ethernet
      }

      results.push({
        name,
        ip: net.address,
        family: net.family,
        isInternal: net.internal,
        isVirtual,
        priority,
      });
    }
  }

  // Sort descending by priority
  return results.sort((a, b) => b.priority - a.priority);
}

export function getPrimaryLanIp(): string {
  const interfaces = discoverNetworkInterfaces();
  const physical = interfaces.find(
    (i) => !i.isInternal && !i.isVirtual && i.priority >= 50,
  );
  if (physical) return physical.ip;

  const nonInternal = interfaces.find((i) => !i.isInternal);
  if (nonInternal) return nonInternal.ip;

  return "127.0.0.1";
}
