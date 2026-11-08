import net from "node:net";
import os from "node:os";

export interface LanAddress {
  ip: string;
  interfaceName: string;
}

/**
 * Checks if a TCP port is actively listening and accepting connections.
 */
export function checkPortReachable(
  port: number,
  host = "127.0.0.1",
  timeoutMs = 500,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    const cleanup = () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => {
      cleanup();
      resolve(true);
    });

    socket.once("timeout", () => {
      cleanup();
      resolve(false);
    });

    socket.once("error", () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Detects the first non-internal IPv4 LAN address available on the machine.
 */
export function detectLanAddress(): LanAddress | null {
  const interfaces = os.networkInterfaces();

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return {
          ip: addr.address,
          interfaceName: name,
        };
      }
    }
  }

  return null;
}
