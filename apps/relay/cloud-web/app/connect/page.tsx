"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ConnectionDetailsCard } from "@/components/connect/ConnectionDetailsCard";

interface ConnectFlowProps {
  isCloudAvailable?: boolean;
}

export function ConnectFlow({ isCloudAvailable = true }: ConnectFlowProps) {
  const searchParams = useSearchParams();

  // Session parameters passed from CLI
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

  // Flow step state: 'choose-mode' | 'auth' | 'subscription' | 'connecting' | 'details'
  const [step, setStep] = useState<
    "choose-mode" | "auth" | "subscription" | "connecting" | "details"
  >("choose-mode");

  const [selectedMode, setSelectedMode] = useState<"local" | "remote">("local");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Connection URL
  const connectionUrl =
    selectedMode === "remote"
      ? `https://${sessionId}.relay.paddy.systems/?relay_token=${token}`
      : `http://${host}:${gatewayPort}/?relay_token=${token}`;

  const handleSelectMode = (mode: "local" | "remote") => {
    setSelectedMode(mode);
    if (mode === "local") {
      setStep("connecting");
      setTimeout(() => setStep("details"), 600);
    } else {
      // Step 4a: Check authentication for remote cloud
      if (!isLoggedIn) {
        setStep("auth");
      } else if (!hasSubscription) {
        // Step 4ai: Check cloud subscription
        setStep("subscription");
      } else {
        setStep("connecting");
        setTimeout(() => setStep("details"), 600);
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    // Check subscription after login
    if (!hasSubscription) {
      setStep("subscription");
    } else {
      setStep("connecting");
      setTimeout(() => setStep("details"), 600);
    }
  };

  const handleActivateSubscription = () => {
    setHasSubscription(true);
    setStep("connecting");
    setTimeout(() => setStep("details"), 600);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-950 font-sans text-zinc-100">
      {/* Step 1: Mode Selection */}
      {step === "choose-mode" && (
        <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-emerald-400 font-semibold tracking-wider uppercase">
              Relay Connection Setup
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
            {/* Local Network Relay Card */}
            <button
              type="button"
              onClick={() => handleSelectMode("local")}
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

            {/* Remote Cloud Relay Card */}
            {isCloudAvailable ? (
              <button
                type="button"
                onClick={() => handleSelectMode("remote")}
                className="text-left p-5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-blue-500/60 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    <span>🌐</span>
                    <span>Remote Cloud Relay</span>
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 uppercase">
                    Encrypted WAN Tunnel
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Generate a public or team-locked URL on{" "}
                  <span className="font-mono text-zinc-300">
                    *.relay.paddy.systems
                  </span>
                  . Share with external clients, mobile networks, or remote
                  teammates.
                </p>
              </button>
            ) : null}
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

      {/* Step 4a: Remote Cloud Auth Prompt */}
      {step === "auth" && (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-mono text-xs text-blue-400 font-semibold tracking-wider uppercase">
              Cloud Authentication Required
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            {isSignUp ? "Create Relay Cloud Account" : "Sign in to Relay Cloud"}
          </h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Remote WAN tunnels require an authenticated account to provision
            end-to-end encrypted endpoints and prevent unauthorized port
            exposing.
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs text-zinc-300 font-medium mb-1.5"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="developer@paddy.systems"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-sans text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs text-zinc-300 font-medium mb-1.5"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-sans text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition-colors shadow-lg"
            >
              {isSignUp ? "Sign Up & Continue →" : "Sign In & Continue →"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Need an account? Create one"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={() => setStep("choose-mode")}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Mode Selection
            </button>
          </div>
        </div>
      )}

      {/* Step 4ai: Subscription Flow */}
      {step === "subscription" && (
        <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-xs text-amber-400 font-semibold tracking-wider uppercase">
              Relay Cloud Subscription
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Activate Cloud Tunnel Subscription
          </h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Remote tunneling and global session replay require an active Cloud
            subscription. Start with our risk-free 14-day trial or select a
            plan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Pro Developer
                </span>
                <div className="text-xl font-extrabold text-white mt-1">
                  $19
                  <span className="text-xs text-zinc-400 font-normal">/mo</span>
                </div>
                <ul className="text-xs text-zinc-400 space-y-2 mt-3">
                  <li>✓ Unlimited WAN Cloud Tunnels</li>
                  <li>✓ In-Context Pin Comments & Replays</li>
                  <li>✓ 30-Day Recording Storage</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={handleActivateSubscription}
                className="mt-4 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            <div className="p-4 rounded-xl border border-blue-800/60 bg-blue-950/20 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Team Edition
                </span>
                <div className="text-xl font-extrabold text-white mt-1">
                  $49
                  <span className="text-xs text-zinc-400 font-normal">/mo</span>
                </div>
                <ul className="text-xs text-zinc-300 space-y-2 mt-3">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Team Access Lock (SSO / Auth)</li>
                  <li>✓ Shared Device Farm & Audit Logs</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={handleActivateSubscription}
                className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg"
              >
                Start Team Trial
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <button
              type="button"
              onClick={() => handleSelectMode("local")}
              className="hover:text-zinc-300 transition-colors"
            >
              ← Use Free Local Relay Instead
            </button>
            <span>Cancel anytime</span>
          </div>
        </div>
      )}

      {/* Step 5: Connecting Handshake Animation */}
      {step === "connecting" && (
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-1">
            Establishing Relay Tunnel...
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Routing :{port} via{" "}
            {selectedMode === "remote" ? "WAN Cloud" : "Local Gateway"}
          </p>
        </div>
      )}

      {/* Step 6: Dedicated Connection Details View */}
      {step === "details" && (
        <ConnectionDetailsCard
          sessionId={sessionId}
          shortCode={shortCode}
          connectionUrl={connectionUrl}
          targetPort={port}
          isRemote={selectedMode === "remote"}
          manageHref={`/manage/${sessionId}?token=${token}&gateway=${gatewayPort}&code=${shortCode}&port=${port}&mode=${selectedMode}`}
          viewHref={`/view/${sessionId}?token=${token}&gateway=${gatewayPort}`}
        />
      )}
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs font-mono">
          Loading Relay Connect...
        </div>
      }
    >
      <ConnectFlow isCloudAvailable={true} />
    </Suspense>
  );
}
