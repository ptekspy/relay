import { Box, Text } from "ink";
import type React from "react";
import type { ConnectedReceiver } from "../receiver-pool.js";

export interface ReceiverViewProps {
  receivers: ConnectedReceiver[];
  onDisconnectReceiver?: (id: string) => void;
}

export const ReceiverView: React.FC<ReceiverViewProps> = ({
  receivers,
  onDisconnectReceiver: _onDisconnectReceiver,
}) => {
  if (receivers.length === 0) {
    return (
      <Box
        flexDirection="column"
        padding={1}
        borderStyle="round"
        borderColor="gray"
      >
        <Text color="gray">No receivers currently connected.</Text>
        <Text dimColor>Scan the QR code on your mobile device to connect.</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="cyan"
    >
      <Text bold color="cyan">
        Connected Devices ({receivers.length})
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {receivers.map((rec, index) => {
          const activeSecAgo = Math.round(
            (Date.now() - rec.lastActiveAt) / 1000,
          );
          return (
            <Box
              key={rec.id}
              flexDirection="row"
              justifyContent="space-between"
            >
              <Text>
                <Text color="yellow">[{index + 1}]</Text>{" "}
                <Text bold>{rec.ip}</Text>
                <Text dimColor> - {rec.userAgent.slice(0, 32)}</Text>
              </Text>
              <Text color="green">{activeSecAgo}s ago</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
