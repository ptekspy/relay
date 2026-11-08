"use client";

import type { ConsoleEvent } from "@paddy-systems/relay-protocol";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ConsoleMirror } from "../../components/receiver/ConsoleMirror";
import { FloatingHud } from "../../components/receiver/FloatingHud";
import { ViewportSandbox } from "../../components/receiver/ViewportSandbox";

function ReceiverClient() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("target") ?? "/";

  const [logs, setLogs] = useState<ConsoleEvent[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [latencyMs, setLatencyMs] = useState(8);
  const [reloadKey, setReloadKey] = useState(0);

  const handleAddLog = (log: ConsoleEvent) => {
    setLogs((prev) => [log, ...prev].slice(0, 500));
  };

  const errorCount = logs.filter((l) => l.level === "error").length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <ViewportSandbox
        key={reloadKey}
        srcUrl={targetUrl}
        isLandscape={isLandscape}
        onLogReceived={handleAddLog}
        onNetworkPing={(ms) => setLatencyMs(ms >= 0 ? ms : 0)}
      />

      <FloatingHud
        isConnected={latencyMs >= 0}
        latencyMs={latencyMs}
        errorCount={errorCount}
        isConsoleOpen={isConsoleOpen}
        onToggleConsole={() => setIsConsoleOpen(!isConsoleOpen)}
        onReload={() => setReloadKey((k) => k + 1)}
        onToggleOrientation={() => setIsLandscape(!isLandscape)}
        isLandscape={isLandscape}
      />

      <ConsoleMirror
        logs={logs}
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        onClear={() => setLogs([])}
      />
    </div>
  );
}

export default function ReceiverPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <ReceiverClient />
    </Suspense>
  );
}
