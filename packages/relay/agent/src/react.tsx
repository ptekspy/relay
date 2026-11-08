import { useEffect } from "react";
import type { RelayAgentConfig } from "./agent.js";
import { getRelayAgent, initRelayAgent } from "./agent.js";

export interface RelayAgentProps extends RelayAgentConfig {
  disabled?: boolean;
}

/**
 * Dev-only React component that auto-initializes the Relay Agent in the browser.
 * Renders null and automatically unmounts/cleans up when removed.
 */
export function RelayAgent({ disabled, ...config }: RelayAgentProps) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: dev-only init
  useEffect(() => {
    if (disabled || process.env.NODE_ENV === "production") {
      return;
    }

    initRelayAgent(config);

    return () => {
      // Do not stop globally on component hot-reload, but can detach emitter if specified
    };
  }, [disabled]);

  return null;
}

export { getRelayAgent, initRelayAgent };
