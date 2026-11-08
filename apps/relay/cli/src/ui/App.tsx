import { Box, Text, useApp, useInput } from "ink";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CliConfig } from "../args.js";
import {
  auditGatewayPortFirewall,
  type FirewallPortCheckResult,
} from "../firewall/index.js";
import { type RelayGateway, startRelayGateway } from "../gateway.js";
import {
  handlePostPreflightAction,
  type PreflightResult,
} from "../preflight.js";
import { createSession, type RelaySession } from "../session.js";
import { Header } from "./Header.js";
import { Loading } from "./Loading.js";
import { Menu, type MenuItem } from "./Menu.js";
import { type ConnectedClient, PairingView } from "./PairingView.js";
import { PortWaiting } from "./PortWaiting.js";
import { ReceiverView } from "./ReceiverView.js";
import { ReplayView } from "./ReplayView.js";

const MENU_ITEMS: MenuItem[] = [
  {
    id: "pair",
    label: "Pair Device (QR)",
    description: "Scan QR code or use short code to connect receiver",
  },
  {
    id: "receivers",
    label: "Connected Receivers",
    description: "Manage connected physical devices and inspect latency",
  },
  {
    id: "replay",
    label: "Replay & Feedback",
    description:
      "Inspect recorded session events, timeline feedback pins, and playback",
  },
  {
    id: "status",
    label: "Relay Status",
    description: "View connection, gateway, firewall, and node status",
  },
  {
    id: "stream",
    label: "Stream Events",
    description: "Tail active message pipeline",
  },
  {
    id: "config",
    label: "Configuration",
    description: "Inspect active CLI arguments and system info",
  },
];

interface AppProps {
  config: CliConfig;
}

