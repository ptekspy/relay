import type { DiagnosticTreeNode } from "./types.js";

export class RelayPairingDiagnosticTree {
  private static readonly NODES: Record<string, DiagnosticTreeNode> = {
    start: {
      id: "start",
      question:
        "Are your mobile device and computer on the exact same Wi-Fi network?",
      yesNextId: "check_ping",
      noNextId: "switch_wifi",
    },
    switch_wifi: {
      id: "switch_wifi",
      question:
        "Action: Switch both devices to the same Wi-Fi SSID, or enable Relay Cloud Edge Tunneling via `relay dev --tunnel`.",
      remediationAdvice:
        "Run `relay dev --tunnel` to establish a secure edge bridge bypassing local network isolation.",
    },
    check_ping: {
      id: "check_ping",
      question:
        "Does your router enable Client Isolation (AP Isolation) blocking inter-device communication?",
      yesNextId: "disable_isolation",
      noNextId: "check_firewall",
    },
    disable_isolation: {
      id: "disable_isolation",
      question:
        "Action: Disable 'AP Isolation' or 'Guest Network Mode' in your router admin settings, or use `--tunnel`.",
      remediationAdvice:
        "Router isolation prevents LAN peer-to-peer traffic. Use `--tunnel` or connect mobile via USB reverse port forwarding.",
    },
    check_firewall: {
      id: "check_firewall",
      question:
        "Does your computer's OS firewall allow incoming connections on port 7331?",
      yesNextId: "success_state",
      noNextId: "allow_port",
    },
    allow_port: {
      id: "allow_port",
      question:
        "Action: Allow incoming TCP traffic on port 7331 in macOS Application Firewall or Windows Defender.",
      remediationAdvice:
        "Run: `sudo ufw allow 7331/tcp` on Linux, or approve Relay CLI in macOS Firewall prompt.",
    },
    success_state: {
      id: "success_state",
      question:
        "Connection diagnostic passed! Scan the terminal QR code or open http://relay.live in your mobile browser.",
      remediationAdvice:
        "All local checks passed. Device pairing should be immediate (< 50ms).",
    },
  };

  public getNode(id: string): DiagnosticTreeNode | undefined {
    return RelayPairingDiagnosticTree.NODES[id];
  }

  public getRootNode(): DiagnosticTreeNode {
    return RelayPairingDiagnosticTree.NODES.start!;
  }
}

export const relayPairingDiagnosticTree = new RelayPairingDiagnosticTree();
