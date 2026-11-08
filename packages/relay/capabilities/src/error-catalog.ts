export interface RelayDiagnosticError {
  code: string;
  title: string;
  description: string;
  actionableSteps: string[];
}

export const RELAY_DIAGNOSTIC_ERRORS: Record<string, RelayDiagnosticError> = {
  ERR_AUTH_EXPIRED: {
    code: "ERR_AUTH_EXPIRED",
    title: "Session Expired",
    description:
      "The authentication token or pairing session for this connection has reached its TTL.",
    actionableSteps: [
      "Scan the fresh QR code on your host terminal",
      "Ensure device clock is synchronized with network time",
      "Re-run `relay <port>` if the host process terminated",
    ],
  },
  ERR_PORT_BLOCKED: {
    code: "ERR_PORT_BLOCKED",
    title: "Upstream Dev Server Unreachable",
    description:
      "Relay could not establish a connection to your local development server on the specified port.",
    actionableSteps: [
      "Check that your dev server (e.g. Next.js, Vite) is actively running",
      "Verify the target port number matches your running server",
      "Ensure the dev server is bound to localhost or 0.0.0.0",
    ],
  },
  ERR_FIREWALL_BLOCKED: {
    code: "ERR_FIREWALL_BLOCKED",
    title: "Firewall Blocking Inbound Connections",
    description:
      "Inbound traffic on port 7331 is being rejected by your operating system firewall.",
    actionableSteps: [
      "Run the remediation command displayed in your CLI preflight check",
      "Temporarily verify if turning off private firewall allows connection",
      "Check that your router does not have AP Isolation enabled",
    ],
  },
  ERR_LAN_INTERFACE_MISSING: {
    code: "ERR_LAN_INTERFACE_MISSING",
    title: "No Reachable Local Network Found",
    description:
      "Relay could not discover a valid IPv4 address on any active network interface.",
    actionableSteps: [
      "Verify that your host machine is connected to Wi-Fi or Ethernet",
      "If using a VPN, ensure local network sharing is permitted",
      "Check for active network adapters in system settings",
    ],
  },
  ERR_RATE_LIMITED: {
    code: "ERR_RATE_LIMITED",
    title: "Rate Limit Exceeded",
    description:
      "Too many unauthenticated connection attempts from this IP address within a short period.",
    actionableSteps: [
      "Wait 60 seconds for the rate limit window to reset",
      "Ensure you are scanning the latest QR code rather than an old bookmark",
    ],
  },
  ERR_TUNNEL_TIMEOUT: {
    code: "ERR_TUNNEL_TIMEOUT",
    title: "Remote Tunnel Connection Timed Out",
    description:
      "The secure tunnel could not establish a handshake with the edge signaling gateway.",
    actionableSteps: [
      "Check your internet connection",
      "Verify corporate proxies or deep-packet-inspection firewalls permit WSS traffic",
      "Retry connecting to an alternate edge region",
    ],
  },
};

export function getDiagnosticError(code: string): RelayDiagnosticError {
  return (
    RELAY_DIAGNOSTIC_ERRORS[code] ?? {
      code,
      title: "Unexpected Protocol Error",
      description: `An unrecognized protocol condition occurred (${code}).`,
      actionableSteps: [
        "Check the host terminal logs for detailed stack traces",
        "Restart the Relay session",
      ],
    }
  );
}
