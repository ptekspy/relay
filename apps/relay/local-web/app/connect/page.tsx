"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ConnectionDetailsCard } from "@/components/connect/ConnectionDetailsCard";

export function LocalConnectFlow() {
  const searchParams = useSearchParams();

  const sessionId =
    searchParams.get("session_id") ||
    `rl_${Math.random().toString(36).slice(2, 10)}`;
  const token = searchParams.get("token") || "tok_dev";
  const shortCode = searchParams.get("short_code") || "4B7-Z9X";
  const port = Number.parseInt(searchParams.get("port") || "3000", 10);
  const gatewayPort = Number.parseInt(
    searchParams.get("gateway_port") || "7331",
    10,
  );
  const host = searchParams.get("host") || "127.0.0.1";

  const [step, setStep] = useState<"choose-mode" | "connecting" | "details">(
    "choose-mode",
  );

  const connectionUrl = `http://${host}:${gatewayPort}/?relay_token=${token}`;

  const handleSelectLocal = () => {
    setStep("connecting");
    setTimeout(() => setStep("details"), 600);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-950 font-sans text-zinc-100">
      {step === "choose-mode" && (
        <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-emerald-400 font-semibold tracking-wider uppercase">
              Relay Local Connection Setup
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Choose Connection Mode
          </h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Select how you would like to route incoming device traffic to your
            local port{" "}
            <span className="text-emerald-400 font-mono font-semibold">
              :{port}
            </span>
            .
          </p>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <button
              type="button"
              onClick={handleSelectLocal}
              className="text-left p-5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-emerald-500/60 hover:bg-zinc-900/60 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <span>📶</span>
                  <span>Local Network Relay</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                  Free • No Auth
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect secondary phones, tablets, and test devices directly on
                the same local Wi-Fi or LAN. Sub-millisecond latency with
                peer-to-peer streaming.
              </p>
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>Session: {sessionId}</span>
            <Link
              href="/docs"
              className="hover:text-zinc-300 transition-colors"
            >
              Documentation →
            </Link>
          </div>
        </div>
      )}

      {step === "connecting" && (
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-1">
            Establishing Local Gateway...
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Routing :{port} via Local Gateway :{gatewayPort}
          </p>
        </div>
      )}

      {step === "details" && (
        <ConnectionDetailsCard
          sessionId={sessionId}
          shortCode={shortCode}
          connectionUrl={connectionUrl}
          targetPort={port}
          isRemote={false}
          manageHref={`/manage/${sessionId}?token=${token}&gateway=${gatewayPort}&code=${shortCode}&port=${port}&mode=local`}
          viewHref={`/view/${sessionId}?token=${token}&gateway=${gatewayPort}`}
        />
      )}
    </main>
  );
}

export default function LocalConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs font-mono">
          Loading Local Connect...
        </div>
      }
    >
      <LocalConnectFlow />
    </Suspense>
  );
}
