import { Box, Text, useInput } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import type { PortStatus } from "../firewall/types.js";
import {
  type RelaySession,
  renderTerminalQr,
  type TerminalQrSize,
} from "../session.js";

export interface ConnectedClient {
  ip: string;
  userAgent?: string;
  connectedAt: number;
}

interface PairingViewProps {
  session: RelaySession;
  gatewayPort: number;
  targetPort: number;
  lanIp?: string;
  connectedClients: ConnectedClient[];
  initialQrSize?: TerminalQrSize;
  firewallPortStatus?: PortStatus;
  remediationCommand?: string;
  onRemediateFirewall?: () => Promise<void>;
}

export const PairingView: React.FC<PairingViewProps> = ({
  session,
  gatewayPort,
  targetPort,
  lanIp,
  connectedClients,
  initialQrSize = "compact",
  firewallPortStatus,
  remediationCommand,
  onRemediateFirewall,
}) => {
  const [qrSize, setQrSize] = useState<TerminalQrSize>(initialQrSize);
  const [qrCode, setQrCode] = useState<string>("Generating QR code...");
  const [isRemediating, setIsRemediating] = useState(false);
  const [remediationMsg, setRemediationMsg] = useState<string | null>(null);

  useInput((input) => {
    if (input.toLowerCase() === "l") {
      setQrSize((prev) => (prev === "compact" ? "large" : "compact"));
    }

    if (
      input.toLowerCase() === "f" &&
      firewallPortStatus === "blocked" &&
      onRemediateFirewall &&
      !isRemediating
    ) {
      setIsRemediating(true);
      setRemediationMsg("Configuring firewall...");
      onRemediateFirewall()
        .then(() => {
          setRemediationMsg("Firewall rule successfully configured!");
        })
        .catch((err) => {
          setRemediationMsg(
            `Failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        })
        .finally(() => {
          setIsRemediating(false);
        });
    }
  });

  useEffect(() => {
    renderTerminalQr(session.connectionUrl, qrSize)
      .then(setQrCode)
      .catch(() => setQrCode("Failed to generate QR code"));
  }, [session.connectionUrl, qrSize]);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      padding={1}
      marginY={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          Connect Mobile Receiver
        </Text>
        <Text color="yellow">
          Size: <Text bold>{qrSize.toUpperCase()}</Text> (press{" "}
          <Text bold color="white">
            [l]
          </Text>{" "}
          to toggle)
        </Text>
      </Box>

      <Text color="gray">
        Scan the QR code with your tablet/phone camera. If your camera
        struggles, press [l] for high-contrast large mode.
      </Text>

      {/* Firewall Warning Banner */}
      {firewallPortStatus === "blocked" && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="red"
          paddingX={1}
          marginY={1}
        >
          <Text bold color="red">
            ⚠️ Firewall Warning: Inbound LAN port {gatewayPort} is blocked
          </Text>
          <Text color="yellow">
            Run command:{" "}
            <Text bold color="white">
              {remediationCommand}
            </Text>
          </Text>
          <Text color="gray">
            {remediationMsg ??
              "Press [f] to automatically configure this rule (requires sudo/administrator)"}
          </Text>
        </Box>
      )}

      {remediationMsg && firewallPortStatus !== "blocked" && (
        <Box borderStyle="single" borderColor="green" paddingX={1} marginY={1}>
          <Text color="green">✓ {remediationMsg}</Text>
        </Box>
      )}

      <Box
        flexDirection={qrSize === "large" ? "column" : "row"}
        gap={qrSize === "large" ? 1 : 3}
        marginTop={1}
        alignItems="flex-start"
      >
        {/* QR Code Container */}
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          <Text>{qrCode}</Text>
        </Box>

        {/* Pairing Information */}
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column">
            <Text color="gray">Short Code:</Text>
            <Text bold color="green">
              {session.shortCode}
            </Text>
          </Box>

          <Box flexDirection="column">
            <Text color="gray">Gateway LAN URL:</Text>
            <Text bold color="white">
              {lanIp
                ? `http://${lanIp}:${gatewayPort}`
                : `http://127.0.0.1:${gatewayPort}`}
            </Text>
          </Box>

          <Box flexDirection="column">
            <Text color="gray">Target Port (Local Dev Server):</Text>
            <Text color="cyan">localhost:{targetPort}</Text>
          </Box>

          <Box flexDirection="column">
            <Text color="gray">Session ID:</Text>
            <Text color="gray">{session.id}</Text>
          </Box>

          {/* Connected Clients Feedback */}
          {connectedClients.length > 0 ? (
            <Box
              flexDirection="column"
              marginTop={1}
              borderStyle="single"
              borderColor="green"
              paddingX={1}
            >
              <Text bold color="green">
                Connected Devices ({connectedClients.length}):
              </Text>
              {connectedClients.map((client) => (
                <Text key={`${client.ip}-${client.connectedAt}`} color="white">
                  • {client.ip.replace(/^.*:/, "")}{" "}
                  {client.userAgent
                    ? `(${client.userAgent.slice(0, 30)}...)`
                    : ""}
                </Text>
              ))}
            </Box>
          ) : (
            <Box marginTop={1}>
              <Text dimColor>Awaiting device connection...</Text>
            </Box>
          )}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          [l] Toggle QR size{" "}
          {firewallPortStatus === "blocked" ? "| [f] Fix firewall " : ""}| [Esc]
          Return to menu
        </Text>
      </Box>
    </Box>
  );
};