export const App: React.FC<AppProps> = ({ config }) => {
  const { exit } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isPortWaiting, setIsPortWaiting] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeItem, setActiveItem] = useState<MenuItem | null>({
    id: "pair",
    label: "Pair Device (QR)",
    description: "Scan QR code or use short code to connect receiver",
  });
  const [gateway, setGateway] = useState<RelayGateway | null>(null);
  const [connectedClients, setConnectedClients] = useState<ConnectedClient[]>(
    [],
  );
  const [firewallAudit, setFirewallAudit] =
    useState<FirewallPortCheckResult | null>(null);

  const gatewayRef = useRef<RelayGateway | null>(null);
  gatewayRef.current = gateway;

  const lanHost = useMemo(() => {
    return preflight?.lan?.ip ?? config.host ?? "127.0.0.1";
  }, [preflight?.lan?.ip, config.host]);

  const preferredGatewayPort = config.gatewayPort ?? 7331;

  // Initial session identity
  const [session] = useState<RelaySession>(() =>
    createSession(lanHost, preferredGatewayPort),
  );

  // Update session connection URL when host or gateway port is determined
  const effectiveSession = useMemo<RelaySession>(() => {
    const port = gateway?.port ?? preferredGatewayPort;
    const protocol = gateway?.isHttps || config.https ? "https" : "http";
    const host = gateway?.lanDomain ?? lanHost;
    return {
      ...session,
      connectionUrl: `${protocol}://${host}:${port}/?relay_token=${session.token}`,
    };
  }, [
    session,
    lanHost,
    gateway?.port,
    gateway?.isHttps,
    gateway?.lanDomain,
    config.https,
    preferredGatewayPort,
  ]);

  const initGateway = async () => {
    if (gatewayRef.current) return;
    try {
      const gw = await startRelayGateway({
        preferredPort: preferredGatewayPort,
        targetPort: config.port,
        sessionToken: session.token,
        host: lanHost,
        enableHttps: config.https,
        lanIp: lanHost,
        lanApexDomain: config.lanDomain,
        onClientConnected: (ip, userAgent) => {
          setConnectedClients((prev) => [
            ...prev,
            { ip, userAgent, connectedAt: Date.now() },
          ]);
        },
      });
      setGateway(gw);

      // Perform inbound firewall audit on the actual assigned gateway port
      const audit = await auditGatewayPortFirewall(gw.port);
      setFirewallAudit(audit);
    } catch (err) {
      console.error("Failed to start Relay gateway:", err);
    }
  };

  const handleLoaded = (result: PreflightResult) => {
    setPreflight(result);
    setIsLoading(false);

    if (!result.targetPortActive) {
      setIsPortWaiting(true);
    } else {
      void initGateway();
      void handlePostPreflightAction(config, result, {
        sessionId: effectiveSession.id,
        token: effectiveSession.token,
        shortCode: effectiveSession.shortCode,
        targetPort: config.port,
        gatewayPort: gateway?.port ?? 7331,
        host: result.lan?.ip || "127.0.0.1",
      });
    }
  };

  const handlePortReady = () => {
    setIsPortWaiting(false);
    if (preflight) {
      const updated = { ...preflight, targetPortActive: true };
      setPreflight(updated);
      void initGateway();
      void handlePostPreflightAction(config, updated, {
        sessionId: effectiveSession.id,
        token: effectiveSession.token,
        shortCode: effectiveSession.shortCode,
        targetPort: config.port,
        gatewayPort: gateway?.port ?? 7331,
        host: updated.lan?.ip || "127.0.0.1",
      });
    }
  };

  const handleRemediateFirewall = async () => {
    if (!firewallAudit) return;
    const activePort = gateway?.port ?? preferredGatewayPort;
    const res = await firewallAudit.adapter.allowPort(activePort);
    if (!res.success) {
      throw new Error(res.message);
    }
    const fresh = await auditGatewayPortFirewall(
      activePort,
      firewallAudit.adapter,
    );
    setFirewallAudit(fresh);
  };

  // Graceful shutdown on unmount
  useEffect(() => {
    return () => {
      if (gatewayRef.current) {
        void gatewayRef.current.close();
      }
    };
  }, []);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      if (gatewayRef.current) {
        void gatewayRef.current.close();
      }
      exit();
      return;
    }

    if (isLoading || isPortWaiting) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : MENU_ITEMS.length - 1));
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < MENU_ITEMS.length - 1 ? prev + 1 : 0));
    }

    if (key.return) {
      setActiveItem(MENU_ITEMS[selectedIndex] ?? null);
    }

    if (key.escape) {
      setActiveItem(null);
    }
  });

  if (isLoading) {
    return <Loading config={config} onLoaded={handleLoaded} />;
  }

  if (isPortWaiting) {
    return (
      <PortWaiting
        port={config.port}
        host={config.host ?? "127.0.0.1"}
        onPortReady={handlePortReady}
      />
    );
  }

  const connectionStatus =
    preflight?.isOnline && preflight?.apiHealthy ? "connected" : "offline";

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        status={connectionStatus}
        version="0.0.1"
        port={config.port}
        lanIp={preflight?.lan?.ip}
      />

      {gateway?.displacedFromPreferred && (
        <Box borderStyle="single" borderColor="yellow" paddingX={1} marginY={1}>
          <Text color="yellow">
            Notice: Preferred port {gateway.displacedFromPreferred} was
            occupied. Relay bound to {gateway.port}. If an OS firewall rule only
            permits {gateway.displacedFromPreferred}, allow {gateway.port} or
            run with --gateway-port {gateway.displacedFromPreferred}.
          </Text>
        </Box>
      )}

      {activeItem ? (
        activeItem.id === "pair" ? (
          <PairingView
            session={effectiveSession}
            gatewayPort={gateway?.port ?? preferredGatewayPort}
            targetPort={config.port}
            lanIp={preflight?.lan?.ip}
            connectedClients={connectedClients}
            initialQrSize={config.largeQr ? "large" : "compact"}
            firewallPortStatus={firewallAudit?.portStatus}
            remediationCommand={firewallAudit?.remediationCommand}
            onRemediateFirewall={handleRemediateFirewall}
          />
        ) : (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="green"
            padding={1}
            marginY={1}
          >
            <Text bold color="green">
              {activeItem.label}
            </Text>
            <Text color="gray">{activeItem.description}</Text>

            {activeItem.id === "receivers" && (
              <Box marginTop={1}>
                <ReceiverView
                  receivers={gateway?.receiverPool?.getAll() ?? []}
                  onDisconnectReceiver={(id) =>
                    gateway?.receiverPool?.remove(id)
                  }
                />
              </Box>
            )}

            {activeItem.id === "replay" && (
              <Box marginTop={1}>
                <ReplayView session={effectiveSession} gateway={gateway} />
              </Box>
            )}

            {activeItem.id === "status" && preflight && (
              <Box flexDirection="column" marginTop={1}>
                <Text>
                  Local Dev Target:{" "}
                  <Text color="green">127.0.0.1:{config.port} (Active)</Text>
                </Text>
                <Text>
                  Relay Gateway:{" "}
                  <Text color="cyan">
                    {gateway
                      ? `http://${lanHost}:${gateway.port} (Listening on LAN)`
                      : "Starting..."}
                  </Text>
                </Text>
                <Text>
                  Host Firewall:{" "}
                  <Text
                    color={
                      firewallAudit?.firewallActive
                        ? firewallAudit.portStatus === "blocked"
                          ? "red"
                          : "green"
                        : "gray"
                    }
                  >
                    {firewallAudit?.firewallActive
                      ? `${firewallAudit.adapter.name} (${firewallAudit.portStatus.toUpperCase()})`
                      : "None / Inactive"}
                  </Text>
                </Text>
                {firewallAudit?.portStatus === "blocked" && (
                  <Text color="yellow">
                    {" "}
                    Fix command: {firewallAudit.remediationCommand}
                  </Text>
                )}
                <Text>
                  LAN Interface:{" "}
                  <Text color="white">
                    {preflight.lan
                      ? `${preflight.lan.ip} (${preflight.lan.interfaceName})`
                      : "Localhost only"}
                  </Text>
                </Text>
                <Text>
                  Internet Connection:{" "}
                  <Text color={preflight.isOnline ? "green" : "red"}>
                    {preflight.isOnline ? "Online" : "Offline"}
                  </Text>
                </Text>
                <Text>
                  Relay Cloud API:{" "}
                  <Text color={preflight.apiHealthy ? "green" : "red"}>
                    {preflight.apiHealthy ? "Healthy" : "Unreachable"}
                  </Text>
                </Text>
                <Text>
                  Connected Receivers:{" "}
                  <Text color={connectedClients.length > 0 ? "green" : "gray"}>
                    {connectedClients.length}
                  </Text>
                </Text>
              </Box>
            )}

            {activeItem.id === "config" && (
              <Box flexDirection="column" marginTop={1}>
                <Text bold color="white">
                  CLI Options:
                </Text>
                <Text>
                  {" "}
                  Target Port: <Text color="cyan">{config.port}</Text>
                </Text>
                <Text>
                  {" "}
                  Gateway Port:{" "}
                  <Text color="cyan">
                    {gateway?.port ?? preferredGatewayPort}{" "}
                    {config.gatewayPort ? "(explicit)" : "(default)"}
                  </Text>
                </Text>
                <Text>
                  {" "}
                  Host IP:{" "}
                  <Text color="cyan">{config.host ?? "auto (127.0.0.1)"}</Text>
                </Text>
                <Text>
                  {" "}
                  Browser Launch:{" "}
                  <Text color="cyan">
                    {config.noBrowser ? "disabled (--no-browser)" : "enabled"}
                  </Text>
                </Text>
                <Text>
                  {" "}
                  Large QR Mode:{" "}
                  <Text color="cyan">
                    {config.largeQr
                      ? "enabled (--large-qr)"
                      : "disabled (press [l] in pairing view to toggle)"}
                  </Text>
                </Text>

                {preflight && (
                  <>
                    <Box marginTop={1}>
                      <Text bold color="white">
                        System Info:
                      </Text>
                    </Box>
                    <Text>
                      {" "}
                      Runtime:{" "}
                      <Text color="cyan">
                        {preflight.system.runtime.name} v
                        {preflight.system.runtime.version}
                      </Text>
                    </Text>
                    <Text>
                      {" "}
                      Platform:{" "}
                      <Text color="gray">{preflight.system.platform}</Text>
                    </Text>
                    <Text>
                      {" "}
                      Arch: <Text color="gray">{preflight.system.arch}</Text>
                    </Text>
                    <Text>
                      {" "}
                      Hostname:{" "}
                      <Text color="gray">{preflight.system.hostname}</Text>
                    </Text>
                    <Text>
                      {" "}
                      CPUs:{" "}
                      <Text color="gray">{preflight.system.cpuCount}</Text>
                    </Text>
                    <Text>
                      {" "}
                      Memory:{" "}
                      <Text color="gray">
                        {preflight.system.memoryMb.free} MB free /{" "}
                        {preflight.system.memoryMb.total} MB total
                      </Text>
                    </Text>
                    <Text>
                      {" "}
                      Firewall:{" "}
                      <Text color="gray">
                        {firewallAudit?.adapter.name ?? preflight.firewall.type}{" "}
                        ({firewallAudit?.firewallActive ? "active" : "inactive"}
                        )
                      </Text>
                    </Text>
                  </>
                )}
              </Box>
            )}

            <Box marginTop={1}>
              <Text dimColor>Press [Esc] to return to menu</Text>
            </Box>
          </Box>
        )
      ) : (
        <Menu items={MENU_ITEMS} selectedIndex={selectedIndex} />
      )}

      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        justifyContent="space-between"
      >
        <Text dimColor>
          Gateway: {gateway?.port ?? preferredGatewayPort} | Target:{" "}
          {config.port} | Code: {session.shortCode} | [l] Large QR{" "}
          {firewallAudit?.portStatus === "blocked" ? "| [f] Fix Firewall " : ""}
          | [Esc] Menu | [q] Quit
        </Text>
      </Box>
    </Box>
  );
};
