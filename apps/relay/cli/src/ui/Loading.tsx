import { Box, Text } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import type { CliConfig } from "../args.js";
import {
  collectSystemInfo,
  type PreflightResult,
  runPreflightChecks,
} from "../preflight.js";

const RELAY_DOT_COLORS = [
  "#548eff", // blue
  "#a864fd", // violet
  "#f443a4", // magenta
] as const;

interface LoadingProps {
  config: CliConfig;
  onLoaded: (preflight: PreflightResult) => void;
}

export const Loading: React.FC<LoadingProps> = ({ config, onLoaded }) => {
  const [activeDot, setActiveDot] = useState(0);

  // Pulse animation cycling across the three dots
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % RELAY_DOT_COLORS.length);
    }, 280);

    return () => clearInterval(timer);
  }, []);

  // Run preflight and minimum 3s timer concurrently
  useEffect(() => {
    let mounted = true;

    const minimumDelay = new Promise((resolve) => setTimeout(resolve, 3000));
    const preflightTask = runPreflightChecks(config);

    Promise.allSettled([minimumDelay, preflightTask]).then((results) => {
      if (!mounted) return;

      const preflightSettled = results[1];
      const preflight: PreflightResult =
        preflightSettled?.status === "fulfilled"
          ? preflightSettled.value
          : {
              system: collectSystemInfo(),
              isOnline: false,
              apiHealthy: false,
              lan: null,
              targetPortActive: false,
              firewall: { type: "none", enabled: false },
            };

      onLoaded(preflight);
    });

    return () => {
      mounted = false;
    };
  }, [config, onLoaded]);

  return (
    <Box padding={1} flexDirection="row" alignItems="center" gap={1}>
      <Text bold color="white">
        relay
      </Text>
      <Box flexDirection="row" gap={1}>
        {RELAY_DOT_COLORS.map((color, idx) => {
          const isActive = idx === activeDot;
          return (
            <Text
              key={color}
              bold={isActive}
              color={color}
              dimColor={!isActive}
            >
              ●
            </Text>
          );
        })}
      </Box>
    </Box>
  );
};
