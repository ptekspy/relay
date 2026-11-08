"use client";

import type { ConsoleEvent } from "@paddy-systems/relay-protocol";
import { useEffect, useRef, useState } from "react";

export interface ViewportSandboxProps {
  srcUrl: string;
  isLandscape?: boolean;
  onLogReceived?: (log: ConsoleEvent) => void;
  onNetworkPing?: (latencyMs: number) => void;
}

export function ViewportSandbox({
  srcUrl,
  isLandscape = false,
  onLogReceived,
  onNetworkPing,
}: ViewportSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Network offline/online listeners (TASK-028)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Periodic latency measurement (TASK-027)
  useEffect(() => {
    const interval = setInterval(() => {
      const start = performance.now();
      fetch("/api/health", { method: "HEAD", cache: "no-store" })
        .then(() => {
          const latency = Math.round(performance.now() - start);
          onNetworkPing?.(latency);
        })
        .catch(() => {
          onNetworkPing?.(-1);
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [onNetworkPing]);

  // Handle postMessage from child iframe if injected
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "RELAY_CONSOLE_LOG") {
        onLogReceived?.(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLogReceived]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* Offline banner */}
      {!isOnline && (
        <div className="absolute top-0 inset-x-0 z-30 py-2 px-4 bg-rose-600 text-white text-xs font-semibold text-center animate-pulse">
          Connection lost. Reconnecting to local Relay Gateway...
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-mono text-zinc-400">
            Loading dev server...
          </p>
        </div>
      )}

      {/* Target iframe */}
      <iframe
        ref={iframeRef}
        src={srcUrl}
        onLoad={() => setIsLoading(false)}
        className={`w-full h-full border-none transition-all duration-300 ${
          isLandscape ? "max-w-[1024px] aspect-video" : "max-w-full"
        }`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title="Relay Viewport Sandbox"
      />
    </div>
  );
}
