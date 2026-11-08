import { Box, Text } from "ink";
import type React from "react";

export interface HeaderProps {
  version?: string;
  status: "connected" | "connecting" | "offline";
  port: number;
  lanIp?: string;
}

const statusColors: Record<HeaderProps["status"], string> = {
  connected: "green",
  connecting: "yellow",
  offline: "red",
};

export const Header: React.FC<HeaderProps> = ({
  version = "0.0.1",
  status,
  port,
  lanIp,
}) => {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      marginBottom={1}
    >
      <Box gap={1}>
        <Text bold color="cyan">
          RELAY
        </Text>
        <Text color="gray">v{version}</Text>
        <Text color="gray">|</Text>
        <Text color="white">Port: {port}</Text>
        {lanIp && (
          <>
            <Text color="gray">|</Text>
            <Text color="gray">
              LAN: {lanIp}:{port}
            </Text>
          </>
        )}
      </Box>
      <Box gap={1}>
        <Text color="gray">Status:</Text>
        <Text color={statusColors[status]}>{status.toUpperCase()}</Text>
      </Box>
    </Box>
  );
};
