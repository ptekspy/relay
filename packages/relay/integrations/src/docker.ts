/**
 * Docker Container & Port Mapping Auto-Detector
 *
 * Detects whether execution is running inside a Docker container and resolves
 * port mappings (container port -> host port) and accessible gateway/LAN IPs.
 *
 * Note for Octavia: This enables Relay pairing when dev servers run inside Docker or Compose.
 */

import { existsSync, readFileSync } from "node:fs";

export interface DockerPortBinding {
  containerPort: number;
  hostPort: number;
  hostIp: string;
}

export interface DockerEnvironmentInfo {
  isInsideContainer: boolean;
  containerId: string | null;
  gatewayIp: string;
  hostAccessibleIp: string;
}

export class DockerPortDetector {
  /**
   * Checks if current process is running inside a Docker container.
   */
  public static isRunningInContainer(checkFiles = true): boolean {
    if (!checkFiles) return false;

    if (existsSync("/.dockerenv")) {
      return true;
    }

    try {
      if (existsSync("/proc/1/cgroup")) {
        const cgroup = readFileSync("/proc/1/cgroup", "utf-8");
        return cgroup.includes("docker") || cgroup.includes("containerd");
      }
    } catch {
      // Fallback
    }

    return false;
  }

  /**
   * Resolves Docker port bindings from Docker engine inspect JSON output.
   */
  public static parsePortBindings(
    portMapJson: Record<
      string,
      Array<{ HostIp: string; HostPort: string }> | null
    >,
  ): DockerPortBinding[] {
    const bindings: DockerPortBinding[] = [];

    for (const [key, mapping] of Object.entries(portMapJson)) {
      if (!mapping || mapping.length === 0) continue;

      const containerPortMatch = key.match(/^(\d+)/);
      if (!containerPortMatch || !containerPortMatch[1]) continue;
      const containerPort = Number.parseInt(containerPortMatch[1], 10);

      for (const entry of mapping) {
        const hostPort = Number.parseInt(entry.HostPort, 10);
        if (!Number.isNaN(hostPort)) {
          bindings.push({
            containerPort,
            hostPort,
            hostIp: entry.HostIp || "0.0.0.0",
          });
        }
      }
    }

    return bindings;
  }

  /**
   * Resolves target port to external host port if mapped.
   */
  public static resolveHostPort(
    targetPort: number,
    bindings: DockerPortBinding[],
  ): number {
    const match = bindings.find((b) => b.containerPort === targetPort);
    return match ? match.hostPort : targetPort;
  }

  /**
   * Determines the optimal IP address for physical devices connecting to the service.
   */
  public static resolveReachableHostIp(
    inContainer: boolean,
    hostLanIp: string,
    defaultGateway = "172.17.0.1",
  ): string {
    // If inside container, host dev machine is at gateway / host.docker.internal,
    // but mobile receiver connecting over LAN needs the host's actual LAN IP.
    if (inContainer) {
      return hostLanIp || defaultGateway;
    }
    return hostLanIp || "127.0.0.1";
  }
}
