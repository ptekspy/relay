"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, use, useState } from "react";
import { ConnectionDetailsCard } from "@/components/connect/ConnectionDetailsCard";

interface ConnectedDevice {
  id: string;
  name: string;
  platform: "ios" | "android" | "desktop" | "cli";
  browser: string;
  ip: string;
  latencyMs: number;
  connectedAt: number;
  lastActiveAt: number;
}

const INITIAL_DEVICES: ConnectedDevice[] = [
  {
    id: "dev_local_1",
    name: "Apple iPhone 15 Pro",
    platform: "ios",
    browser: "Safari 17.4",
    ip: "192.168.1.42",
    latencyMs: 8,
    connectedAt: Date.now() - 360000,
    lastActiveAt: Date.now() - 2000,
  },
  {
    id: "dev_local_2",
    name: "Google Pixel 8",
    platform: "android",
    browser: "Chrome Mobile 122",
    ip: "192.168.1.115",
    latencyMs: 12,
    connectedAt: Date.now() - 180000,
    lastActiveAt: Date.now() - 5000,
  },
];

function LocalManageSessionContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "tok_dev";
  const gatewayPort = Number.parseInt(
    searchParams.get("gateway_port") || searchParams.get("gateway") || "7331",
    10,
  );
  const shortCode = searchParams.get("code") || "4B7-Z9X";
  const targetPort = Number.parseInt(searchParams.get("port") || "3000", 10);

  const [devices, setDevices] = useState<ConnectedDevice[]>(INITIAL_DEVICES);
  const [isTerminated, setIsTerminated] = useState(false);

  const connectionUrl = `http://127.0.0.1:${gatewayPort}/?relay_token=${token}`;

  const disconnectDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  return (
    <main className="min-h-screen bg-zinc-950 font-sans text-zinc-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              href="/connect"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              ← Connect
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="font-mono text-sm font-semibold text-zinc-200">
              Session:{" "}
              <span className="text-emerald-400 font-bold">{sessionId}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isTerminated ? "Closed" : "Local Gateway Active"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/view/${sessionId}?token=${token}&gateway=${gatewayPort}`}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-950/40"
            >
              Launch Live View & Replay →
            </Link>
            {!isTerminated && (
              <button
                type="button"
                onClick={() => setIsTerminated(true)}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-rose-950 hover:text-rose-400 border border-zinc-800 text-zinc-400 text-xs transition-colors"
              >
                Terminate Session
              </button>
            )}
          </div>
        </div>

        {/* 7a: Connection Details */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔗</span> Connection & Pairing Details
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Local Network Only
            </span>
          </div>

          <div className="flex justify-center">
            <ConnectionDetailsCard
              sessionId={sessionId}
              shortCode={shortCode}
              connectionUrl={connectionUrl}
              targetPort={targetPort}
              isRemote={false}
              viewHref={`/view/${sessionId}?token=${token}&gateway=${gatewayPort}`}
            />
          </div>
        </section>

        {/* 7b: Connected Devices List */}
        <section className="space-y-4 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📱</span> Connected Devices ({devices.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click any device to launch into its live session view and
                inspect real-time telemetry and comments.
              </p>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="p-8 text-center border border-zinc-800/80 rounded-2xl bg-zinc-900/50 text-zinc-500 text-xs">
              No devices currently connected. Scan the QR code above or run the
              CLI connect command to pair a device.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>
                          {device.platform === "ios"
                            ? "🍏"
                            : device.platform === "android"
                              ? "🤖"
                              : "💻"}
                        </span>
                        <span>{device.name}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 font-mono">
                        {device.browser} • {device.ip}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {device.latencyMs}ms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                    <span className="text-zinc-500 text-[11px]">
                      Uptime:{" "}
                      {Math.round((Date.now() - device.connectedAt) / 60000)}m
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => disconnectDevice(device.id)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-colors"
                      >
                        Disconnect
                      </button>
                      <Link
                        href={`/view/${sessionId}?token=${token}&gateway=${gatewayPort}&device=${device.id}`}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                      >
                        Live Session View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function LocalManageSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs font-mono">
          Loading Local Session Manager...
        </div>
      }
    >
      <LocalManageSessionContent params={params} />
    </Suspense>
  );
}
