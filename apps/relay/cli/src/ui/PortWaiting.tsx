import { Box, Text, useApp, useInput } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import { checkPortReachable } from "../networking.js";

interface PortWaitingProps {
  port: number;
  host?: string;
  onPortReady: () => void;
}

export const PortWaiting: React.FC<PortWaitingProps> = ({
  port,
  host = "127.0.0.1",
  onPortReady,
}) => {
  const { exit } = useApp();
  const [isWaiting, setIsWaiting] = useState(false);
  const [pulse, setPulse] = useState(false);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    if (!isWaiting && input === "w") {
      setIsWaiting(true);
    }
  });

  // Polling loop when user chooses to wait
  useEffect(() => {
    if (!isWaiting) return;

    let mounted = true;

    const interval = setInterval(async () => {
      setPulse((prev) => !prev);
      const isReachable = await checkPortReachable(port, host, 600);

      if (isReachable && mounted) {
        clearInterval(interval);
        onPortReady();
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isWaiting, port, host, onPortReady]);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="yellow"
    >
      <Box flexDirection="row" gap={1} marginBottom={1}>
        <Text bold color="yellow">
          No service detected on port {port}
        </Text>
      </Box>

      <Text color="gray">
        Relay is ready to share your local environment, but nothing is currently
        accepting connections on{" "}
        <Text color="white">
          {host}:{port}
        </Text>
        .
      </Text>

      {isWaiting ? (
        <Box flexDirection="column" marginTop={1}>
          <Box flexDirection="row" gap={1}>
            <Text color="cyan">{pulse ? "●" : "○"}</Text>
            <Text color="white">
              Waiting for service on {host}:{port} to come online...
            </Text>
          </Box>
          <Text dimColor>
            Polling every second. Start your local server, or press [q] to quit.
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1} gap={1}>
          <Text color="white">What would you like to do?</Text>
          <Box flexDirection="column" marginLeft={1}>
            <Text>
              <Text bold color="cyan">
                [w]
              </Text>{" "}
              Wait for local server to start (auto-resumes when ready)
            </Text>
            <Text>
              <Text bold color="red">
                [q]
              </Text>{" "}
              Quit Relay
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
